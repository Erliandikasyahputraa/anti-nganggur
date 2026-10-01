import * as React from 'react'
import { cn } from '@/lib/utils'

export function ColumnManageModalSkeleton({ className }: { className?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="column-manage-modal-skeleton"
      aria-busy="true"
      aria-label="Loading column manager"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        aria-hidden="true"
      />

      {/* Modal Shell Container */}
      <div
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl max-h-[85vh] translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-2xl duration-200 rounded-2xl bg-[var(--modal-shell)] text-[var(--text-primary)] border-[var(--modal-border)] p-6 overflow-hidden',
          'max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[92vh] max-sm:p-5',
          className
        )}
      >
        <div className="space-y-4 animate-pulse">
          {/* Header */}
          <div className="space-y-1">
            <div className="h-6 w-44 bg-[var(--border-default)] rounded-md" />
            <div className="h-4 w-72 bg-[var(--surface-card-hover)] rounded" />
          </div>

          {/* Add Column Button skeleton */}
          <div className="h-10 w-36 bg-[var(--surface-card-hover)] rounded-lg border border-[var(--border-default)]" />

          {/* Column List skeleton */}
          <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-[var(--border-default)] rounded" />
                  <div className="h-4 w-5 bg-[var(--border-default)] rounded" />
                  <div className="h-4 w-28 bg-[var(--border-default)] rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-14 bg-[var(--surface-card-hover)] rounded-full" />
                  <div className="h-8 w-8 bg-[var(--surface-card-hover)] rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-[var(--modal-divider)]">
            <div className="h-3 w-64 bg-[var(--surface-card-hover)] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColumnManageModalSkeleton
