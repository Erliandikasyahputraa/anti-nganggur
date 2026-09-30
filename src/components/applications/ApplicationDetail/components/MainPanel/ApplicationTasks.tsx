'use client'

import * as React from 'react'
import type { Application, TaskWithApplication, TaskStatus } from '@/lib/types/database.types'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/schemas/task.schema'
import { TaskItem } from '@/components/todos/TaskItem'
import { TaskFormModal } from '@/components/todos/TaskFormModal'
import { TaskDeleteDialog } from '@/components/todos/TaskDeleteDialog'
import { Button } from '@/components/ui/button'
import {
  getTasksAction,
  createTaskAction,
  updateTaskAction,
  toggleTaskStatusAction,
  deleteTaskAction,
} from '@/app/todos/actions'
import { sortTasksDeterministically } from '@/lib/api/tasks'
import { Plus, CheckSquare, AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface ApplicationTasksProps {
  application: Application
  onPendingCountChange?: (count: number) => void
  className?: string
}

export function ApplicationTasks({
  application,
  onPendingCountChange,
  className,
}: ApplicationTasksProps) {
  const [tasks, setTasks] = React.useState<TaskWithApplication[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [mutatingTaskIds, setMutatingTaskIds] = React.useState<Set<string>>(new Set())

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<TaskWithApplication | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false)

  // Delete dialog state
  const [deletingTask, setDeletingTask] = React.useState<TaskWithApplication | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch tasks scoped strictly to this application
  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedTasks = await getTasksAction({ applicationId: application.id })
      setTasks(sortTasksDeterministically(fetchedTasks))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal memuat tugas untuk lamaran ini. Silakan coba lagi.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [application.id])

  React.useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Synchronize pending task count upward
  React.useEffect(() => {
    if (!isLoading && !error) {
      const pendingCount = tasks.filter(t => t.status === 'pending').length
      onPendingCountChange?.(pendingCount)
    }
  }, [tasks, isLoading, error, onPendingCountChange])

  // 1. Optimistic status toggle with rollback
  const handleToggleStatus = async (task: TaskWithApplication) => {
    if (mutatingTaskIds.has(task.id)) return

    const previousStatus = task.status
    const previousCompletedAt = task.completed_at
    const nextStatus: TaskStatus = previousStatus === 'completed' ? 'pending' : 'completed'
    const nextCompletedAt = nextStatus === 'completed' ? new Date().toISOString() : null

    setMutatingTaskIds(prev => new Set(prev).add(task.id))

    // Optimistically update
    setTasks(prev =>
      sortTasksDeterministically(
        prev.map(t =>
          t.id === task.id ? { ...t, status: nextStatus, completed_at: nextCompletedAt } : t
        )
      )
    )

    try {
      const updatedTask = await toggleTaskStatusAction(task.id, previousStatus)
      setTasks(prev =>
        sortTasksDeterministically(prev.map(t => (t.id === task.id ? updatedTask : t)))
      )
      toast.success(
        nextStatus === 'completed' ? 'Tugas ditandai selesai.' : 'Tugas dikembalikan ke pending.'
      )
    } catch (err) {
      // Rollback to previous state
      setTasks(prev =>
        sortTasksDeterministically(
          prev.map(t =>
            t.id === task.id
              ? { ...t, status: previousStatus, completed_at: previousCompletedAt }
              : t
          )
        )
      )
      const message =
        err instanceof Error ? err.message : 'Gagal memperbarui status tugas. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setMutatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  // 2. Create Task Modal
  const handleOpenCreateModal = () => {
    setEditingTask(null)
    setIsFormModalOpen(true)
  }

  // 3. Edit Task Modal
  const handleEditTask = (task: TaskWithApplication) => {
    setEditingTask(task)
    setIsFormModalOpen(true)
  }

  // Form submit for create & edit
  const handleFormSubmit = async (inputData: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmittingForm(true)
    try {
      if (editingTask) {
        const updatedTask = await updateTaskAction(editingTask.id, inputData)
        setTasks(prev =>
          sortTasksDeterministically(prev.map(t => (t.id === editingTask.id ? updatedTask : t)))
        )
        toast.success('Tugas berhasil diperbarui.')
        setEditingTask(null)
      } else {
        const newTask = await createTaskAction(inputData as CreateTaskInput)
        setTasks(prev => sortTasksDeterministically([newTask, ...prev]))
        toast.success('Tugas berhasil dibuat.')
      }
      setIsFormModalOpen(false)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : editingTask
            ? 'Gagal memperbarui tugas.'
            : 'Gagal membuat tugas baru.'
      toast.error(message)
      throw err
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // 4. Delete Task
  const handleDeleteClick = (task: TaskWithApplication) => {
    setDeletingTask(task)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTask) return

    setIsDeleting(true)
    try {
      await deleteTaskAction(deletingTask.id)
      setTasks(prev => prev.filter(t => t.id !== deletingTask.id))
      toast.success('Tugas berhasil dihapus.')
      setDeletingTask(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghapus tugas. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  const applicationOption = [
    {
      id: application.id,
      company_name: application.company_name,
      job_title: application.job_title,
    },
  ]

  return (
    <div className={cn('space-y-6', className)} data-testid="application-tasks-panel">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--modal-divider)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Tugas Terkait
            </h2>
            {!isLoading && !error && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {pendingCount} Pending{completedCount > 0 ? ` · ${completedCount} Selesai` : ''}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Daftar tindakan dan persiapan khusus untuk lamaran di {application.company_name}.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateModal}
          className="min-h-[44px] gap-2 shrink-0 touch-manipulation shadow-xs"
          data-testid="add-task-button"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Tugas</span>
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3" data-testid="application-tasks-loading">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse p-4"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-700 dark:text-red-300"
          data-testid="application-tasks-error"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchTasks()}
            className="min-h-[44px] shrink-0 border-red-500/30 hover:bg-red-500/10 gap-1.5 touch-manipulation"
            data-testid="application-tasks-retry"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && tasks.length === 0 && (
        <div
          className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-card)]/50 p-8 sm:p-12 text-center"
          data-testid="application-tasks-empty"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3.5">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Belum ada tugas untuk lamaran ini
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mt-1 mb-5">
            Catat tindak lanjut, jadwal wawancara, persiapan dokumen, atau catatan penting lainnya
            khusus untuk lowongan ini.
          </p>
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="min-h-[44px] gap-2 touch-manipulation shadow-xs"
            data-testid="empty-add-task-button"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tugas Baru</span>
          </Button>
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && tasks.length > 0 && (
        <div className="space-y-2.5" data-testid="application-tasks-list">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditTask}
              onDelete={handleDeleteClick}
              isMutating={mutatingTaskIds.has(task.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        applicationOptions={applicationOption}
        defaultApplicationId={application.id}
        lockApplication={true}
        isSubmitting={isSubmittingForm}
      />

      {/* Delete Confirmation Dialog */}
      <TaskDeleteDialog
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        task={deletingTask}
        isDeleting={isDeleting}
      />
    </div>
  )
}
