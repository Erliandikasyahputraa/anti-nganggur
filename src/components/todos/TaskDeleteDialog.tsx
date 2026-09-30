'use client'

import * as React from 'react'
import type { TaskWithApplication } from '@/lib/types/database.types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2 } from 'lucide-react'

export interface TaskDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  task: TaskWithApplication | null
  isDeleting?: boolean
}

export function TaskDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  task,
  isDeleting = false,
}: TaskDeleteDialogProps) {
  if (!task) return null

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isDeleting) return
    await onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !isDeleting && !open && onClose()}>
      <AlertDialogContent
        className="w-[calc(100%-2rem)] max-w-md bg-card border border-border shadow-2xl rounded-2xl p-5 sm:p-6"
        data-testid="task-delete-dialog"
      >
        <AlertDialogHeader className="space-y-2 text-left">
          <AlertDialogTitle
            className="text-lg font-bold text-label-primary tracking-tight flex items-center gap-2"
            data-testid="task-delete-dialog-title"
          >
            <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4" />
            </div>
            <span>Hapus Tugas?</span>
          </AlertDialogTitle>
          <AlertDialogDescription
            className="text-xs sm:text-sm text-label-secondary"
            data-testid="task-delete-dialog-desc"
          >
            Apakah Anda yakin ingin menghapus tugas{' '}
            <strong className="text-label-primary font-semibold">&quot;{task.title}&quot;</strong>?
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={onClose}
            className="min-h-[44px] w-full sm:w-auto touch-manipulation mt-0"
            data-testid="task-delete-cancel-btn"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={handleConfirm}
            className="min-h-[44px] w-full sm:w-auto touch-manipulation bg-red-600 hover:bg-red-700 text-white font-medium gap-2 shadow-xs transition-colors"
            data-testid="task-delete-confirm-btn"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Hapus Tugas</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
