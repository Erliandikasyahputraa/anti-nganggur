'use client'

import * as React from 'react'
import type { User } from '@supabase/supabase-js'
import type { TaskWithApplication, TaskPriority } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'
import { TaskSummaryBar } from './TaskSummaryBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  AlertCircle,
  RotateCcw,
  ListTodo,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'

export interface TodosWorkspaceProps {
  user: User
  initialTasks: TaskWithApplication[]
  applicationOptions: ApplicationOption[]
  initialError?: string | null
}

export type TaskFilterType = 'all' | 'today' | 'upcoming' | 'completed'

export function TodosWorkspace({
  user,
  initialTasks,
  applicationOptions,
  initialError,
}: TodosWorkspaceProps) {
  const [activeFilter, setActiveFilter] = React.useState<TaskFilterType>('all')

  // Derive counts for filter tabs using local date semantics
  const filterCounts = React.useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    let todayCount = 0
    let upcomingCount = 0
    let completedCount = 0

    for (const task of initialTasks) {
      if (task.status === 'completed') {
        completedCount++
      } else if (task.status === 'pending') {
        if (task.due_date === todayStr) {
          todayCount++
        } else if (task.due_date && task.due_date > todayStr) {
          upcomingCount++
        }
      }
    }

    return {
      all: initialTasks.length,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
    }
  }, [initialTasks])

  const filterTabs: Array<{ id: TaskFilterType; label: string; count: number }> = [
    { id: 'all', label: 'Semua', count: filterCounts.all },
    { id: 'today', label: 'Hari Ini', count: filterCounts.today },
    { id: 'upcoming', label: 'Mendatang', count: filterCounts.upcoming },
    { id: 'completed', label: 'Selesai', count: filterCounts.completed },
  ]

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
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden"
      data-testid="todos-workspace"
    >
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-label-primary tracking-tight">
            To-Do
          </h1>
          <p className="text-sm text-label-secondary mt-1">
            Kelola checklist dan tenggat waktu pencarian kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="w-full sm:w-auto min-h-[44px] touch-manipulation gap-2 shadow-xs"
            disabled
            title="Formulir tambah tugas akan tersedia pada pembaruan berikutnya"
            data-testid="add-task-button-shell"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tugas</span>
          </Button>
        </div>
      </div>

      {/* 2. Error Boundary Banner (Controlled presentation) */}
      {initialError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3 shadow-xs"
          data-testid="workspace-error-banner"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm space-y-2">
            <p className="font-medium">{initialError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="min-h-[36px] touch-manipulation gap-1.5 border-red-500/30 hover:bg-red-500/10"
              data-testid="retry-load-button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Muat Ulang</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Task Summary Bar */}
      <TaskSummaryBar tasks={initialTasks} />

      {/* 4. Filter Toolbar Shell */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 flex items-center gap-1.5 min-h-[40px] touch-manipulation ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-[var(--surface-card)] text-label-secondary hover:text-label-primary border border-[var(--border-default)]'
              }`}
              data-testid={`filter-tab-${tab.id}`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-label-tertiary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 5. Content Area */}
      <div className="space-y-3" data-testid="task-content-area">
        {initialTasks.length === 0 ? (
          /* Empty Task State */
          <Card className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs">
            <CardContent className="p-8 sm:p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-label-tertiary">
                <ListTodo className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3
                  className="text-base font-semibold text-label-primary"
                  data-testid="empty-tasks-title"
                >
                  Belum Ada Tugas
                </h3>
                <p className="text-xs sm:text-sm text-label-secondary">
                  Mulai lacak jadwal interview, persiapan teknis, atau follow-up lamaran Anda.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Initial Task Data Shell (Pre-TaskList phase) */
          <div className="space-y-2" data-testid="task-initial-list">
            {initialTasks.map(task => (
              <Card
                key={task.id}
                className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs hover:border-[var(--border-focus)] transition-colors"
                data-testid={`task-shell-item-${task.id}`}
              >
                <CardContent className="p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold ${
                          task.status === 'completed'
                            ? 'line-through text-label-tertiary'
                            : 'text-label-primary'
                        }`}
                      >
                        {task.title}
                      </span>
                      <Badge
                        variant={getPriorityBadgeVariant(task.priority)}
                        className="text-[10px]"
                      >
                        {task.priority.toUpperCase()}
                      </Badge>
                      {task.status === 'completed' && (
                        <Badge variant="glass-success" className="text-[10px] gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          SELESAI
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-label-secondary line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-label-tertiary flex-wrap pt-0.5">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{task.due_date}</span>
                        </span>
                      )}
                      {task.application && (
                        <span className="flex items-center gap-1 font-medium text-label-secondary">
                          <Building2 className="h-3 w-3" />
                          <span>
                            {task.application.company_name} — {task.application.job_title}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden debug metadata for test validation */}
      <div
        className="hidden"
        data-testid="workspace-metadata"
        data-user-id={user.id}
        data-options-count={applicationOptions.length}
      />
    </div>
  )
}
