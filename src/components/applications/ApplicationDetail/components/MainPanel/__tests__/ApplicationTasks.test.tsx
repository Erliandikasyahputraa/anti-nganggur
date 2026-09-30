import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApplicationTasks } from '../ApplicationTasks'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'
import * as actions from '@/app/todos/actions'
import { toast } from 'sonner'

// Mock server actions
vi.mock('@/app/todos/actions', () => ({
  getTasksAction: vi.fn(),
  createTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  toggleTaskStatusAction: vi.fn(),
  deleteTaskAction: vi.fn(),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ApplicationTasks Component Tests', () => {
  const mockApplication: Application = {
    id: 'app-test-123',
    user_id: 'user-123',
    company_name: 'Tech Corp',
    company_id: null,
    job_title: 'Senior Frontend Developer',
    job_url: 'https://example.com/job',
    location: 'Remote',
    salary_range: '15M - 20M',
    status: 'interviewing',
    date_applied: '2026-09-01',
    notes: 'Test notes',
    job_description: '<p>Job description</p>',
    source: 'LinkedIn',
    company_logo_url: null,
    position: 0,
    custom_column_id: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  }

  const sampleTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-123',
      application_id: 'app-test-123',
      title: 'Pelajari System Design Tech Corp',
      description: 'Baca arsitektur microservices',
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-05',
      completed_at: null,
      created_at: '2026-09-02T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z',
      application: {
        id: 'app-test-123',
        company_name: 'Tech Corp',
        job_title: 'Senior Frontend Developer',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-123',
      application_id: 'app-test-123',
      title: 'Kirim portofolio GitHub',
      description: 'Sertakan link repo anti-nganggur',
      status: 'pending',
      priority: 'medium',
      due_date: '2026-10-06',
      completed_at: null,
      created_at: '2026-09-02T11:00:00Z',
      updated_at: '2026-09-02T11:00:00Z',
      application: {
        id: 'app-test-123',
        company_name: 'Tech Corp',
        job_title: 'Senior Frontend Developer',
      },
    },
    {
      id: 'task-3',
      user_id: 'user-123',
      application_id: 'app-test-123',
      title: 'Follow up HR setelah tes koding',
      description: 'Sudah selesai',
      status: 'completed',
      priority: 'low',
      due_date: '2026-09-10',
      completed_at: '2026-09-11T10:00:00Z',
      created_at: '2026-09-01T12:00:00Z',
      updated_at: '2026-09-11T10:00:00Z',
      application: {
        id: 'app-test-123',
        company_name: 'Tech Corp',
        job_title: 'Senior Frontend Developer',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton and then application-scoped tasks', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)

    render(<ApplicationTasks application={mockApplication} />)

    // Loading skeleton should appear initially
    expect(screen.getByTestId('application-tasks-loading')).toBeInTheDocument()

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Pelajari System Design Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Kirim portofolio GitHub')).toBeInTheDocument()
      expect(screen.getByText('Follow up HR setelah tes koding')).toBeInTheDocument()
    })

    // Confirms scoped fetch
    expect(actions.getTasksAction).toHaveBeenCalledWith({ applicationId: 'app-test-123' })
    expect(screen.queryByTestId('application-tasks-loading')).not.toBeInTheDocument()
  })

  it('reports pending task count to parent via onPendingCountChange', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)
    const onPendingCountChange = vi.fn()

    render(
      <ApplicationTasks application={mockApplication} onPendingCountChange={onPendingCountChange} />
    )

    await waitFor(() => {
      // 2 pending tasks in sampleTasks
      expect(onPendingCountChange).toHaveBeenCalledWith(2)
    })
  })

  it('renders empty state when there are zero tasks for the application', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce([])

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByTestId('application-tasks-empty')).toBeInTheDocument()
      expect(screen.getByText('Belum ada tugas untuk lamaran ini')).toBeInTheDocument()
      expect(screen.getByTestId('empty-add-task-button')).toBeInTheDocument()
    })
  })

  it('handles error state and allows retry', async () => {
    vi.mocked(actions.getTasksAction)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(sampleTasks)

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByTestId('application-tasks-error')).toBeInTheDocument()
      expect(screen.getByText('Network failure')).toBeInTheDocument()
    })

    // Click retry
    const retryBtn = screen.getByTestId('application-tasks-retry')
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('Pelajari System Design Tech Corp')).toBeInTheDocument()
    })
    expect(actions.getTasksAction).toHaveBeenCalledTimes(2)
  })

  it('optimistically toggles task status with rollback on failure', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)
    vi.mocked(actions.toggleTaskStatusAction).mockRejectedValueOnce(new Error('Koneksi terputus'))

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Pelajari System Design Tech Corp')).toBeInTheDocument()
    })

    const taskCheckbox = screen.getByTestId('task-checkbox-task-1')

    // Click to toggle
    fireEvent.click(taskCheckbox)

    // Wait for rollback after rejection
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Koneksi terputus')
    })
  })

  it('opens create modal with locked application context and creates task', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)
    const newTask: TaskWithApplication = {
      id: 'task-new',
      user_id: 'user-123',
      application_id: 'app-test-123',
      title: 'Tugas Baru Interview',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-15',
      completed_at: null,
      created_at: '2026-09-30T10:00:00Z',
      updated_at: '2026-09-30T10:00:00Z',
      application: {
        id: 'app-test-123',
        company_name: 'Tech Corp',
        job_title: 'Senior Frontend Developer',
      },
    }
    vi.mocked(actions.createTaskAction).mockResolvedValueOnce(newTask)

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument()
    })

    // Open create modal
    fireEvent.click(screen.getByTestId('add-task-button'))

    expect(screen.getByTestId('task-form-modal')).toBeInTheDocument()

    // Application selector should be disabled / locked
    const appSelect = screen.getByTestId('task-form-app-select')
    expect(appSelect).toBeDisabled()
    expect(appSelect).toHaveValue('app-test-123')

    // Fill title
    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'Tugas Baru Interview' },
    })

    // Submit
    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    await waitFor(() => {
      expect(actions.createTaskAction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tugas Baru Interview',
          application_id: 'app-test-123',
        })
      )
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil dibuat.')
      expect(screen.getByText('Tugas Baru Interview')).toBeInTheDocument()
    })
  })

  it('allows editing an existing task within the application context', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)
    const updatedTask: TaskWithApplication = {
      ...sampleTasks[0],
      title: 'Pelajari System Design Tech Corp (Updated)',
    }
    vi.mocked(actions.updateTaskAction).mockResolvedValueOnce(updatedTask)

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Pelajari System Design Tech Corp')).toBeInTheDocument()
    })

    // Click edit on task-1
    fireEvent.click(screen.getByTestId('task-edit-btn-task-1'))

    expect(screen.getByTestId('task-form-modal')).toBeInTheDocument()
    expect(screen.getByTestId('task-form-app-select')).toBeDisabled()

    // Update title
    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'Pelajari System Design Tech Corp (Updated)' },
    })

    // Submit
    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    await waitFor(() => {
      expect(actions.updateTaskAction).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'Pelajari System Design Tech Corp (Updated)',
          application_id: 'app-test-123',
        })
      )
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil diperbarui.')
      expect(screen.getByText('Pelajari System Design Tech Corp (Updated)')).toBeInTheDocument()
    })
  })

  it('confirms and deletes a task with confirmation dialog', async () => {
    vi.mocked(actions.getTasksAction).mockResolvedValueOnce(sampleTasks)
    vi.mocked(actions.deleteTaskAction).mockResolvedValueOnce()

    render(<ApplicationTasks application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Pelajari System Design Tech Corp')).toBeInTheDocument()
    })

    // Click delete on task-1
    fireEvent.click(screen.getByTestId('task-delete-btn-task-1'))

    // Dialog should open
    expect(screen.getByTestId('task-delete-dialog')).toBeInTheDocument()

    // Confirm deletion
    fireEvent.click(screen.getByTestId('task-delete-confirm-btn'))

    await waitFor(() => {
      expect(actions.deleteTaskAction).toHaveBeenCalledWith('task-1')
      expect(toast.success).toHaveBeenCalledWith('Tugas berhasil dihapus.')
      expect(screen.queryByText('Pelajari System Design Tech Corp')).not.toBeInTheDocument()
    })
  })
})
