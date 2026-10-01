import * as React from 'react'
import { cn } from '@/lib/utils'

export function ApplicationDetailModalSkeleton({ className }: { className?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="application-detail-skeleton"
      aria-busy="true"
      aria-label="Loading application details"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        aria-hidden="true"
      />

      {/* Modal Shell Container */}
      <div
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-[85vw] h-full max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-0 border shadow-2xl duration-200 rounded-2xl bg-[var(--modal-shell)] text-[var(--text-primary)] border-[var(--modal-border)] overflow-hidden',
          'max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[92vh] max-sm:border-x-0 max-sm:border-b-0',
          className
        )}
      >
        <div className="flex flex-col h-full overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-[var(--modal-header)] border-b border-[var(--modal-divider)] px-6 py-4 flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="h-6 w-52 bg-[var(--border-default)] rounded-md" />
              <div className="h-4 w-36 bg-[var(--surface-card-hover)] rounded" />
            </div>
            <div className="h-9 w-9 bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
          </div>

          {/* Body Skeleton */}
          <div className="flex-1 flex overflow-hidden max-sm:flex-col">
            {/* Left Panel (Desktop only) */}
            <div className="w-80 shrink-0 border-r border-[var(--modal-divider)] p-6 space-y-6 hidden sm:block bg-[var(--modal-shell)]">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-[var(--border-default)] rounded" />
                <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-28 bg-[var(--border-default)] rounded" />
                <div className="h-12 w-full bg-[var(--surface-card-hover)] rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-20 bg-[var(--border-default)] rounded" />
                <div className="h-10 w-full bg-[var(--surface-card-hover)] rounded-lg" />
              </div>
            </div>

            {/* Main Panel */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-[var(--modal-shell)]">
              {/* Tabs Skeleton */}
              <div className="flex gap-2 border-b border-[var(--modal-divider)] pb-3">
                <div className="h-8 w-28 bg-[var(--surface-card-hover)] rounded-md" />
                <div className="h-8 w-24 bg-[var(--surface-card-hover)] rounded-md" />
                <div className="h-8 w-24 bg-[var(--surface-card-hover)] rounded-md" />
              </div>

              {/* Main content area */}
              <div className="space-y-4">
                <div className="h-5 w-40 bg-[var(--border-default)] rounded" />
                <div className="h-28 w-full bg-[var(--surface-card-hover)] rounded-xl border border-[var(--border-default)]" />
              </div>

              <div className="space-y-4">
                <div className="h-5 w-32 bg-[var(--border-default)] rounded" />
                <div className="space-y-2">
                  <div className="h-12 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
                  <div className="h-12 w-full bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetailModalSkeleton
