import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'

import DashboardPage from '../page'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'
import * as actions from '../actions'
import * as todoActions from '@/app/todos/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the Supabase API functions that are causing issues
vi.mock('@/lib/api/profiles', () => ({
  getUserProfile: vi.fn().mockResolvedValue(null),
}))

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// Mock server actions
vi.mock('../actions', () => ({
  getApplicationsWorkspaceDataAction: vi.fn(),
  createApplicationAction: vi.fn(),
  updateApplicationAction: vi.fn(),
  deleteApplicationAction: vi.fn(),
  updateApplicationStatusAction: vi.fn(),
  getApplicationsAction: vi.fn(),
}))

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

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('DashboardPage', () => {
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
      company_name: 'Meta',
      company_id: null,
      job_title: 'Full Stack Engineer',
      job_url: null,
      location: 'Menlo Park, CA',
      salary_range: null,
      status: 'wishlist',
      date_applied: '2025-10-03',
      notes: null,
      position: 3,
      custom_column_id: null,
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-03T00:00:00Z',
    },
  ]

  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-123',
      title: 'Review CV for Google',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-05',
      completed_at: null,
      application_id: '1',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      application: {
        id: '1',
        company_name: 'Google',
        job_title: 'Software Engineer',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-123',
      title: 'Standalone portfolio task',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: null,
      completed_at: null,
      application_id: null,
      created_at: '2026-10-01T01:00:00Z',
      updated_at: '2026-10-01T01:00:00Z',
      application: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
    mockPush.mockClear()
    vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
      applications: mockApplications,
      customColumns: [],
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      } as any,
    })
    vi.mocked(actions.getApplicationsAction).mockResolvedValue(mockApplications)
    vi.mocked(todoActions.getTasksAction).mockResolvedValue(mockTasks)
    vi.mocked(todoActions.toggleTaskStatusAction).mockResolvedValue({
      ...mockTasks[0],
      status: 'completed',
    })

    // Mock authenticated user
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>)
  })

  describe('Rendering and Layout', () => {
    it('should render enhanced global empty state for new users (0 applications)', async () => {
      vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
        applications: [],
        customColumns: [],
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        } as any,
      })
      vi.mocked(actions.getApplicationsAction).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/start your job hunt journey/i)).toBeInTheDocument()
      })

      // Verify all empty state elements
      expect(screen.getByText(/your analytics dashboard is ready/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go to applications/i })).toBeInTheDocument()
      expect(
        screen.getByText(/tip: start by adding jobs you're interested in/i)
      ).toBeInTheDocument()

      // Verify empty state icon
      const emptyStateContainer = screen.getByText(/start your job hunt journey/i).closest('div')
      expect(emptyStateContainer).toBeInTheDocument()
    })

    it('should preserve onboarding hero when 0 applications exist even if standalone tasks exist', async () => {
      vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
        applications: [],
        customColumns: [],
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        } as any,
      })
      vi.mocked(actions.getApplicationsAction).mockResolvedValue([])
      vi.mocked(todoActions.getTasksAction).mockResolvedValue(mockTasks)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/start your job hunt journey/i)).toBeInTheDocument()
      })

      // DashboardTasks must NOT be rendered
      expect(screen.queryByTestId('dashboard-tasks-card')).not.toBeInTheDocument()
      expect(screen.queryByText('Review CV for Google')).not.toBeInTheDocument()
    })

    it('should render dashboard components when applications exist', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument() // From RecentActivity
      })

      // Verify dashboard components render
      expect(screen.getByText(/Total Applications/i)).toBeInTheDocument() // From DashboardStats
      expect(screen.getByText(/Recently Updated Applications/i)).toBeInTheDocument() // From RecentActivity
      expect(screen.getByTestId('dashboard-tasks-card')).toBeInTheDocument()
    })

    it('should show loading state initially', async () => {
      vi.mocked(actions.getApplicationsWorkspaceDataAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(actions.getApplicationsAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      await act(async () => {
        renderWithTheme(<DashboardPage />)
      })

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Task Integration (P4)', () => {
    it('should fetch pending tasks with limit: 5 on initial load', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(todoActions.getTasksAction).toHaveBeenCalledWith({
          status: 'pending',
          limit: 5,
        })
      })
    })

    it('should render pending tasks in DashboardTasks widget', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
        expect(screen.getByText('Standalone portfolio task')).toBeInTheDocument()
      })

      // Priority and linked application check
      expect(screen.getByText('high')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
      expect(screen.getByText(/Google — Software Engineer/)).toBeInTheDocument()
    })

    it('should isolate task fetching failure without destroying application dashboard', async () => {
      vi.mocked(todoActions.getTasksAction).mockRejectedValue(new Error('Network error'))

      renderWithTheme(<DashboardPage />)

      // Application dashboard still renders
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText(/Total Applications/i)).toBeInTheDocument()
      })

      // Task error state is displayed inside DashboardTasks
      expect(screen.getByTestId('dashboard-tasks-error')).toBeInTheDocument()
      expect(screen.getByText('Gagal memuat tugas. Silakan coba lagi.')).toBeInTheDocument()
    })

    it('should support retrying task retrieval without reloading the entire page', async () => {
      vi.mocked(todoActions.getTasksAction)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTasks)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-tasks-error')).toBeInTheDocument()
      })

      // Click retry button in task widget
      const retryBtn = screen.getByTestId('dashboard-tasks-retry-btn')
      fireEvent.click(retryBtn)

      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('dashboard-tasks-error')).not.toBeInTheDocument()
      expect(todoActions.getTasksAction).toHaveBeenCalledTimes(2)
      // Applications action was NOT re-called
      expect(actions.getApplicationsWorkspaceDataAction).toHaveBeenCalledTimes(1)
    })

    it('should optimistically remove task and show success toast on completion', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
      })

      const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
      fireEvent.click(checkbox)

      // Task removed immediately from UI
      expect(screen.queryByText('Review CV for Google')).not.toBeInTheDocument()
      // Other task remains
      expect(screen.getByText('Standalone portfolio task')).toBeInTheDocument()

      await waitFor(() => {
        expect(todoActions.toggleTaskStatusAction).toHaveBeenCalledWith('task-1', 'pending')
        expect(toast.success).toHaveBeenCalledWith('Tugas ditandai selesai.')
      })
    })

    it('should rollback task and show error toast if completion fails', async () => {
      vi.mocked(todoActions.toggleTaskStatusAction).mockRejectedValueOnce(
        new Error('Gagal memperbarui status tugas.')
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
      })

      const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
      fireEvent.click(checkbox)

      // Task optimistically removed initially
      expect(screen.queryByText('Review CV for Google')).not.toBeInTheDocument()

      // Restored after failure
      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith('Gagal memperbarui status tugas.')
      })
    })

    it('should prevent duplicate clicks while mutation is in progress', async () => {
      let resolveToggle: (val: any) => void
      const togglePromise = new Promise(resolve => {
        resolveToggle = resolve
      })
      vi.mocked(todoActions.toggleTaskStatusAction).mockImplementation(() => togglePromise as any)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Review CV for Google')).toBeInTheDocument()
      })

      const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
      await act(async () => {
        fireEvent.click(checkbox)
        fireEvent.click(checkbox)
      })

      expect(todoActions.toggleTaskStatusAction).toHaveBeenCalledTimes(1)

      // Cleanup pending promise
      await act(async () => {
        resolveToggle!({ ...mockTasks[0], status: 'completed' })
      })
    })

    it('should render empty state when applications exist but 0 pending tasks', async () => {
      vi.mocked(todoActions.getTasksAction).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-tasks-empty')).toBeInTheDocument()
      })

      expect(screen.getByText('Semua tugas beres!')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-tasks-empty-cta')).toBeInTheDocument()
    })
  })
})
