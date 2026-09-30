import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApplicationDetail } from '../ApplicationDetail'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'
import * as actions from '@/app/todos/actions'

// Mock server actions
vi.mock('@/app/todos/actions', () => ({
  getTasksAction: vi.fn(),
  createTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  toggleTaskStatusAction: vi.fn(),
  deleteTaskAction: vi.fn(),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ApplicationDetail Tasks Integration Tests', () => {
  const mockApplication: Application = {
    id: 'app-integ-777',
    user_id: 'user-777',
    company_name: 'GoTo Logistics',
    company_id: null,
    job_title: 'Fullstack Engineer',
    job_url: 'https://example.com/job/goto',
    location: 'Jakarta, Hybrid',
    salary_range: '20M - 25M',
    status: 'interviewing',
    date_applied: '2026-09-10',
    notes: 'In depth technical review',
    job_description: '<p>Backend and frontend engineering</p>',
    source: 'LinkedIn',
    company_logo_url: null,
    position: 0,
    custom_column_id: null,
    created_at: '2026-09-10T00:00:00Z',
    updated_at: '2026-09-10T00:00:00Z',
  }

  const sampleTasks: TaskWithApplication[] = [
    {
      id: 'task-a',
      user_id: 'user-777',
      application_id: 'app-integ-777',
      title: 'Pelajari Golang dan Concurrency',
      description: 'Review goroutines dan channels',
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-10',
      completed_at: null,
      created_at: '2026-09-12T10:00:00Z',
      updated_at: '2026-09-12T10:00:00Z',
      application: {
        id: 'app-integ-777',
        company_name: 'GoTo Logistics',
        job_title: 'Fullstack Engineer',
      },
    },
    {
      id: 'task-b',
      user_id: 'user-777',
      application_id: 'app-integ-777',
      title: 'Persiapan presentasi arsitektur',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: '2026-10-11',
      completed_at: null,
      created_at: '2026-09-12T11:00:00Z',
      updated_at: '2026-09-12T11:00:00Z',
      application: {
        id: 'app-integ-777',
        company_name: 'GoTo Logistics',
        job_title: 'Fullstack Engineer',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(actions.getTasksAction).mockResolvedValue([...sampleTasks])
  })

  it('renders Tasks tab, activates it on click, and displays pending badge', async () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    // Check that Tasks tab button exists
    const taskTabs = screen.getAllByRole('tab', { name: /tasks/i })
    expect(taskTabs.length).toBeGreaterThan(0)

    // Click Tasks tab
    fireEvent.click(taskTabs[0])

    // ApplicationTasks panel should render
    await waitFor(() => {
      expect(screen.getByTestId('application-tasks-panel')).toBeInTheDocument()
      expect(screen.getByText('Pelajari Golang dan Concurrency')).toBeInTheDocument()
    })

    // Badge should render with 2 pending tasks
    await waitFor(() => {
      const badges = screen.getAllByTestId('tasks-pending-badge')
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0]).toHaveTextContent('2')
    })
  })

  it('updates pending badge count when a task is completed', async () => {
    const updatedTask: TaskWithApplication = {
      ...sampleTasks[0],
      status: 'completed',
      completed_at: new Date().toISOString(),
    }
    vi.mocked(actions.toggleTaskStatusAction).mockResolvedValueOnce(updatedTask)

    render(
      <ApplicationDetail
        application={mockApplication}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    // Switch to tasks tab
    fireEvent.click(screen.getAllByRole('tab', { name: /tasks/i })[0])

    await waitFor(() => {
      expect(screen.getByTestId('task-checkbox-task-a')).toBeInTheDocument()
    })

    // Click checkbox to complete task-a
    fireEvent.click(screen.getByTestId('task-checkbox-task-a'))

    // Badge count should decrement from 2 to 1
    await waitFor(() => {
      const badges = screen.getAllByTestId('tasks-pending-badge')
      expect(badges[0]).toHaveTextContent('1')
    })
  })

  it('updates pending badge count when a pending task is deleted', async () => {
    vi.mocked(actions.deleteTaskAction).mockResolvedValueOnce()

    render(
      <ApplicationDetail
        application={mockApplication}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    // Switch to tasks tab
    fireEvent.click(screen.getAllByRole('tab', { name: /tasks/i })[0])

    await waitFor(() => {
      expect(screen.getByTestId('task-delete-btn-task-a')).toBeInTheDocument()
    })

    // Click delete button
    fireEvent.click(screen.getByTestId('task-delete-btn-task-a'))

    // Confirm in dialog
    expect(screen.getByTestId('task-delete-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('task-delete-confirm-btn'))

    // Badge count should decrement from 2 to 1
    await waitFor(() => {
      const badges = screen.getAllByTestId('tasks-pending-badge')
      expect(badges[0]).toHaveTextContent('1')
    })
  })

  it('updates pending badge count when a new pending task is created', async () => {
    const newTask: TaskWithApplication = {
      id: 'task-c',
      user_id: 'user-777',
      application_id: 'app-integ-777',
      title: 'Tugas Ketiga',
      description: null,
      status: 'pending',
      priority: 'low',
      due_date: null,
      completed_at: null,
      created_at: '2026-09-30T12:00:00Z',
      updated_at: '2026-09-30T12:00:00Z',
      application: {
        id: 'app-integ-777',
        company_name: 'GoTo Logistics',
        job_title: 'Fullstack Engineer',
      },
    }
    vi.mocked(actions.createTaskAction).mockResolvedValueOnce(newTask)

    render(
      <ApplicationDetail
        application={mockApplication}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    // Switch to tasks tab
    fireEvent.click(screen.getAllByRole('tab', { name: /tasks/i })[0])

    await waitFor(() => {
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument()
    })

    // Open create modal
    fireEvent.click(screen.getByTestId('add-task-button'))

    // Type title and submit
    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'Tugas Ketiga' },
    })
    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    // Badge count should increment from 2 to 3
    await waitFor(() => {
      const badges = screen.getAllByTestId('tasks-pending-badge')
      expect(badges[0]).toHaveTextContent('3')
    })
  })
})
