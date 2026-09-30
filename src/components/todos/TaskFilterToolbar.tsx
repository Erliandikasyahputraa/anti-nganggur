'use client'

import * as React from 'react'

export type TaskFilterType = 'all' | 'today' | 'upcoming' | 'completed'

export interface TaskFilterToolbarProps {
  activeFilter: TaskFilterType
  onFilterChange: (filter: TaskFilterType) => void
  counts: {
    all: number
    today: number
    upcoming: number
    completed: number
  }
}

export function TaskFilterToolbar({
  activeFilter,
  onFilterChange,
  counts,
}: TaskFilterToolbarProps) {
  const filterTabs: Array<{ id: TaskFilterType; label: string; count: number }> = [
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'today', label: 'Hari Ini', count: counts.today },
    { id: 'upcoming', label: 'Mendatang', count: counts.upcoming },
    { id: 'completed', label: 'Selesai', count: counts.completed },
  ]

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      data-testid="task-filter-toolbar"
      role="toolbar"
      aria-label="Filter tugas"
    >
      {filterTabs.map(tab => {
        const isActive = activeFilter === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-[var(--surface-card)] text-label-secondary hover:text-label-primary border border-[var(--border-default)] hover:bg-[var(--surface-card-hover)]'
            }`}
            data-testid={`filter-tab-${tab.id}`}
            aria-pressed={isActive}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-label-tertiary'
              }`}
              data-testid={`filter-count-${tab.id}`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
