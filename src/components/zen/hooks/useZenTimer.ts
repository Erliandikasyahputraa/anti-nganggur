'use client'

import * as React from 'react'

export type ZenTimerPreset = 15 | 25 | 50
export type ZenTimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface UseZenTimerOptions {
  initialPreset?: ZenTimerPreset
  onComplete?: () => void
}

export interface UseZenTimerReturn {
  status: ZenTimerStatus
  preset: ZenTimerPreset
  durationMs: number
  remainingMs: number
  progress: number // 0 to 1
  formattedTime: string
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setPreset: (preset: ZenTimerPreset) => void
}

const PRESET_DURATIONS: Record<ZenTimerPreset, number> = {
  15: 15 * 60 * 1000,
  25: 25 * 60 * 1000,
  50: 50 * 60 * 1000,
}

const STORAGE_KEY_PRESET = 'zen_timer_preset'

function getSavedPreset(fallback: ZenTimerPreset = 25): ZenTimerPreset {
  if (typeof window === 'undefined') return fallback
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRESET)
    if (saved === '15' || saved === '25' || saved === '50') {
      return Number(saved) as ZenTimerPreset
    }
  } catch {
    // Ignore localStorage errors
  }
  return fallback
}

export function formatTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function useZenTimer(options: UseZenTimerOptions = {}): UseZenTimerReturn {
  const { initialPreset, onComplete } = options

  // Lazy initialize preset from localStorage or prop
  const [preset, setPresetState] = React.useState<ZenTimerPreset>(() => {
    return initialPreset ?? getSavedPreset(25)
  })

  const [status, setStatus] = React.useState<ZenTimerStatus>('idle')
  const durationMs = PRESET_DURATIONS[preset]

  const [remainingMs, setRemainingMs] = React.useState<number>(durationMs)

  // Tracking timestamps for non-drifting countdown
  const startTimestampRef = React.useRef<number | null>(null)
  const pausedRemainingMsRef = React.useRef<number>(durationMs)
  const statusRef = React.useRef<ZenTimerStatus>(status)
  statusRef.current = status

  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  // Recalculate remaining time from Date.now() timestamp
  const syncRemainingTime = React.useCallback(() => {
    if (statusRef.current !== 'running' || startTimestampRef.current === null) {
      return
    }

    const elapsed = Date.now() - startTimestampRef.current
    const newRemaining = Math.max(0, pausedRemainingMsRef.current - elapsed)

    setRemainingMs(newRemaining)

    if (newRemaining === 0) {
      setStatus('completed')
      statusRef.current = 'completed'
      startTimestampRef.current = null
      pausedRemainingMsRef.current = 0
      onCompleteRef.current?.()
    }
  }, [])

  // Start timer
  const start = React.useCallback(() => {
    if (statusRef.current === 'running') return

    const now = Date.now()
    if (statusRef.current === 'idle' || statusRef.current === 'completed') {
      pausedRemainingMsRef.current = PRESET_DURATIONS[preset]
      setRemainingMs(PRESET_DURATIONS[preset])
    }

    startTimestampRef.current = now
    setStatus('running')
    statusRef.current = 'running'
  }, [preset])

  // Pause timer
  const pause = React.useCallback(() => {
    if (statusRef.current !== 'running') return

    const now = Date.now()
    const elapsed = now - (startTimestampRef.current ?? now)
    const newRemaining = Math.max(0, pausedRemainingMsRef.current - elapsed)

    pausedRemainingMsRef.current = newRemaining
    startTimestampRef.current = null
    setRemainingMs(newRemaining)
    setStatus('paused')
    statusRef.current = 'paused'
  }, [])

  // Resume timer
  const resume = React.useCallback(() => {
    if (statusRef.current !== 'paused') return

    startTimestampRef.current = Date.now()
    setStatus('running')
    statusRef.current = 'running'
  }, [])

  // Reset timer
  const reset = React.useCallback(() => {
    startTimestampRef.current = null
    const dur = PRESET_DURATIONS[preset]
    pausedRemainingMsRef.current = dur
    setRemainingMs(dur)
    setStatus('idle')
    statusRef.current = 'idle'
  }, [preset])

  // Change preset
  const setPreset = React.useCallback((newPreset: ZenTimerPreset) => {
    setPresetState(newPreset)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PRESET, String(newPreset))
      } catch {
        // Ignore localStorage error
      }
    }

    const newDuration = PRESET_DURATIONS[newPreset]
    startTimestampRef.current = null
    pausedRemainingMsRef.current = newDuration
    setRemainingMs(newDuration)
    setStatus('idle')
    statusRef.current = 'idle'
  }, [])

  // Interval loop (every ~250ms when running)
  React.useEffect(() => {
    if (status !== 'running') return

    const intervalId = setInterval(() => {
      syncRemainingTime()
    }, 250)

    return () => clearInterval(intervalId)
  }, [status, syncRemainingTime])

  // Visibilitychange listener to recover accurately when tab was backgrounded
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && statusRef.current === 'running') {
        syncRemainingTime()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncRemainingTime])

  const progress = durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0
  const formattedTime = formatTime(remainingMs)

  return {
    status,
    preset,
    durationMs,
    remainingMs,
    progress,
    formattedTime,
    start,
    pause,
    resume,
    reset,
    setPreset,
  }
}
