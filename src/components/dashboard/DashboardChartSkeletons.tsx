import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ActivityCalendarSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1',
        className
      )}
      data-testid="activity-calendar-skeleton"
      aria-busy="true"
      aria-label="Loading activity calendar"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 animate-pulse">
          <div className="h-6 w-44 bg-[var(--border-default)] rounded-md" />
          <div className="h-8 w-24 bg-[var(--surface-card-hover)] rounded-md border border-[var(--border-default)]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-[var(--surface-card-hover)]/60 rounded-lg flex flex-col justify-around p-4">
            <div className="h-3 w-3/4 bg-[var(--border-default)]/40 rounded" />
            <div className="h-3 w-full bg-[var(--border-default)]/30 rounded" />
            <div className="h-3 w-5/6 bg-[var(--border-default)]/40 rounded" />
            <div className="h-3 w-2/3 bg-[var(--border-default)]/30 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusDistributionSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1',
        className
      )}
      data-testid="status-distribution-skeleton"
      aria-busy="true"
      aria-label="Loading status distribution"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 animate-pulse">
          <div className="h-6 w-36 bg-[var(--border-default)] rounded-md" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full flex items-center justify-center animate-pulse">
          <div className="h-36 w-36 rounded-full border-8 border-[var(--surface-card-hover)] bg-transparent flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-[var(--surface-card-hover)]/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
