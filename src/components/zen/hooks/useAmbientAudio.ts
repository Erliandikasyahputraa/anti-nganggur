'use client'

import * as React from 'react'

export type AmbientSoundType = 'off' | 'pink' | 'brown' | 'white'

export interface UseAmbientAudioReturn {
  sound: AmbientSoundType
  volume: number
  isPlaying: boolean
  setSound: (sound: AmbientSoundType) => void
  setVolume: (volume: number) => void
  toggleSound: (sound: AmbientSoundType) => void
}

const STORAGE_KEY_SOUND = 'zen_ambient_sound'
const STORAGE_KEY_VOLUME = 'zen_ambient_volume'

const VALID_SOUND_VALUES: AmbientSoundType[] = ['off', 'pink', 'brown', 'white']

function getSavedSound(): AmbientSoundType {
  if (typeof window === 'undefined') return 'off'
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND)
    if (saved !== null && (VALID_SOUND_VALUES as string[]).includes(saved)) {
      return saved as AmbientSoundType
    }
  } catch {
    // Ignore localStorage error
  }
  return 'off'
}

function getSavedVolume(): number {
  if (typeof window === 'undefined') return 0.5
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME)
    if (saved !== null) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed
      }
    }
  } catch {
    // Ignore localStorage error
  }
  return 0.5
}

function generateNoiseBuffer(
  audioCtx: AudioContext,
  type: Exclude<AmbientSoundType, 'off'>
): AudioBuffer {
  // 5 seconds buffer at audioCtx sample rate
  const bufferSize = audioCtx.sampleRate * 5
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2
    }
  } else if (type === 'pink') {
    // Paul Kellet's filtered pink noise generator
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07
      b6 = white * 0.115926
    }
  } else if (type === 'brown') {
    // Brown noise (integrated random walk with leak)
    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 0.8
    }
  }

  return buffer
}

export function useAmbientAudio(): UseAmbientAudioReturn {
  const [sound, setSoundState] = React.useState<AmbientSoundType>(getSavedSound)
  const [volume, setVolumeState] = React.useState<number>(getSavedVolume)

  // Keep references to AudioContext and nodes to guarantee clean lifecycle
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const gainNodeRef = React.useRef<GainNode | null>(null)
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null)

  // Lazily get or create AudioContext upon explicit user gesture
  const getOrCreateAudioContext = React.useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return null

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {})
    }

    // Ensure master GainNode is created and attached
    if (!gainNodeRef.current) {
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime)
      gainNode.connect(audioContextRef.current.destination)
      gainNodeRef.current = gainNode
    }

    return audioContextRef.current
  }, [volume])

  // Stop current active source
  const stopCurrentSource = React.useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
      } catch {
        // Ignore if already stopped
      }
      try {
        sourceNodeRef.current.disconnect()
      } catch {
        // Ignore disconnect errors
      }
      sourceNodeRef.current = null
    }
  }, [])

  // Change sound type
  const setSound = React.useCallback(
    (newSound: AmbientSoundType) => {
      stopCurrentSource()

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_SOUND, newSound)
        } catch {
          // Ignore
        }
      }

      if (newSound === 'off') {
        setSoundState('off')
        return
      }

      const audioCtx = getOrCreateAudioContext()
      if (!audioCtx || !gainNodeRef.current) {
        setSoundState('off')
        return
      }

      try {
        const buffer = generateNoiseBuffer(audioCtx, newSound)
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(gainNodeRef.current)
        source.start(0)

        sourceNodeRef.current = source
        setSoundState(newSound)
      } catch (err) {
        console.error('Failed to start ambient audio:', err)
        setSoundState('off')
      }
    },
    [getOrCreateAudioContext, stopCurrentSource]
  )

  // Toggle sound: clicking active sound turns it off
  const toggleSound = React.useCallback(
    (selectedSound: AmbientSoundType) => {
      if (sound === selectedSound) {
        setSound('off')
      } else {
        setSound(selectedSound)
      }
    },
    [sound, setSound]
  )

  // Update volume
  const setVolume = React.useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clamped)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped))
      } catch {
        // Ignore
      }
    }

    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(clamped, audioContextRef.current.currentTime)
      } catch {
        gainNodeRef.current.gain.value = clamped
      }
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCurrentSource()

      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.disconnect()
        } catch {
          // Ignore
        }
        gainNodeRef.current = null
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close().catch(() => {})
        } catch {
          // Ignore
        }
        audioContextRef.current = null
      }
    }
  }, [stopCurrentSource])

  return {
    sound,
    volume,
    isPlaying: sound !== 'off',
    setSound,
    setVolume,
    toggleSound,
  }
}
