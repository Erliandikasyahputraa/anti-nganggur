import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { DashboardWorkspace } from '../DashboardWorkspace'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'
import * as todoActions from '@/app/todos/actions'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

vi.mock('@/app/todos/actions', () => ({
  getTasksAction: vi.fn(),
  toggleTaskStatusAction: vi.fn(),
}))

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: vi.fn(() => '/dashboard'),
}))

describe('DashboardWorkspace', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' } as any

  const mockApplications: Application[] = [
    {
      id: '1',
      user_id: 'user-123',
      company_name: 'Google',
      company_id: null,
      job_title: 'Software Engineer',
      job_url: 'https://google.com/jobs/1',
      location: 'Remote',
      salary_range: '$150k-$200k',
      status: 'applied',
      date_applied: '2025-10-01',
      notes: 'Great company',
      position: 1,
      custom_column_id: null,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      company_name: 'Microsoft',
      company_id: null,
      job_title: 'Frontend Developer',
      job_url: 'https://microsoft.com/jobs/2',
      location: 'Seattle, WA',
      salary_range: '$140k-$180k',
      status: 'interviewing',
      date_applied: '2025-09-28',
      notes: 'Interview scheduled',
      position: 2,
      custom_column_id: null,
      created_at: '2025-09-28T00:00:00Z',
      updated_at: '2025-09-28T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'user-123',
      company_name: 'Apple',
      company_id: null,
      job_title: 'iOS Developer',
      job_url: 'https://apple.com/jobs/3',
      location: 'Cupertino, CA',
      salary_range: '$160k-$210k',
      status: 'offered',
      date_applied: '2025-09-20',
      notes: 'Offer received',
      position: 3,
      custom_column_id: null,
      created_at: '2025-09-20T00:00:00Z',
      updated_at: '2025-09-20T00:00:00Z',
    },
  ]

  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-123',
      application_id: '1',
      title: 'Follow up email',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: '2025-10-05',
      completed_at: null,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
      application: {
        id: '1',
        job_title: 'Software Engineer',
        company_name: 'Google',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  it('renders dashboard overview and metrics with initial applications', () => {
    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={mockTasks}
      />
    )

    expect(screen.getByTestId('dashboard-workspace')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(
      screen.getByText('Ringkasan dan analitik progres lamaran kerja kamu.')
    ).toBeInTheDocument()
    expect(screen.getByText(/lamaran aktif/i)).toBeInTheDocument()
  })

  it('renders empty state when there are 0 applications', () => {
    renderWithTheme(
      <DashboardWorkspace user={mockUser} initialApplications={[]} initialTasks={[]} />
    )

    expect(screen.getByText('Mulai Perjalanan Cari Kerja Kamu')).toBeInTheDocument()
    const appBtn = screen.getByRole('button', { name: /Go to Applications/i })
    expect(appBtn).toBeInTheDocument()

    fireEvent.click(appBtn)
    expect(mockPush).toHaveBeenCalledWith('/applications')
  })

  it('renders error state when initialError is provided', () => {
    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={[]}
        initialTasks={[]}
        initialError="Gagal memuat data."
      />
    )

    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeInTheDocument()
  })

  it('handles optimistic task toggling successfully', async () => {
    vi.mocked(todoActions.toggleTaskStatusAction).mockResolvedValue({
      ...mockTasks[0],
      status: 'completed',
    })

    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={mockTasks}
      />
    )

    expect(screen.getByText('Follow up email')).toBeInTheDocument()

    const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
    await act(async () => {
      fireEvent.click(checkbox)
    })

    expect(todoActions.toggleTaskStatusAction).toHaveBeenCalledWith('task-1', 'pending')
    expect(toast.success).toHaveBeenCalledWith('Tugas ditandai selesai.')
  })

  it('rolls back task state if toggle fails', async () => {
    vi.mocked(todoActions.toggleTaskStatusAction).mockRejectedValue(new Error('Network error'))

    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={mockTasks}
      />
    )

    const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
    await act(async () => {
      fireEvent.click(checkbox)
    })

    expect(todoActions.toggleTaskStatusAction).toHaveBeenCalledWith('task-1', 'pending')
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error')
      expect(screen.getByText('Follow up email')).toBeInTheDocument()
    })
  })

  it('allows retrying tasks when initialTaskError is set', async () => {
    const freshTasks: TaskWithApplication[] = [
      {
        ...mockTasks[0],
        title: 'Retried task',
      },
    ]
    vi.mocked(todoActions.getTasksAction).mockResolvedValue(freshTasks)

    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={[]}
        initialTaskError="Gagal memuat tugas."
      />
    )

    expect(screen.getByText('Gagal memuat tugas.')).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i })

    await act(async () => {
      fireEvent.click(retryBtn)
    })

    expect(todoActions.getTasksAction).toHaveBeenCalledWith({ status: 'pending', limit: 5 })
    await waitFor(() => {
      expect(screen.getByText('Retried task')).toBeInTheDocument()
    })
  })

  it('preserves onboarding hero when 0 applications exist even if standalone tasks exist', () => {
    renderWithTheme(
      <DashboardWorkspace user={mockUser} initialApplications={[]} initialTasks={mockTasks} />
    )

    expect(screen.getByText('Mulai Perjalanan Cari Kerja Kamu')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument()
  })

  it('prevents duplicate clicks while mutation is in progress', async () => {
    let resolveAction: (value: any) => void
    const pendingPromise = new Promise(resolve => {
      resolveAction = resolve
    })
    vi.mocked(todoActions.toggleTaskStatusAction).mockReturnValue(pendingPromise as any)

    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={mockTasks}
      />
    )

    const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)

    expect(todoActions.toggleTaskStatusAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveAction!({ ...mockTasks[0], status: 'completed' })
    })
  })

  it('renders empty state when applications exist but 0 pending tasks', () => {
    renderWithTheme(
      <DashboardWorkspace
        user={mockUser}
        initialApplications={mockApplications}
        initialTasks={[]}
      />
    )

    expect(screen.getByTestId('dashboard-tasks-empty')).toBeInTheDocument()
    expect(screen.getByText('Semua tugas beres!')).toBeInTheDocument()
  })
})
