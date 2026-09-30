import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TodosWorkspace } from '../TodosWorkspace'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'
import type { User } from '@supabase/supabase-js'
import { format, addDays } from 'date-fns'
import * as actions from '@/app/todos/actions'
import { toast } from 'sonner'

// Mock server actions
vi.mock('@/app/todos/actions', () => ({
  createTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  toggleTaskStatusAction: vi.fn(),
  deleteTaskAction: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('TodosWorkspace Integration Tests', () => {
  const mockUser = {
    id: 'user-integ-1',
    email: 'user@example.com',
  } as User

  const mockOptions: ApplicationOption[] = [
    { id: 'app-1', company_name: 'PT Teknologi Hebat', job_title: 'Frontend Engineer' },
  ]

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const baseTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-integ-1',
      application_id: 'app-1',
      title: 'Kirim CV ke Tech Lead',
      description: 'Format PDF',
      status: 'pending',
      priority: 'high',
      due_date: todayStr,
      completed_at: null,
      created_at: '2026-09-30T10:00:00Z',
      updated_at: '2026-09-30T10:00:00Z',
      application: {
        id: 'app-1',
        company_name: 'PT Teknologi Hebat',
        job_title: 'Frontend Engineer',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-integ-1',
      application_id: null,
      title: 'Mengerjakan take-home test',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: tomorrowStr,
      completed_at: null,
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-29T10:00:00Z',
      application: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimistically toggles task completion and retains state on success', async () => {
    const completedTask: TaskWithApplication = {
      ...baseTasks[0],
      status: 'completed',
      completed_at: '2026-09-30T15:00:00Z',
    }
    ;(actions.toggleTaskStatusAction as any).mockResolvedValue(completedTask)

    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    const checkbox = screen.getByTestId('task-checkbox-task-1')
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    // Click checkbox to complete task
    fireEvent.click(checkbox)

    // Verify immediate optimistic update
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('task-title-task-1')).toHaveClass('line-through')

    // Wait for server action resolution
    await waitFor(() => {
      expect(actions.toggleTaskStatusAction).toHaveBeenCalledWith('task-1', 'pending')
      expect(toast.success).toHaveBeenCalledWith('Tugas ditandai selesai.')
    })
  })

  it('rolls back optimistic completion update when server action fails', async () => {
    ;(actions.toggleTaskStatusAction as any).mockRejectedValue(
      new Error('Koneksi terputus saat memperbarui status.')
    )

    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    const checkbox = screen.getByTestId('task-checkbox-task-1')
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    // Click checkbox
    fireEvent.click(checkbox)

    // Immediately shows completed optimistically
    expect(checkbox).toHaveAttribute('aria-checked', 'true')

    // Wait for failure and rollback
    await waitFor(() => {
      expect(actions.toggleTaskStatusAction).toHaveBeenCalledWith('task-1', 'pending')
      // Rollback to pending
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      expect(screen.getByTestId('task-title-task-1')).not.toHaveClass('line-through')
      expect(toast.error).toHaveBeenCalledWith('Koneksi terputus saat memperbarui status.')
    })
  })

  it('creates a new task through TaskFormModal and displays it in list', async () => {
    const newTask: TaskWithApplication = {
      id: 'task-new-3',
      user_id: 'user-integ-1',
      application_id: null,
      title: 'Tugas Tambahan Baru',
      description: 'Detail tugas baru',
      status: 'pending',
      priority: 'high',
      due_date: todayStr,
      completed_at: null,
      created_at: '2026-09-30T14:00:00Z',
      updated_at: '2026-09-30T14:00:00Z',
      application: null,
    }
    ;(actions.createTaskAction as any).mockResolvedValue(newTask)

    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    // Open create modal
    fireEvent.click(screen.getByTestId('add-task-button'))
    expect(screen.getByTestId('task-form-modal')).toBeInTheDocument()

    // Fill form
    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'Tugas Tambahan Baru' },
    })
    fireEvent.change(screen.getByTestId('task-form-desc-input'), {
      target: { value: 'Detail tugas baru' },
    })

    // Submit
    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    await waitFor(() => {
      expect(actions.createTaskAction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tugas Tambahan Baru',
          description: 'Detail tugas baru',
        })
      )
      expect(screen.getByText('Tugas Tambahan Baru')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil dibuat.')
    })
  })

  it('updates an existing task through edit modal', async () => {
    const updatedTask: TaskWithApplication = {
      ...baseTasks[0],
      title: 'CV sudah dikirim - tunggu kabar',
    }
    ;(actions.updateTaskAction as any).mockResolvedValue(updatedTask)

    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    // Click edit on task 1
    fireEvent.click(screen.getByTestId('task-edit-btn-task-1'))
    expect(screen.getByTestId('task-form-modal-title')).toHaveTextContent('Edit Tugas')

    // Change title
    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'CV sudah dikirim - tunggu kabar' },
    })

    // Submit
    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    await waitFor(() => {
      expect(actions.updateTaskAction).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'CV sudah dikirim - tunggu kabar',
        })
      )
      expect(screen.getByText('CV sudah dikirim - tunggu kabar')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil diperbarui.')
    })
  })

  it('deletes a task after explicit confirmation in TaskDeleteDialog', async () => {
    ;(actions.deleteTaskAction as any).mockResolvedValue(undefined)

    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    expect(screen.getByText('Kirim CV ke Tech Lead')).toBeInTheDocument()

    // Click delete button
    fireEvent.click(screen.getByTestId('task-delete-btn-task-1'))

    // Dialog appears with task title
    expect(screen.getByTestId('task-delete-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('task-delete-dialog-desc')).toHaveTextContent('Kirim CV ke Tech Lead')

    // Click confirm
    fireEvent.click(screen.getByTestId('task-delete-confirm-btn'))

    await waitFor(() => {
      expect(actions.deleteTaskAction).toHaveBeenCalledWith('task-1')
      expect(screen.queryByText('Kirim CV ke Tech Lead')).not.toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil dihapus.')
    })
  })

  it('filters task list dynamically when clicking filter toolbar tabs', () => {
    render(
      <TodosWorkspace user={mockUser} initialTasks={baseTasks} applicationOptions={mockOptions} />
    )

    // Initially "All" is active
    expect(screen.getByText('Kirim CV ke Tech Lead')).toBeInTheDocument()
    expect(screen.getByText('Mengerjakan take-home test')).toBeInTheDocument()

    // Switch to "Hari Ini"
    fireEvent.click(screen.getByTestId('filter-tab-today'))
    expect(screen.getByText('Kirim CV ke Tech Lead')).toBeInTheDocument()
    expect(screen.queryByText('Mengerjakan take-home test')).not.toBeInTheDocument()

    // Switch to "Mendatang"
    fireEvent.click(screen.getByTestId('filter-tab-upcoming'))
    expect(screen.queryByText('Kirim CV ke Tech Lead')).not.toBeInTheDocument()
    expect(screen.getByText('Mengerjakan take-home test')).toBeInTheDocument()

    // Switch to "Selesai" (no completed tasks)
    fireEvent.click(screen.getByTestId('filter-tab-completed'))
    expect(screen.queryByText('Kirim CV ke Tech Lead')).not.toBeInTheDocument()
    expect(screen.queryByText('Mengerjakan take-home test')).not.toBeInTheDocument()
    expect(screen.getByTestId('empty-tasks-title')).toHaveTextContent('Belum Ada Tugas Selesai')
  })
})
