'use client'

import * as React from 'react'
import type { ZenTimerStatus } from './hooks/useZenTimer'
import { cn } from '@/lib/utils'

export interface ZenTimerProps {
  formattedTime: string
  progress: number
  status: ZenTimerStatus
  className?: string
}

export function ZenTimer({ formattedTime, progress, status, className }: ZenTimerProps) {
  // SVG circular ring calculations
  const size = 260
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const statusLabel = React.useMemo(() => {
    switch (status) {
      case 'running':
        return 'Fokus Berjalan'
      case 'paused':
        return 'Sesi Dijeda'
      case 'completed':
        return 'Sesi Selesai'
      case 'idle':
      default:
        return 'Siap Memulai'
    }
  }, [status])

  const statusBadgeClass = React.useMemo(() => {
    switch (status) {
      case 'running':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
      case 'paused':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      case 'idle':
      default:
        return 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
    }
  }, [status])

  return (
    <div
      className={cn('flex flex-col items-center justify-center p-6 sm:p-8', className)}
      data-testid="zen-timer-container"
    >
      {/* Screen reader live announcement region */}
      <div className="sr-only" role="status" aria-live="polite">
        {status === 'running' && 'Sesi fokus dimulai'}
        {status === 'paused' && 'Sesi fokus dijeda'}
        {status === 'completed' && 'Sesi fokus selesai! Istirahatlah sejenak.'}
      </div>

      {/* Circular Progress & Display */}
      <div
        className="relative flex items-center justify-center w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]"
        role="timer"
        aria-live="off"
        aria-label={`Waktu tersisa: ${formattedTime}`}
        data-testid="zen-timer-display"
      >
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-[var(--border-subtle)]"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn(
              'transition-all duration-300 ease-out',
              status === 'completed'
                ? 'stroke-emerald-500'
                : 'stroke-amber-600 dark:stroke-amber-500'
            )}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {/* Status Badge */}
          <span
            className={cn(
              'px-2.5 py-0.5 text-xs font-semibold rounded-full border mb-2 transition-colors',
              statusBadgeClass
            )}
            data-testid="zen-timer-status-badge"
          >
            {statusLabel}
          </span>

          {/* Time digits */}
          <span
            className="text-5xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums font-mono select-none"
            data-testid="zen-timer-digits"
          >
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  )
}
