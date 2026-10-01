'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TabType } from '../../types'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'
import { JobDescription } from './JobDescription'
import { CompanyInfo } from './CompanyInfo'
import { Documents } from './Documents'
import { ApplicationTasks } from './ApplicationTasks'
import { ApplicationTimeline } from '../RightPanel/ApplicationTimeline'

interface MainPanelProps {
  application: Application
  activeTab: TabType
  customColumns?: CustomColumnDB[]
  onPendingCountChange?: (count: number) => void
  className?: string
}

export function MainPanel({
  application,
  activeTab,
  customColumns = [],
  onPendingCountChange,
  className,
}: MainPanelProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <JobDescription application={application} />
      case 'company':
        return <CompanyInfo application={application} />
      case 'documents':
        return <Documents _application={application} />
      case 'timeline':
        return <ApplicationTimeline application={application} customColumns={customColumns} />
      case 'tasks':
        return (
          <ApplicationTasks application={application} onPendingCountChange={onPendingCountChange} />
        )
      default:
        return <JobDescription application={application} />
    }
  }

  return (
    <div
      id={`${activeTab}-panel`}
      role="tabpanel"
      aria-labelledby={`${activeTab}-tab`}
      className={cn('p-4 sm:p-6 overflow-y-auto w-full max-w-full min-w-0', className)}
    >
      {renderContent()}
    </div>
  )
}
