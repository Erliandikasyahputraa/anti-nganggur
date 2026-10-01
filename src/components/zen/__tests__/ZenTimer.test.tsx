import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useZenTimer, formatTime } from '../hooks/useZenTimer'
import { ZenTimer } from '../ZenTimer'
import { ZenTimerControls } from '../ZenTimerControls'

describe('useZenTimer Hook & ZenTimer Components', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatTime helper', () => {
    it('formats milliseconds to MM:SS correctly', () => {
      expect(formatTime(25 * 60 * 1000)).toBe('25:00')
      expect(formatTime(15 * 60 * 1000)).toBe('15:00')
      expect(formatTime(50 * 60 * 1000)).toBe('50:00')
      expect(formatTime(65 * 1000)).toBe('01:05')
      expect(formatTime(9 * 1000)).toBe('00:09')
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(-500)).toBe('00:00')
    })
  })

  describe('useZenTimer Hook', () => {
    it('initializes with default 25m preset', () => {
      const { result } = renderHook(() => useZenTimer())

      expect(result.current.status).toBe('idle')
      expect(result.current.preset).toBe(25)
      expect(result.current.durationMs).toBe(25 * 60 * 1000)
      expect(result.current.remainingMs).toBe(25 * 60 * 1000)
      expect(result.current.formattedTime).toBe('25:00')
      expect(result.current.progress).toBe(0)
    })

    it('initializes with explicit preset (15m, 50m)', () => {
      const { result: res15 } = renderHook(() => useZenTimer({ initialPreset: 15 }))
      expect(res15.current.preset).toBe(15)
      expect(res15.current.remainingMs).toBe(15 * 60 * 1000)
      expect(res15.current.formattedTime).toBe('15:00')

      const { result: res50 } = renderHook(() => useZenTimer({ initialPreset: 50 }))
      expect(res50.current.preset).toBe(50)
      expect(res50.current.remainingMs).toBe(50 * 60 * 1000)
      expect(res50.current.formattedTime).toBe('50:00')
    })

    it('starts countdown and tracks timestamp delta accurately', () => {
      const { result } = renderHook(() => useZenTimer({ initialPreset: 25 }))

      act(() => {
        result.current.start()
      })

      expect(result.current.status).toBe('running')

      // Advance by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.status).toBe('running')
      expect(result.current.remainingMs).toBe(25 * 60 * 1000 - 10000)
      expect(result.current.formattedTime).toBe('24:50')
      expect(result.current.progress).toBeCloseTo(10000 / (25 * 60 * 1000), 4)
    })

    it('pauses and resumes without loss of elapsed time', () => {
      const { result } = renderHook(() => useZenTimer({ initialPreset: 25 }))

      act(() => {
        result.current.start()
      })

      // Run 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      act(() => {
        result.current.pause()
      })

      expect(result.current.status).toBe('paused')
      expect(result.current.remainingMs).toBe(25 * 60 * 1000 - 30000)
      expect(result.current.formattedTime).toBe('24:30')

      // Time passes while paused; timer should NOT advance
      act(() => {
        vi.advanceTimersByTime(60000)
      })

      expect(result.current.remainingMs).toBe(25 * 60 * 1000 - 30000)
      expect(result.current.formattedTime).toBe('24:30')

      // Resume
      act(() => {
        result.current.resume()
      })

      expect(result.current.status).toBe('running')

      // Advance another 20 seconds
      act(() => {
        vi.advanceTimersByTime(20000)
      })

      expect(result.current.remainingMs).toBe(25 * 60 * 1000 - 50000)
      expect(result.current.formattedTime).toBe('24:10')
    })

    it('resets timer to initial preset duration', () => {
      const { result } = renderHook(() => useZenTimer({ initialPreset: 25 }))

      act(() => {
        result.current.start()
        vi.advanceTimersByTime(45000)
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.remainingMs).toBe(25 * 60 * 1000)
      expect(result.current.formattedTime).toBe('25:00')
      expect(result.current.progress).toBe(0)
    })

    it('switches preset cleanly and persists to localStorage', () => {
      const { result } = renderHook(() => useZenTimer())

      act(() => {
        result.current.setPreset(50)
      })

      expect(result.current.preset).toBe(50)
      expect(result.current.remainingMs).toBe(50 * 60 * 1000)
      expect(result.current.formattedTime).toBe('50:00')
      expect(localStorage.getItem('zen_timer_preset')).toBe('50')

      // If running, switching preset resets to idle using new preset
      act(() => {
        result.current.start()
        vi.advanceTimersByTime(10000)
        result.current.setPreset(15)
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.preset).toBe(15)
      expect(result.current.remainingMs).toBe(15 * 60 * 1000)
      expect(result.current.formattedTime).toBe('15:00')
    })

    it('triggers onComplete when countdown reaches zero', () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useZenTimer({ initialPreset: 15, onComplete }))

      act(() => {
        result.current.start()
      })

      // Advance the full 15 minutes
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000)
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.remainingMs).toBe(0)
      expect(result.current.formattedTime).toBe('00:00')
      expect(result.current.progress).toBe(1)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('recovers accurate remaining time across visibilitychange even if ticks were delayed', () => {
      const { result } = renderHook(() => useZenTimer({ initialPreset: 25 }))

      act(() => {
        result.current.start()
      })

      // Simulate tab backgrounding: Date.now advances by 300,000ms (5 mins)
      // but UI ticks were suppressed or delayed
      const realDateNow = Date.now
      const baseTime = Date.now()
      Date.now = vi.fn().mockReturnValue(baseTime + 300000)

      // Dispatch visibilitychange event
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(result.current.remainingMs).toBe(25 * 60 * 1000 - 300000)
      expect(result.current.formattedTime).toBe('20:00')

      // Restore Date.now
      Date.now = realDateNow
    })

    it('cleans up interval on unmount without throwing errors', () => {
      const { result, unmount } = renderHook(() => useZenTimer({ initialPreset: 25 }))

      act(() => {
        result.current.start()
      })

      unmount()

      // Advancing timer after unmount should not trigger errors
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(10000)
        })
      }).not.toThrow()
    })
  })

  describe('ZenTimer & ZenTimerControls Components', () => {
    it('renders timer display with correct time and status', () => {
      render(<ZenTimer formattedTime="25:00" progress={0} status="idle" />)

      expect(screen.getByRole('timer')).toBeInTheDocument()
      expect(screen.getByTestId('zen-timer-digits')).toHaveTextContent('25:00')
      expect(screen.getByTestId('zen-timer-status-badge')).toHaveTextContent('Siap Memulai')
    })

    it('renders controls and dispatches start, pause, resume, reset', () => {
      const onStart = vi.fn()
      const onPause = vi.fn()
      const onResume = vi.fn()
      const onReset = vi.fn()
      const onSelectPreset = vi.fn()

      const { rerender } = render(
        <ZenTimerControls
          status="idle"
          preset={25}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onReset={onReset}
          onSelectPreset={onSelectPreset}
        />
      )

      // Idle: Start button visible
      const startBtn = screen.getByTestId('zen-btn-start')
      fireEvent.click(startBtn)
      expect(onStart).toHaveBeenCalledTimes(1)

      // Preset selection
      const preset15 = screen.getByTestId('zen-preset-15')
      fireEvent.click(preset15)
      expect(onSelectPreset).toHaveBeenCalledWith(15)

      // Running: Pause & Reset visible
      rerender(
        <ZenTimerControls
          status="running"
          preset={25}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onReset={onReset}
          onSelectPreset={onSelectPreset}
        />
      )

      const pauseBtn = screen.getByTestId('zen-btn-pause')
      fireEvent.click(pauseBtn)
      expect(onPause).toHaveBeenCalledTimes(1)

      // Paused: Resume & Reset visible
      rerender(
        <ZenTimerControls
          status="paused"
          preset={25}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onReset={onReset}
          onSelectPreset={onSelectPreset}
        />
      )

      const resumeBtn = screen.getByTestId('zen-btn-resume')
      fireEvent.click(resumeBtn)
      expect(onResume).toHaveBeenCalledTimes(1)

      const resetBtn = screen.getByTestId('zen-btn-reset-paused')
      fireEvent.click(resetBtn)
      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })
})
