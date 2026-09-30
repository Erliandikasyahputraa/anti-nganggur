'use client'

import * as React from 'react'
import type { TaskWithApplication, TaskPriority } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Building2,
  Check,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

export interface TaskItemProps {
  task: TaskWithApplication
  onToggleStatus: (task: TaskWithApplication) => void
  onEdit: (task: TaskWithApplication) => void
  onDelete: (task: TaskWithApplication) => void
  isMutating?: boolean
}

export function TaskItem({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  isMutating = false,
}: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isOverdue = !isCompleted && Boolean(task.due_date && task.due_date < todayStr)

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'glass-error'
      case 'medium':
        return 'glass-warning'
      case 'low':
      default:
        return 'glass'
    }
  }

  return (
    <div
      className={`group rounded-xl border bg-[var(--surface-card)] transition-all p-3 sm:p-4 shadow-xs ${
        isCompleted
          ? 'border-[var(--border-subtle)] bg-[var(--surface-card)]/60 opacity-80'
          : isOverdue
            ? 'border-red-500/30 hover:border-red-500/50'
            : 'border-[var(--border-default)] hover:border-[var(--border-focus)]'
      }`}
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox with 44x44px touch target */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          disabled={isMutating}
          onClick={() => onToggleStatus(task)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-lg text-label-secondary hover:text-label-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation disabled:opacity-50 shrink-0"
          data-testid={`task-checkbox-${task.id}`}
          aria-label={
            isCompleted ? `Tandai belum selesai: ${task.title}` : `Tandai selesai: ${task.title}`
          }
        >
          <div
            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
                : 'border-[var(--border-strong)] bg-background group-hover:border-primary'
            }`}
          >
            {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
          {/* Header Row: Title & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className={`text-sm sm:text-base font-semibold break-words transition-colors ${
                isCompleted ? 'line-through text-label-tertiary' : 'text-label-primary'
              }`}
              data-testid={`task-title-${task.id}`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <Badge
              variant={getPriorityBadgeVariant(task.priority)}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
              data-testid={`task-priority-${task.id}`}
            >
              {task.priority}
            </Badge>

            {/* Completed Badge */}
            {isCompleted && (
              <Badge
                variant="glass-success"
                className="text-[10px] gap-1 px-2 py-0.5"
                data-testid={`task-completed-badge-${task.id}`}
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                SELESAI
              </Badge>
            )}

            {/* Overdue Badge */}
            {isOverdue && (
              <Badge
                variant="glass-error"
                className="text-[10px] gap-1 px-2 py-0.5 text-red-600 dark:text-red-400 border-red-500/30"
                data-testid={`task-overdue-badge-${task.id}`}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                TERLEWAT
              </Badge>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p
              className={`text-xs sm:text-sm break-words line-clamp-2 ${
                isCompleted ? 'text-label-tertiary' : 'text-label-secondary'
              }`}
              data-testid={`task-desc-${task.id}`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Row: Due Date & Application */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-0.5">
            {task.due_date && (
              <span
                className={`flex items-center gap-1.5 ${
                  isOverdue
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : isCompleted
                      ? 'text-label-tertiary'
                      : 'text-label-secondary'
                }`}
                data-testid={`task-duedate-${task.id}`}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{task.due_date}</span>
              </span>
            )}

            {task.application && (
              <span
                className="flex items-center gap-1.5 font-medium text-label-secondary break-words"
                data-testid={`task-app-${task.id}`}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-label-tertiary" />
                <span className="truncate max-w-[240px] sm:max-w-none">
                  {task.application.company_name} — {task.application.job_title}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Edit & Delete buttons (min 44x44px touch targets) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isMutating}
            onClick={() => onEdit(task)}
            className="min-h-[44px] min-w-[44px] text-label-secondary hover:text-label-primary rounded-lg touch-manipulation"
            aria-label={`Edit tugas ${task.title}`}
            data-testid={`task-edit-btn-${task.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isMutating}
            onClick={() => onDelete(task)}
            className="min-h-[44px] min-w-[44px] text-label-secondary hover:text-red-600 dark:hover:text-red-400 rounded-lg touch-manipulation"
            aria-label={`Hapus tugas ${task.title}`}
            data-testid={`task-delete-btn-${task.id}`}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin text-label-tertiary" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
