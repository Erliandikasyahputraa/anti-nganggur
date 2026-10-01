import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '../page'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardApplications } from '@/lib/api/applications'
import { getTasks } from '@/lib/api/tasks'
import type { DashboardApplication, TaskWithApplication } from '@/lib/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

vi.mock('@/lib/api/applications', () => ({
  getDashboardApplications: vi.fn(),
}))

vi.mock('@/lib/api/tasks', () => ({
  getTasks: vi.fn(),
}))

// Mock AppShell to simplify Server Component rendering in test
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-app-shell">{children}</div>
  ),
}))

describe('DashboardPage (Server Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login if user is unauthenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('No active session'),
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    await expect(DashboardPage()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(getDashboardApplications).not.toHaveBeenCalled()
    expect(getTasks).not.toHaveBeenCalled()
  })

  it('loads applications and tasks in parallel when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'pejuang@kerja.id' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mockApplications: DashboardApplication[] = [
      {
        id: '1',
        company_name: 'Google',
        job_title: 'Software Engineer',
        status: 'applied',
        date_applied: '2026-10-01',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
    ]

    const mockTasks: TaskWithApplication[] = [
      {
        id: 'task-1',
        user_id: 'user-123',
        application_id: '1',
        title: 'Follow up interview',
        description: null,
        status: 'pending',
        priority: 'high',
        due_date: '2026-10-05',
        completed_at: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        application: {
          id: '1',
          job_title: 'Software Engineer',
          company_name: 'Google',
        },
      },
    ]

    vi.mocked(getDashboardApplications).mockResolvedValue(mockApplications)
    vi.mocked(getTasks).mockResolvedValue(mockTasks)

    const pageElement = await DashboardPage()
    render(pageElement)

    expect(getDashboardApplications).toHaveBeenCalledWith(mockSupabase, 'user-123')
    expect(getTasks).toHaveBeenCalledWith(mockSupabase, 'user-123', {
      status: 'pending',
      limit: 5,
    })

    expect(screen.getByTestId('dashboard-workspace')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Follow up interview')).toBeInTheDocument()
  })

  it('handles server data loading errors gracefully without throwing', async () => {
    const mockUser = { id: 'user-123', email: 'pejuang@kerja.id' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    vi.mocked(getDashboardApplications).mockRejectedValue(new Error('Database error'))
    vi.mocked(getTasks).mockResolvedValue([])

    const pageElement = await DashboardPage()
    render(pageElement)

    expect(screen.getByText('Failed to load applications. Please try again.')).toBeInTheDocument()
  })
})
