'use client'

import * as React from 'react'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApplicationDetailLayout } from './components/ApplicationDetailLayout'
import { useApplicationDetail } from './hooks/useApplicationDetail'
import ApplicationForm from '../ApplicationForm'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Custom DialogContent without built-in close button (100% Solid, Opaque Surface Architecture)
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-[var(--surface-overlay)] backdrop-blur-[2px]'
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 border shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl bg-[var(--modal-shell)] text-[var(--text-primary)] border-[var(--modal-border)]',
        'max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[92vh] max-sm:border-x-0 max-sm:border-b-0',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export interface ApplicationDetailProps {
  application: Application
  customColumns?: CustomColumnDB[]
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isOpen: boolean
}

export function ApplicationDetail({
  application,
  customColumns = [],
  onUpdate,
  onDelete,
  onClose,
  isOpen,
}: ApplicationDetailProps) {
  const {
    activeTab,
    isEditMode,
    isDeleteDialogOpen,
    isSubmitting,
    isDeleting,
    error,
    setActiveTab,
    setDeleteDialogOpen,
    setError: _setError,
    handleEditClick,
    handleCancelEdit,
    handleFormSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useApplicationDetail({
    application,
    onUpdate,
    onDelete,
    onClose,
  })

  const [pendingTaskCount, setPendingTaskCount] = React.useState<number | undefined>(undefined)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            'w-full overflow-hidden p-0 bg-[var(--modal-shell)] text-[var(--text-primary)] border border-[var(--modal-border)] shadow-2xl rounded-2xl',
            isEditMode ? 'max-w-5xl h-auto max-h-[90vh]' : 'max-w-[85vw] h-full max-h-[90vh]',
            'max-sm:max-w-full max-sm:w-full max-sm:h-auto max-sm:max-h-[92vh] max-sm:rounded-t-2xl max-sm:rounded-b-none'
          )}
        >
          {/* Visually Hidden Title for Accessibility */}
          <VisuallyHidden>
            <DialogTitle>
              Application Details: {application.job_title} at {application.company_name}
            </DialogTitle>
            <DialogDescription>
              View and edit job application details for {application.job_title} position at{' '}
              {application.company_name}
            </DialogDescription>
          </VisuallyHidden>
          {error && (
            <div className="bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800/60 rounded-xl m-4 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {isEditMode ? (
            <div className="flex flex-col max-h-[90vh] max-sm:max-h-[92vh] bg-[var(--modal-shell)] overflow-hidden">
              {/* Edit Mode Header */}
              <div className="bg-[var(--modal-header)] border-b border-[var(--modal-divider)] rounded-t-2xl max-sm:rounded-t-2xl p-4 sm:p-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Edit Application
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                      Update the details for your application to {application.company_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] p-2 rounded-lg"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Form Content - Scrollable with recessed canvas background */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--modal-canvas)]">
                <ApplicationForm
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancelEdit}
                  initialData={{
                    company_name: application.company_name,
                    job_title: application.job_title,
                    job_url: application.job_url ?? '',
                    location: application.location ?? '',
                    salary_range: application.salary_range ?? '',
                    status: application.status,
                    date_applied: application.date_applied,
                    notes: application.notes ?? '',
                  }}
                  isLoading={isSubmitting}
                  submitButtonText="Save Changes"
                />
              </div>
            </div>
          ) : (
            <ApplicationDetailLayout
              application={application}
              customColumns={customColumns}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={onClose}
              isEditMode={isEditMode}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={handleEditClick}
              onDeleteClick={handleDeleteClick}
              pendingTaskCount={pendingTaskCount}
              onPendingCountChange={setPendingTaskCount}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[var(--modal-shell)] text-[var(--text-primary)] border border-[var(--modal-border)] rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              This action cannot be undone. This will permanently delete the application for{' '}
              <strong className="text-[var(--text-primary)]">{application.company_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-card-hover)]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

ApplicationDetail.displayName = 'ApplicationDetail'
