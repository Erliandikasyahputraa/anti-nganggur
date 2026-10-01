'use client'

import * as React from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface JobDescriptionProps {
  application: Application
  className?: string
}

export function JobDescription({ application, className }: JobDescriptionProps) {
  return (
    <div className={cn('space-y-4 sm:space-y-6 min-w-0 max-w-full w-full', className)}>
      {/* Job URL */}
      {application.job_url && (
        <section className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-4 sm:p-6 shadow-xs min-w-0 max-w-full w-full">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <ExternalLink
              className="h-4 w-4 text-[hsl(var(--copper-dark))] shrink-0"
              aria-hidden="true"
            />
            Job Posting
          </h3>
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[hsl(var(--copper-dark))] hover:underline transition-colors duration-150 font-medium text-sm break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0"
          >
            View Original Job Posting
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        </section>
      )}

      {/* Job Description */}
      {application.job_description && (
        <section className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-4 sm:p-6 shadow-xs min-w-0 max-w-full w-full">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3">
            Job Description
          </h3>
          <div
            className="prose prose-sm max-w-none text-[var(--text-secondary)] break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: application.job_description }}
          />
        </section>
      )}

      {/* Notes */}
      {application.notes && (
        <section className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-4 sm:p-6 shadow-xs min-w-0 max-w-full w-full">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3">
            Notes
          </h3>
          <div className="prose prose-sm max-w-none text-[var(--text-secondary)] whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0 leading-relaxed">
            {application.notes}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!application.job_description && !application.notes && !application.job_url && (
        <section className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-6 sm:p-12 text-center shadow-xs min-w-0">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center">
              <FileText className="h-6 w-6 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No Details Available
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              This application doesn't have any job description or notes yet.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
