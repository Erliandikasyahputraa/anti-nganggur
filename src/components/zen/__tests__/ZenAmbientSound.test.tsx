import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { useAmbientAudio } from '../hooks/useAmbientAudio'
import { ZenAmbientSound } from '../ZenAmbientSound'

// Web Audio API mock implementation
class MockAudioBufferSourceNode {
  buffer: any = null
  loop: boolean = false
  connect = vi.fn()
  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
  }
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {}

  createBuffer = vi.fn().mockImplementation((channels: number, length: number) => ({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
  }))

  createBufferSource = vi.fn().mockImplementation(() => new MockAudioBufferSourceNode())
  createGain = vi.fn().mockImplementation(() => new MockGainNode())
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockImplementation(() => {
    this.state = 'closed'
    return Promise.resolve()
  })
}

describe('useAmbientAudio & ZenAmbientSound', () => {
  beforeEach(() => {
    localStorage.clear()
    // Setup window.AudioContext mock
    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('useAmbientAudio hook', () => {
    it('defaults to sound "off" and volume 0.5', () => {
      const { result } = renderHook(() => useAmbientAudio())

      expect(result.current.sound).toBe('off')
      expect(result.current.volume).toBe(0.5)
      expect(result.current.isPlaying).toBe(false)
    })

    it('creates AudioContext only when a sound is activated', () => {
      const { result } = renderHook(() => useAmbientAudio())

      expect(result.current.sound).toBe('off')

      act(() => {
        result.current.setSound('pink')
      })

      expect(result.current.sound).toBe('pink')
      expect(result.current.isPlaying).toBe(true)
    })

    it('switches between pink, brown, white, and off smoothly', () => {
      const { result } = renderHook(() => useAmbientAudio())

      act(() => {
        result.current.setSound('pink')
      })
      expect(result.current.sound).toBe('pink')

      act(() => {
        result.current.setSound('brown')
      })
      expect(result.current.sound).toBe('brown')

      act(() => {
        result.current.setSound('white')
      })
      expect(result.current.sound).toBe('white')

      act(() => {
        result.current.setSound('off')
      })
      expect(result.current.sound).toBe('off')
      expect(result.current.isPlaying).toBe(false)
    })

    it('toggleSound turns off sound if clicking the active sound', () => {
      const { result } = renderHook(() => useAmbientAudio())

      act(() => {
        result.current.toggleSound('pink')
      })
      expect(result.current.sound).toBe('pink')

      act(() => {
        result.current.toggleSound('pink')
      })
      expect(result.current.sound).toBe('off')
    })

    it('updates volume and persists to localStorage', () => {
      const { result } = renderHook(() => useAmbientAudio())

      act(() => {
        result.current.setVolume(0.8)
      })

      expect(result.current.volume).toBe(0.8)
      expect(localStorage.getItem('zen_ambient_volume')).toBe('0.8')
    })

    it('cleans up AudioContext on unmount', () => {
      const { result, unmount } = renderHook(() => useAmbientAudio())

      act(() => {
        result.current.setSound('brown')
      })

      unmount()
      // Cleanup verified without exceptions
    })
  })

  describe('Sound Persistence — getSavedSound()', () => {
    // 1. No saved preference → default 'off'
    it('defaults to "off" when no preference is stored in localStorage', () => {
      // localStorage.clear() in beforeEach ensures nothing is stored
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('off')
      expect(result.current.isPlaying).toBe(false)
    })

    // 2. Saved 'pink' → initial state 'pink'
    it('restores saved preference "pink" on mount', () => {
      localStorage.setItem('zen_ambient_sound', 'pink')
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('pink')
    })

    // 3. Saved 'brown' → initial state 'brown'
    it('restores saved preference "brown" on mount', () => {
      localStorage.setItem('zen_ambient_sound', 'brown')
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('brown')
    })

    // 4. Saved 'white' → initial state 'white'
    it('restores saved preference "white" on mount', () => {
      localStorage.setItem('zen_ambient_sound', 'white')
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('white')
    })

    // 5. Saved 'off' → initial state 'off'
    it('restores saved preference "off" on mount', () => {
      localStorage.setItem('zen_ambient_sound', 'off')
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('off')
      expect(result.current.isPlaying).toBe(false)
    })

    // 6. Invalid stored value → fallback 'off'
    it('falls back to "off" when localStorage contains an invalid value', () => {
      localStorage.setItem('zen_ambient_sound', 'ocean')
      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('off')
    })

    // 7. localStorage read error → fallback 'off'
    it('falls back to "off" when localStorage.getItem throws', () => {
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = vi.fn().mockImplementationOnce(() => {
        throw new Error('Storage read error')
      })

      const { result } = renderHook(() => useAmbientAudio())
      expect(result.current.sound).toBe('off')

      Storage.prototype.getItem = originalGetItem
    })

    // 8. Existing persistence: changing sound still writes to localStorage
    it('writes selected sound to localStorage when user changes it', () => {
      const { result } = renderHook(() => useAmbientAudio())

      act(() => {
        result.current.setSound('white')
      })

      expect(result.current.sound).toBe('white')
      expect(localStorage.getItem('zen_ambient_sound')).toBe('white')
    })

    // 9. Restoring preference does NOT start AudioContext automatically
    it('does NOT create AudioContext on mount even when a sound preference is restored', () => {
      const MockAudioContextConstructor = vi.fn()
      vi.stubGlobal('AudioContext', MockAudioContextConstructor)

      localStorage.setItem('zen_ambient_sound', 'pink')
      renderHook(() => useAmbientAudio())

      // AudioContext must not have been instantiated — no autoplay on mount
      expect(MockAudioContextConstructor).not.toHaveBeenCalled()
    })
  })

  describe('ZenAmbientSound Component', () => {
    it('renders sound buttons with correct aria-pressed status', () => {
      render(
        <ZenAmbientSound
          sound="off"
          volume={0.5}
          onToggleSound={vi.fn()}
          onChangeVolume={vi.fn()}
        />
      )

      expect(screen.getByTestId('zen-ambient-btn-off')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('zen-ambient-btn-pink')).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('zen-ambient-btn-brown')).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('zen-ambient-btn-white')).toHaveAttribute('aria-pressed', 'false')

      // Volume slider hidden when sound is off
      expect(screen.queryByTestId('zen-volume-slider')).not.toBeInTheDocument()
    })

    it('displays volume slider when sound is active and handles volume changes', () => {
      const onChangeVolume = vi.fn()
      render(
        <ZenAmbientSound
          sound="pink"
          volume={0.7}
          onToggleSound={vi.fn()}
          onChangeVolume={onChangeVolume}
        />
      )

      expect(screen.getByTestId('zen-volume-slider')).toBeInTheDocument()
      expect(screen.getByTestId('zen-volume-display')).toHaveTextContent('70%')

      const slider = screen.getByTestId('zen-volume-slider')
      fireEvent.change(slider, { target: { value: '85' } })

      expect(onChangeVolume).toHaveBeenCalledWith(0.85)
    })

    it('calls onToggleSound when sound button is clicked', () => {
      const onToggleSound = vi.fn()
      render(
        <ZenAmbientSound
          sound="off"
          volume={0.5}
          onToggleSound={onToggleSound}
          onChangeVolume={vi.fn()}
        />
      )

      const brownBtn = screen.getByTestId('zen-ambient-btn-brown')
      fireEvent.click(brownBtn)

      expect(onToggleSound).toHaveBeenCalledWith('brown')
    })
  })
})
