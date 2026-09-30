'use client'

import * as React from 'react'
import { Edit2, Trash2, ExternalLink, X, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ActionButtonsProps {
  application: Application
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  isDisabled?: boolean
}

export function ActionButtons({
  application,
  onEdit,
  onDelete,
  onClose,
  isDisabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Desktop >= 640px: View Job Link */}
      {application.job_url && (
        <a
          href={application.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs',
            'text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)]',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
          <span>View Job</span>
        </a>
      )}

      {/* Desktop >= 640px: Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isDisabled}
        className="hidden sm:inline-flex items-center transition-all duration-150 rounded-lg text-[var(--text-primary)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)] border-[var(--border-default)]"
      >
        <Edit2 className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
        <span>Edit</span>
      </Button>

      {/* Desktop >= 640px: Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={isDisabled}
        className={cn(
          'hidden sm:inline-flex items-center',
          'bg-red-500/10 text-red-700 dark:text-red-400',
          'border-red-200 dark:border-red-900/50',
          'hover:bg-red-500/20 transition-all duration-150 rounded-lg'
        )}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        <span>Delete</span>
      </Button>

      {/* Mobile < 640px: More Actions Dropdown Menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--text-primary)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)] border-[var(--border-default)] transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[var(--modal-shell)] border-[var(--modal-border)] text-[var(--text-primary)] p-1 shadow-xl rounded-xl z-[60]"
          >
            {application.job_url && (
              <DropdownMenuItem asChild>
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer w-full text-[var(--text-primary)] py-2 px-2.5 rounded-lg hover:bg-[var(--surface-card-hover)]"
                >
                  <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>View Job Posting</span>
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onEdit}
              disabled={isDisabled}
              className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)] py-2 px-2.5 rounded-lg hover:bg-[var(--surface-card-hover)]"
            >
              <Edit2 className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDisabled}
              className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 py-2 px-2.5 rounded-lg"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Close Button - Always visible with minimum 44x44 target on mobile */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className={cn(
          'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          'hover:bg-[var(--surface-card-hover)] transition-all duration-150',
          'min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] p-2 rounded-lg'
        )}
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  )
}
