'use client'

import * as React from 'react'
import type { TaskWithApplication, TaskPriority } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Calendar,
  AlertCircle,
  RotateCcw,
  Loader2,
  X,
  ChevronDown,
  Target,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ZenTaskFocusProps {
  tasks: TaskWithApplication[]
  activeTaskId: string | null
  onSelectTask: (taskId: string | null) => void
  onCompleteTask: (task: TaskWithApplication) => Promise<void>
  isMutatingTaskIds?: Set<string>
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function ZenTaskFocus({
  tasks,
  activeTaskId,
  onSelectTask,
  onCompleteTask,
  isMutatingTaskIds = new Set(),
  error,
  onRetry,
  className,
}: ZenTaskFocusProps) {
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false)

  const activeTask = React.useMemo(() => {
    return tasks.find(t => t.id === activeTaskId) ?? null
  }, [tasks, activeTaskId])

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10'
      case 'medium':
        return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
      case 'low':
      default:
        return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    }
  }

  return (
    <div
      className={cn('w-full max-w-md mx-auto space-y-3', className)}
      data-testid="zen-task-focus-container"
    >
      {/* Error state */}
      {error && (
        <div
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 flex items-center justify-between gap-3 text-red-700 dark:text-red-300"
          role="alert"
          data-testid="zen-task-error"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs font-medium break-words">{error}</p>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="min-h-[44px] shrink-0 border-red-500/30 hover:bg-red-500/10 gap-1 touch-manipulation text-xs"
              data-testid="zen-task-retry-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Coba Lagi</span>
            </Button>
          )}
        </div>
      )}

      {/* Active Pinned Task Focus Card */}
      {activeTask ? (
        <div
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs relative transition-all"
          data-testid="zen-active-task-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Completion Checkbox with 44x44px interactive target */}
              <button
                type="button"
                role="checkbox"
                aria-checked={false}
                disabled={isMutatingTaskIds.has(activeTask.id)}
                onClick={() => onCompleteTask(activeTask)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-lg text-label-secondary hover:text-label-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation disabled:opacity-50 shrink-0 cursor-pointer"
                data-testid={`zen-task-complete-btn-${activeTask.id}`}
                aria-label={`Tandai selesai tugas: ${activeTask.title}`}
              >
                <div className="h-5 w-5 rounded-md border border-[var(--border-strong)] bg-background flex items-center justify-center transition-colors hover:border-amber-500">
                  {isMutatingTaskIds.has(activeTask.id) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  )}
                </div>
              </button>

              <div className="min-w-0 space-y-1 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Fokus Utama</span>
                  </span>
                  <span
                    className={cn(
                      'text-[9px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full border shrink-0',
                      getPriorityBadgeClass(activeTask.priority)
                    )}
                  >
                    {activeTask.priority}
                  </span>
                </div>

                <h4
                  className="text-sm font-semibold text-[var(--text-primary)] break-words line-clamp-2"
                  title={activeTask.title}
                  data-testid="zen-active-task-title"
                >
                  {activeTask.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                  {activeTask.application && (
                    <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                      <Building2 className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                      <span>
                        {activeTask.application.company_name} — {activeTask.application.job_title}
                      </span>
                    </span>
                  )}
                  {activeTask.due_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                      <span>{activeTask.due_date}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clear active focus button */}
            <button
              type="button"
              onClick={() => onSelectTask(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation shrink-0 cursor-pointer"
              data-testid="zen-clear-task-btn"
              aria-label="Lepaskan fokus dari tugas ini"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* No active task selected */
        <div className="space-y-2">
          {tasks.length > 0 ? (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSelectorOpen(prev => !prev)}
                className="w-full min-h-[44px] justify-between text-xs sm:text-sm font-medium border-[var(--border-default)] hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] touch-manipulation px-3.5"
                data-testid="zen-select-task-toggle"
                aria-expanded={isSelectorOpen}
                aria-label="Pilih tugas untuk fokus"
              >
                <div className="flex items-center gap-2 truncate">
                  <Target className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">Tautkan Tugas ke Sesi Fokus</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    isSelectorOpen && 'rotate-180'
                  )}
                />
              </Button>

              {/* Collapsible task picker dropdown */}
              {isSelectorOpen && (
                <div
                  className="mt-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-2 shadow-depth-2 space-y-1 max-h-56 overflow-y-auto"
                  data-testid="zen-task-picker-list"
                >
                  {tasks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTask(t.id)
                        setIsSelectorOpen(false)
                      }}
                      className="w-full min-h-[44px] text-left p-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors text-xs flex items-center justify-between gap-2 touch-manipulation cursor-pointer group"
                      data-testid={`zen-task-option-${t.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-primary)] truncate">
                          {t.title}
                        </p>
                        {t.application && (
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">
                            {t.application.company_name}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0',
                          getPriorityBadgeClass(t.priority)
                        )}
                      >
                        {t.priority}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Zero tasks: Fokus Mandiri */
            <div
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 p-3 text-center"
              data-testid="zen-fokus-mandiri-notice"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Mode Fokus Mandiri (tanpa tugas tertaut)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
