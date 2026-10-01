'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { ZenTimerPreset, ZenTimerStatus } from './hooks/useZenTimer'
import { cn } from '@/lib/utils'

export interface ZenTimerControlsProps {
  status: ZenTimerStatus
  preset: ZenTimerPreset
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSelectPreset: (preset: ZenTimerPreset) => void
  className?: string
}

const PRESET_OPTIONS: Array<{ preset: ZenTimerPreset; label: string; description: string }> = [
  { preset: 15, label: '15m', description: 'Quick Sprint' },
  { preset: 25, label: '25m', description: 'Focus' },
  { preset: 50, label: '50m', description: 'Deep Work' },
]

export function ZenTimerControls({
  status,
  preset,
  onStart,
  onPause,
  onResume,
  onReset,
  onSelectPreset,
  className,
}: ZenTimerControlsProps) {
  return (
    <div className={cn('flex flex-col items-center gap-6 w-full max-w-md mx-auto', className)}>
      {/* Preset selection pills */}
      <div
        className="flex items-center justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] w-full"
        role="group"
        aria-label="Pilih durasi sesi fokus"
        data-testid="zen-preset-group"
      >
        {PRESET_OPTIONS.map(opt => {
          const isSelected = preset === opt.preset
          return (
            <button
              key={opt.preset}
              type="button"
              onClick={() => onSelectPreset(opt.preset)}
              className={cn(
                'flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer flex flex-col items-center justify-center',
                isSelected
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              aria-pressed={isSelected}
              data-testid={`zen-preset-${opt.preset}`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] font-normal text-[var(--text-muted)] line-clamp-1">
                {opt.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center justify-center gap-4 w-full">
        {status === 'idle' && (
          <Button
            type="button"
            size="lg"
            onClick={onStart}
            className="min-h-[48px] px-8 btn-brand-gradient text-sm sm:text-base font-semibold shadow-depth-1 hover:shadow-depth-2 transition-all gap-2 touch-manipulation cursor-pointer flex-1 sm:flex-initial"
            data-testid="zen-btn-start"
            aria-label="Mulai sesi fokus"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Mulai Fokus</span>
          </Button>
        )}

        {status === 'running' && (
          <>
            <Button
              type="button"
              size="lg"
              onClick={onPause}
              variant="outline"
              className="min-h-[48px] px-6 text-sm sm:text-base font-semibold border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] gap-2 touch-manipulation cursor-pointer flex-1 sm:flex-initial"
              data-testid="zen-btn-pause"
              aria-label="Jeda sesi fokus"
            >
              <Pause className="h-5 w-5 fill-current" />
              <span>Jeda</span>
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onReset}
              variant="ghost"
              className="min-h-[48px] px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-2 touch-manipulation cursor-pointer"
              data-testid="zen-btn-reset"
              aria-label="Reset timer ke awal"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button
              type="button"
              size="lg"
              onClick={onResume}
              className="min-h-[48px] px-8 btn-brand-gradient text-sm sm:text-base font-semibold shadow-depth-1 hover:shadow-depth-2 transition-all gap-2 touch-manipulation cursor-pointer flex-1 sm:flex-initial"
              data-testid="zen-btn-resume"
              aria-label="Lanjutkan sesi fokus"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Lanjut</span>
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onReset}
              variant="ghost"
              className="min-h-[48px] px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-2 touch-manipulation cursor-pointer"
              data-testid="zen-btn-reset-paused"
              aria-label="Reset timer ke awal"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </>
        )}

        {status === 'completed' && (
          <>
            <Button
              type="button"
              size="lg"
              onClick={onStart}
              className="min-h-[48px] px-8 btn-brand-gradient text-sm sm:text-base font-semibold shadow-depth-1 hover:shadow-depth-2 transition-all gap-2 touch-manipulation cursor-pointer flex-1 sm:flex-initial"
              data-testid="zen-btn-restart"
              aria-label="Mulai sesi baru"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Mulai Lagi</span>
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onReset}
              variant="ghost"
              className="min-h-[48px] px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-2 touch-manipulation cursor-pointer"
              data-testid="zen-btn-reset-completed"
              aria-label="Kembalikan ke status siap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
