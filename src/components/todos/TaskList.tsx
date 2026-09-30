'use client'

import * as React from 'react'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { TaskFilterType } from './TaskFilterToolbar'
import { TaskItem } from './TaskItem'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListTodo, Calendar, Clock, CheckCircle2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { sortTasksDeterministically } from '@/lib/api/tasks'

export interface TaskListProps {
  tasks: TaskWithApplication[]
  activeFilter: TaskFilterType
  onToggleStatus: (task: TaskWithApplication) => void
  onEdit: (task: TaskWithApplication) => void
  onDelete: (task: TaskWithApplication) => void
  mutatingTaskIds?: Set<string>
  onCreateClick?: () => void
}

export function TaskList({
  tasks,
  activeFilter,
  onToggleStatus,
  onEdit,
  onDelete,
  mutatingTaskIds = new Set(),
  onCreateClick,
}: TaskListProps) {
  // Filter tasks based on strict local date semantics
  const filteredTasks = React.useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    const filtered = tasks.filter(task => {
      switch (activeFilter) {
        case 'today':
          return task.status === 'pending' && task.due_date === todayStr
        case 'upcoming':
          return task.status === 'pending' && Boolean(task.due_date && task.due_date > todayStr)
        case 'completed':
          return task.status === 'completed'
        case 'all':
        default:
          return true
      }
    })

    if (typeof sortTasksDeterministically === 'function') {
      return sortTasksDeterministically(filtered)
    }
    return filtered
  }, [tasks, activeFilter])

  // Contextual empty state definitions
  const emptyStateConfig = React.useMemo(() => {
    if (tasks.length === 0) {
      return {
        title: 'Belum Ada Tugas',
        description: 'Mulai lacak jadwal interview, persiapan teknis, atau follow-up lamaran Anda.',
        icon: ListTodo,
        showCreateAction: true,
      }
    }

    switch (activeFilter) {
      case 'today':
        return {
          title: 'Tidak Ada Tugas Hari Ini',
          description:
            'Semua tugas untuk hari ini sudah selesai atau belum ada tenggat waktu hari ini.',
          icon: Calendar,
          showCreateAction: false,
        }
      case 'upcoming':
        return {
          title: 'Tidak Ada Tugas Mendatang',
          description: 'Belum ada tugas terjadwal untuk hari-hari mendatang.',
          icon: Clock,
          showCreateAction: false,
        }
      case 'completed':
        return {
          title: 'Belum Ada Tugas Selesai',
          description: 'Tandai tugas yang sudah tuntas untuk melacak progres pencarian kerja Anda.',
          icon: CheckCircle2,
          showCreateAction: false,
        }
      case 'all':
      default:
        return {
          title: 'Belum Ada Tugas',
          description:
            'Mulai lacak jadwal interview, persiapan teknis, atau follow-up lamaran Anda.',
          icon: ListTodo,
          showCreateAction: true,
        }
    }
  }, [tasks.length, activeFilter])

  if (filteredTasks.length === 0) {
    const IconComponent = emptyStateConfig.icon
    return (
      <Card
        className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs"
        data-testid="tasks-empty-state"
      >
        <CardContent className="p-8 sm:p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-label-tertiary">
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3
              className="text-base font-semibold text-label-primary"
              data-testid="empty-tasks-title"
            >
              {emptyStateConfig.title}
            </h3>
            <p className="text-xs sm:text-sm text-label-secondary">
              {emptyStateConfig.description}
            </p>
          </div>
          {emptyStateConfig.showCreateAction && onCreateClick && (
            <div className="pt-2">
              <Button
                type="button"
                onClick={onCreateClick}
                className="min-h-[44px] touch-manipulation gap-2 shadow-xs"
                data-testid="empty-state-add-task-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Tugas Pertama</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2.5" data-testid="task-list">
      {filteredTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          isMutating={mutatingTaskIds.has(task.id)}
        />
      ))}
    </div>
  )
}
