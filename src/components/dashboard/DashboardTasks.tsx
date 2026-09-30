'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import type { TaskWithApplication, TaskPriority } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

export interface DashboardTasksProps {
  tasks: TaskWithApplication[]
  onToggleTask: (task: TaskWithApplication) => Promise<void>
  onRetry?: () => Promise<void>
  isMutatingTaskIds?: Set<string>
  error?: string | null
  className?: string
}

export function DashboardTasks({
  tasks,
  onToggleTask,
  onRetry,
  isMutatingTaskIds = new Set(),
  error,
  className,
}: DashboardTasksProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

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
    <Card
      className={cn(
        'w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1 flex flex-col justify-between',
        className
      )}
      data-testid="dashboard-tasks-card"
    >
      <CardHeader className="pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)] truncate">
              Tugas Mendatang
            </CardTitle>
            {!error && tasks.length > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0"
                data-testid="dashboard-tasks-count-badge"
              >
                {tasks.length}
              </span>
            )}
          </div>
          <Link
            href="/todos"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors min-h-[44px] sm:min-h-[36px] px-2 rounded-lg touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
            data-testid="dashboard-tasks-view-all-link"
            aria-label="Buka semua tugas di halaman To-Do"
          >
            <span>Buka To-Do</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1">
        {/* Error State */}
        {error ? (
          <div
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-700 dark:text-red-300"
            role="alert"
            data-testid="dashboard-tasks-error"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-xs sm:text-sm font-medium break-words">{error}</p>
            </div>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="min-h-[44px] shrink-0 border-red-500/30 hover:bg-red-500/10 gap-1.5 touch-manipulation"
                data-testid="dashboard-tasks-retry-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </Button>
            )}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div
            className="flex flex-col items-center justify-center p-6 sm:p-8 text-center"
            data-testid="dashboard-tasks-empty"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Semua tugas beres!
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xs mt-1 mb-4">
              Tidak ada tugas tertunda. Kamu bisa menambahkan tugas baru di halaman To-Do.
            </p>
            <Link href="/todos" passHref>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] touch-manipulation gap-1.5 text-xs font-semibold"
                data-testid="dashboard-tasks-empty-cta"
              >
                <span>Kelola To-Do</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          /* Task List (max 5 items) */
          <div className="space-y-3" data-testid="dashboard-tasks-list">
            {tasks.slice(0, 5).map(task => {
              const isMutating = isMutatingTaskIds.has(task.id)
              const isOverdue = Boolean(task.due_date && task.due_date < todayStr)
              const isDueToday = Boolean(task.due_date && task.due_date === todayStr)

              return (
                <div
                  key={task.id}
                  className="group rounded-xl border border-[var(--border-default)] hover:border-[var(--border-focus)] bg-[var(--surface-card)] transition-all p-3 shadow-xs flex items-start gap-2.5 sm:gap-3"
                  data-testid={`dashboard-task-item-${task.id}`}
                >
                  {/* Completion Checkbox with 44x44px touch target */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    disabled={isMutating}
                    onClick={() => onToggleTask(task)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-lg text-label-secondary hover:text-label-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 touch-manipulation disabled:opacity-50 shrink-0 cursor-pointer"
                    data-testid={`dashboard-task-checkbox-${task.id}`}
                    aria-label={`Tandai selesai: ${task.title}`}
                  >
                    <div className="h-5 w-5 rounded-md border border-[var(--border-strong)] bg-background flex items-center justify-center transition-colors group-hover:border-primary">
                      {isMutating && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-label-tertiary" />
                      )}
                    </div>
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] break-words line-clamp-1 min-w-0"
                        title={task.title}
                        data-testid={`dashboard-task-title-${task.id}`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0',
                          getPriorityBadgeClass(task.priority)
                        )}
                        data-testid={`dashboard-task-priority-${task.id}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Metadata: Due Date & Application */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {task.due_date && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1',
                            isOverdue
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : isDueToday
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-[var(--text-secondary)]'
                          )}
                          data-testid={`dashboard-task-due-${task.id}`}
                        >
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            {isOverdue
                              ? `Terlewat: ${task.due_date}`
                              : isDueToday
                                ? 'Hari ini'
                                : task.due_date}
                          </span>
                        </span>
                      )}

                      {task.application && (
                        <span
                          className="inline-flex items-center gap-1 text-[var(--text-secondary)] min-w-0"
                          data-testid={`dashboard-task-app-${task.id}`}
                        >
                          <Building2 className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                          <span className="truncate max-w-[150px] sm:max-w-[220px]">
                            {task.application.company_name} — {task.application.job_title}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
