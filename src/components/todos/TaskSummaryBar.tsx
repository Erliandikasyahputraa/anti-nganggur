'use client'

import * as React from 'react'
import { Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import type { TaskWithApplication } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

export interface TaskSummaryBarProps {
  tasks: TaskWithApplication[]
  className?: string
}

export function TaskSummaryBar({ tasks, className }: TaskSummaryBarProps) {
  // Derive counts using user local calendar date
  const { totalPending, dueToday, completed } = React.useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    let pendingCount = 0
    let todayCount = 0
    let completedCount = 0

    for (const task of tasks) {
      if (task.status === 'pending') {
        pendingCount++
        if (task.due_date === todayStr) {
          todayCount++
        }
      } else if (task.status === 'completed') {
        completedCount++
      }
    }

    return {
      totalPending: pendingCount,
      dueToday: todayCount,
      completed: completedCount,
    }
  }, [tasks])

  const summaryItems = [
    {
      id: 'pending',
      label: 'Tugas Tertunda',
      value: totalPending,
      icon: Clock,
      iconColor: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      testId: 'summary-pending-count',
    },
    {
      id: 'today',
      label: 'Hari Ini',
      value: dueToday,
      icon: Calendar,
      iconColor:
        dueToday > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400',
      bgColor: dueToday > 0 ? 'bg-amber-500/10' : 'bg-slate-500/10',
      borderColor: dueToday > 0 ? 'border-amber-500/20' : 'border-slate-500/20',
      testId: 'summary-today-count',
    },
    {
      id: 'completed',
      label: 'Selesai',
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      testId: 'summary-completed-count',
    },
  ]

  return (
    <div
      className={cn('grid grid-cols-3 gap-2 sm:gap-4', className)}
      data-testid="task-summary-bar"
    >
      {summaryItems.map(item => {
        const Icon = item.icon
        return (
          <Card
            key={item.id}
            className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs transition-colors"
          >
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-label-secondary truncate">
                  {item.label}
                </p>
                <p
                  className="text-base sm:text-xl font-bold text-label-primary tracking-tight"
                  data-testid={item.testId}
                >
                  {item.value}
                </p>
              </div>
              <div
                className={cn(
                  'h-7 w-7 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 border ml-2',
                  item.bgColor,
                  item.borderColor
                )}
                aria-hidden="true"
              >
                <Icon className={cn('h-3.5 w-3.5 sm:h-4.5 sm:w-4.5', item.iconColor)} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
