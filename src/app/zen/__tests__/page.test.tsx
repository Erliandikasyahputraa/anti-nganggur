import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ZenPage from '../page'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasks } from '@/lib/api/tasks'
import type { TaskWithApplication } from '@/lib/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ZenPage (Server Component)', () => {
  const mockUser = {
    id: 'user-zen-1',
    email: 'focus@pejuangkerja.id',
    user_metadata: { full_name: 'Zen Worker' },
  }

  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-zen-1',
      title: 'Latihan behavioral interview',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-02',
      completed_at: null,
      application_id: 'app-1',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      application: {
        id: 'app-1',
        company_name: 'Gojek',
        job_title: 'Software Engineer',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login if user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Session expired'),
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    await expect(ZenPage()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(getTasks).not.toHaveBeenCalled()
  })

  it('loads pending tasks for authenticated user and renders ZenWorkspace', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getTasks).mockResolvedValue(mockTasks)

    const pageElement = await ZenPage()
    render(pageElement)

    expect(screen.getByTestId('mock-app-shell')).toBeInTheDocument()
    expect(screen.getByTestId('zen-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('zen-timer-card')).toBeInTheDocument()
    expect(screen.getByText('Zen Mode')).toBeInTheDocument()
    expect(getTasks).toHaveBeenCalledWith(mockSupabase, 'user-zen-1', { status: 'pending' })
  })

  it('handles task loading error gracefully without crashing page or blocking timer', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getTasks).mockRejectedValue(new Error('Database unavailable'))

    const pageElement = await ZenPage()
    render(pageElement)

    expect(screen.getByTestId('mock-app-shell')).toBeInTheDocument()
    expect(screen.getByTestId('zen-timer-card')).toBeInTheDocument()
    expect(screen.getByTestId('zen-task-error')).toBeInTheDocument()
    expect(screen.getByText('Gagal memuat data tugas.')).toBeInTheDocument()
    // Timer remains fully operational
    expect(screen.getByTestId('zen-btn-start')).toBeInTheDocument()
  })
})
