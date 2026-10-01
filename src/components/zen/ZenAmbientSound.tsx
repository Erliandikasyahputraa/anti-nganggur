'use client'

import * as React from 'react'
import type { AmbientSoundType } from './hooks/useAmbientAudio'
import { CloudRain, Waves, Wind, VolumeX, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ZenAmbientSoundProps {
  sound: AmbientSoundType
  volume: number
  onToggleSound: (sound: AmbientSoundType) => void
  onChangeVolume: (volume: number) => void
  className?: string
}

const SOUND_OPTIONS: Array<{
  type: AmbientSoundType
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { type: 'off', label: 'Hening', sublabel: 'Off', icon: VolumeX },
  { type: 'pink', label: 'Pink Noise', sublabel: 'Hujan Lembut', icon: CloudRain },
  { type: 'brown', label: 'Brown Noise', sublabel: 'Deburan Ombak', icon: Waves },
  { type: 'white', label: 'White Noise', sublabel: 'Derau Angin', icon: Wind },
]

export function ZenAmbientSound({
  sound,
  volume,
  onToggleSound,
  onChangeVolume,
  className,
}: ZenAmbientSoundProps) {
  const isPlaying = sound !== 'off'

  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto p-4 rounded-2xl bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)] space-y-4',
        className
      )}
      data-testid="zen-ambient-sound-container"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="text-xs font-semibold text-[var(--text-primary)]">Suara Ambient</h4>
        </div>
        {isPlaying && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Memutar
          </span>
        )}
      </div>

      {/* Sound Options Buttons */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="group"
        aria-label="Pilih suara ambient"
        data-testid="zen-ambient-options-group"
      >
        {SOUND_OPTIONS.map(opt => {
          const isSelected = sound === opt.type
          const Icon = opt.icon

          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => onToggleSound(opt.type)}
              className={cn(
                'min-h-[44px] p-2.5 rounded-xl text-left transition-all touch-manipulation cursor-pointer flex flex-col justify-between border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                isSelected
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-amber-500/40 shadow-xs'
                  : 'bg-[var(--surface-card)]/40 text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
              )}
              aria-pressed={isSelected}
              data-testid={`zen-ambient-btn-${opt.type}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{opt.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{opt.sublabel}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Volume Slider (shown when sound is active) */}
      {isPlaying && (
        <div
          className="pt-1 border-t border-[var(--border-subtle)] flex items-center gap-3"
          data-testid="zen-ambient-volume-slider-container"
        >
          <label htmlFor="zen-volume-slider" className="sr-only">
            Volume suara ambient
          </label>
          <Volume2 className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          <input
            id="zen-volume-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(volume * 100)}
            onChange={e => onChangeVolume(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-[var(--border-default)] rounded-lg appearance-none cursor-pointer accent-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Volume suara ambient"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            data-testid="zen-volume-slider"
          />
          <span
            className="text-xs font-mono text-[var(--text-muted)] tabular-nums w-8 text-right shrink-0"
            data-testid="zen-volume-display"
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}
