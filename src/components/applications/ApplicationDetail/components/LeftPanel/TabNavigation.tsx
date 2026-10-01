'use client'

import * as React from 'react'
import { FileText, Building, FolderOpen, Clock, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType } from '../../types'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  disabled?: boolean
  variant?: 'sidebar' | 'bottom-bar'
  pendingTaskCount?: number
  items?: Array<{
    id: TabType
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
  }>
}

const allTabItems: Array<{
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FileText,
    description: 'Job description and details',
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building,
    description: 'Company information and research',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    description: 'Resume, cover letter, and attachments',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    description: 'Activity history',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Checklist and action items',
  },
]

export function TabNavigation({
  activeTab,
  onTabChange,
  disabled = false,
  variant = 'sidebar',
  pendingTaskCount,
  items,
}: TabNavigationProps) {
  const handleTabClick = React.useCallback(
    (tabId: TabType) => {
      if (!disabled) {
        onTabChange(tabId)
      }
    },
    [disabled, onTabChange]
  )

  const tabItems = items ?? allTabItems

  if (variant === 'bottom-bar') {
    return (
      <nav
        className="flex items-center gap-1 p-1 overflow-x-auto scrollbar-none snap-x w-full max-w-full min-w-0"
        role="tablist"
        aria-label="Application detail navigation"
      >
        {tabItems.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              disabled={disabled}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'relative flex-1 min-w-[68px] sm:min-w-[76px] shrink-0 sm:shrink snap-center flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                'min-h-[48px]',
                isActive
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-recessed)]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isActive && (
                <span
                  className="absolute top-1 w-6 h-[2px] rounded-full bg-amber-700 dark:bg-amber-400"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0 transition-colors mb-0.5',
                  isActive ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--text-muted)]'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-[11px] sm:text-xs leading-none truncate whitespace-nowrap max-w-full',
                  isActive ? 'font-semibold text-amber-700 dark:text-amber-400' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
              {tab.id === 'tasks' &&
                typeof pendingTaskCount === 'number' &&
                pendingTaskCount > 0 && (
                  <span
                    className="absolute top-1 right-2 sm:right-3 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-[16px] text-center leading-none shadow-xs"
                    data-testid="tasks-pending-badge"
                    aria-label={`${pendingTaskCount} pending tasks`}
                  >
                    {pendingTaskCount > 99 ? '99+' : pendingTaskCount}
                  </span>
                )}
            </button>
          )
        })}
      </nav>
    )
  }

  // variant === 'sidebar'
  return (
    <nav
      className="p-3 sm:p-4 space-y-1.5"
      role="tablist"
      aria-label="Application detail navigation"
    >
      {tabItems.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            disabled={disabled}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-left',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
              isActive
                ? 'bg-amber-500/10 dark:bg-amber-500/15 text-[var(--text-primary)] border-l-[3px] border-amber-600 dark:border-amber-500 shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-recessed)]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors',
                isActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-sm truncate',
                  isActive
                    ? 'font-semibold text-[var(--text-primary)]'
                    : 'font-medium text-[var(--text-primary)]'
                )}
              >
                {tab.label}
              </div>
              <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                {tab.description}
              </div>
            </div>
            {tab.id === 'tasks' && typeof pendingTaskCount === 'number' && pendingTaskCount > 0 && (
              <span
                className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300"
                data-testid="tasks-pending-badge"
                aria-label={`${pendingTaskCount} pending tasks`}
              >
                {pendingTaskCount > 99 ? '99+' : pendingTaskCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
