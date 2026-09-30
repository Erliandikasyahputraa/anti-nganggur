import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodosWorkspace } from '../TodosWorkspace'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'
import type { User } from '@supabase/supabase-js'
import { format } from 'date-fns'

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

describe('TodosWorkspace Component', () => {
  const mockUser = {
    id: 'user-abc-123',
    email: 'test@example.com',
  } as User

  const mockOptions: ApplicationOption[] = [
    { id: 'app-1', company_name: 'Tech Nusantara', job_title: 'Backend Engineer' },
    { id: 'app-2', company_name: 'Startup Unicorn', job_title: 'Fullstack Dev' },
  ]

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-abc-123',
      application_id: 'app-1',
      title: 'Kirim resume & portfolio',
      description: 'Lampirkan PDF versi terbaru',
      status: 'pending',
      priority: 'high',
      due_date: todayStr, // Due today in user local date
      completed_at: null,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
      application: {
        id: 'app-1',
        job_title: 'Backend Engineer',
        company_name: 'Tech Nusantara',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-abc-123',
      application_id: 'app-2',
      title: 'Pelajari live coding challenge',
      description: null,
      status: 'completed',
      priority: 'medium',
      due_date: '2026-09-02',
      completed_at: '2026-09-02T15:00:00Z',
      created_at: '2026-09-01T11:00:00Z',
      updated_at: '2026-09-02T15:00:00Z',
      application: {
        id: 'app-2',
        job_title: 'Fullstack Dev',
        company_name: 'Startup Unicorn',
      },
    },
  ]

  it('renders the workspace header, summary bar, and filter tabs', () => {
    render(
      <TodosWorkspace user={mockUser} initialTasks={mockTasks} applicationOptions={mockOptions} />
    )

    // Header
    expect(screen.getByRole('heading', { level: 1, name: 'To-Do' })).toBeInTheDocument()
    expect(screen.getByTestId('add-task-button')).toBeInTheDocument()

    // Summary Bar
    expect(screen.getByTestId('task-summary-bar')).toBeInTheDocument()
    expect(screen.getByTestId('summary-pending-count')).toHaveTextContent('1')
    expect(screen.getByTestId('summary-today-count')).toHaveTextContent('1')
    expect(screen.getByTestId('summary-completed-count')).toHaveTextContent('1')

    // Filter Tabs
    expect(screen.getByTestId('filter-tab-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-tab-today')).toBeInTheDocument()
    expect(screen.getByTestId('filter-tab-upcoming')).toBeInTheDocument()
    expect(screen.getByTestId('filter-tab-completed')).toBeInTheDocument()
  })

  it('renders task list items and displays task details', () => {
    render(
      <TodosWorkspace user={mockUser} initialTasks={mockTasks} applicationOptions={mockOptions} />
    )

    expect(screen.getByText('Kirim resume & portfolio')).toBeInTheDocument()
    expect(screen.getByText('Lampirkan PDF versi terbaru')).toBeInTheDocument()
    expect(screen.getByText('Tech Nusantara — Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Pelajari live coding challenge')).toBeInTheDocument()

    // Verify metadata reflects exact passed props
    const metadata = screen.getByTestId('workspace-metadata')
    expect(metadata.getAttribute('data-user-id')).toBe('user-abc-123')
    expect(metadata.getAttribute('data-options-count')).toBe('2')
  })

  it('handles empty task state correctly with clear guidance', () => {
    render(<TodosWorkspace user={mockUser} initialTasks={[]} applicationOptions={mockOptions} />)

    expect(screen.getByTestId('empty-tasks-title')).toHaveTextContent('Belum Ada Tugas')
    expect(screen.getByTestId('summary-pending-count')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-today-count')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-completed-count')).toHaveTextContent('0')
    expect(screen.queryByTestId('task-list')).not.toBeInTheDocument()
  })

  it('renders error banner when initialError is present and supports reload', () => {
    const originalReload = window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: reloadMock },
    })

    render(
      <TodosWorkspace
        user={mockUser}
        initialTasks={[]}
        applicationOptions={[]}
        initialError="Gagal memuat data tugas. Silakan muat ulang halaman."
      />
    )

    const errorBanner = screen.getByTestId('workspace-error-banner')
    expect(errorBanner).toBeInTheDocument()
    expect(errorBanner).toHaveTextContent('Gagal memuat data tugas. Silakan muat ulang halaman.')

    const retryButton = screen.getByTestId('retry-load-button')
    fireEvent.click(retryButton)
    expect(reloadMock).toHaveBeenCalledTimes(1)

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: originalReload },
    })
  })
})
