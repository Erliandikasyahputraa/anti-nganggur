'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardApplication } from '@/lib/types/database.types'
import { getStatusStyles, getStatusLabel } from '@/lib/utils/status-colors'

export function RecentActivity({ applications }: { applications: DashboardApplication[] }) {
  return (
    <Card className="w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Recently Updated Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="flex justify-center p-4">
            <p className="text-sm text-[var(--text-secondary)]">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {applications.map(app => (
              <div
                key={app.id}
                className="flex flex-col gap-1 border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      {app.job_title}
                    </h4>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      {app.company_name}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusStyles(app.status).badge}`}
                  >
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Updated {formatDistanceToNow(parseISO(app.updated_at || app.created_at))} ago
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
