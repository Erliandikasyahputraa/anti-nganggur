'use client'

import * as React from 'react'
import type { User } from '@supabase/supabase-js'
import type { TaskWithApplication, TaskStatus } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/schemas/task.schema'
import { TaskSummaryBar } from './TaskSummaryBar'
import { TaskFilterToolbar, type TaskFilterType } from './TaskFilterToolbar'
import { TaskList } from './TaskList'
import { TaskFormModal } from './TaskFormModal'
import { TaskDeleteDialog } from './TaskDeleteDialog'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  createTaskAction,
  updateTaskAction,
  toggleTaskStatusAction,
  deleteTaskAction,
} from '@/app/todos/actions'

export interface TodosWorkspaceProps {
  user: User
  initialTasks: TaskWithApplication[]
  applicationOptions: ApplicationOption[]
  initialError?: string | null
}

export function TodosWorkspace({
  user,
  initialTasks,
  applicationOptions,
  initialError,
}: TodosWorkspaceProps) {
  const [tasks, setTasks] = React.useState<TaskWithApplication[]>(initialTasks)
  const [activeFilter, setActiveFilter] = React.useState<TaskFilterType>('all')

  // Modal and Dialog states
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<TaskWithApplication | null>(null)
  const [deletingTask, setDeletingTask] = React.useState<TaskWithApplication | null>(null)

  // Loading states
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [mutatingTaskIds, setMutatingTaskIds] = React.useState<Set<string>>(new Set())

  // Keep tasks synced if initialTasks prop updates (e.g. server revalidation)
  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Derive counts for filter toolbar and summary bar using local calendar date semantics
  const filterCounts = React.useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    let todayCount = 0
    let upcomingCount = 0
    let completedCount = 0

    for (const task of tasks) {
      if (task.status === 'completed') {
        completedCount++
      } else if (task.status === 'pending') {
        if (task.due_date === todayStr) {
          todayCount++
        } else if (task.due_date && task.due_date > todayStr) {
          upcomingCount++
        }
      }
    }

    return {
      all: tasks.length,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
    }
  }, [tasks])

  // ==========================================
  // 1. OPTIMISTIC COMPLETION TOGGLE + ROLLBACK
  // ==========================================
  const handleToggleStatus = async (task: TaskWithApplication) => {
    const previousStatus = task.status
    const previousCompletedAt = task.completed_at
    const nextStatus: TaskStatus = previousStatus === 'pending' ? 'completed' : 'pending'
    const optimisticCompletedAt = nextStatus === 'completed' ? new Date().toISOString() : null

    // Track mutating task ID
    setMutatingTaskIds(prev => new Set(prev).add(task.id))

    // Step 1: Optimistic UI update
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, status: nextStatus, completed_at: optimisticCompletedAt } : t
      )
    )

    try {
      // Step 2: Call server action
      const updatedTask = await toggleTaskStatusAction(task.id, previousStatus)

      // Step 3: Success -> retain authoritative state
      setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)))
      toast.success(
        nextStatus === 'completed' ? 'Tugas ditandai selesai.' : 'Tugas dikembalikan ke pending.'
      )
    } catch (error) {
      // Step 4: Failure -> Rollback to previous state
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: previousStatus, completed_at: previousCompletedAt } : t
        )
      )

      // Step 5: Show controlled normalized error
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui status tugas. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setMutatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  // ==========================================
  // 2. CREATE TASK HANDLER
  // ==========================================
  const handleOpenCreateModal = () => {
    setEditingTask(null)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = async (inputData: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmittingForm(true)
    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = await updateTaskAction(editingTask.id, inputData)
        setTasks(prev => prev.map(t => (t.id === editingTask.id ? updatedTask : t)))
        toast.success('Tugas berhasil diperbarui.')
        setEditingTask(null)
      } else {
        // Create new task
        const newTask = await createTaskAction(inputData as CreateTaskInput)
        setTasks(prev => [newTask, ...prev])
        toast.success('Tugas berhasil dibuat.')
      }
      setIsFormModalOpen(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingTask
            ? 'Gagal memperbarui tugas.'
            : 'Gagal membuat tugas baru.'
      toast.error(message)
      throw error // rethrow to keep modal responsive to errors
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // ==========================================
  // 3. EDIT TASK HANDLER
  // ==========================================
  const handleEditTask = (task: TaskWithApplication) => {
    setEditingTask(task)
    setIsFormModalOpen(true)
  }

  // ==========================================
  // 4. DELETE TASK HANDLER
  // ==========================================
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gagal menghapus tugas. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden"
      data-testid="todos-workspace"
    >
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-label-primary tracking-tight">
            To-Do
          </h1>
          <p className="text-sm text-label-secondary mt-1">
            Kelola checklist dan tenggat waktu pencarian kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto min-h-[44px] touch-manipulation gap-2 shadow-xs"
            data-testid="add-task-button"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tugas</span>
          </Button>
        </div>
      </div>

      {/* 2. Error Boundary Banner (Controlled presentation) */}
      {initialError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3 shadow-xs"
          data-testid="workspace-error-banner"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm space-y-2">
            <p className="font-medium">{initialError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="min-h-[36px] touch-manipulation gap-1.5 border-red-500/30 hover:bg-red-500/10"
              data-testid="retry-load-button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Muat Ulang</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Task Summary Bar */}
      <TaskSummaryBar tasks={tasks} />

      {/* 4. Filter Toolbar Component */}
      <TaskFilterToolbar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {/* 5. Task List Component */}
      <TaskList
        tasks={tasks}
        activeFilter={activeFilter}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
        mutatingTaskIds={mutatingTaskIds}
        onCreateClick={handleOpenCreateModal}
      />

      {/* 6. Create / Edit Task Form Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        applicationOptions={applicationOptions}
        isSubmitting={isSubmittingForm}
      />

      {/* 7. Delete Confirmation Dialog */}
      <TaskDeleteDialog
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        task={deletingTask}
        isDeleting={isDeleting}
      />

      {/* Hidden debug metadata for test validation */}
      <div
        className="hidden"
        data-testid="workspace-metadata"
        data-user-id={user.id}
        data-options-count={applicationOptions.length}
      />
    </div>
  )
}
