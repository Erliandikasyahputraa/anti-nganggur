import * as React from 'react'
import { cn } from '@/lib/utils'

export function ApplicationFormSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-4 py-2 animate-pulse', className)}
      data-testid="application-form-skeleton"
      aria-busy="true"
      aria-label="Loading form"
    >
      {/* 2-column grid for Company and Job Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
      </div>

      {/* 2-column grid for Job URL and Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
      </div>

      {/* 2-column grid for Salary and Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-[var(--border-default)] rounded" />
          <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        </div>
      </div>

      {/* Textarea for Notes */}
      <div className="space-y-2">
        <div className="h-4 w-16 bg-[var(--border-default)] rounded" />
        <div className="h-24 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
        <div className="h-10 w-24 bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
        <div className="h-10 w-32 bg-[var(--accent-primary,#0284c7)] opacity-40 rounded-lg" />
      </div>
    </div>
  )
}

export default ApplicationFormSkeleton
