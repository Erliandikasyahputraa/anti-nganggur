import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TodosPage from '../page'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasks } from '@/lib/api/tasks'
import { getApplicationOptions } from '@/lib/api/applications'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'

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

vi.mock('@/lib/api/applications', () => ({
  getApplicationOptions: vi.fn(),
}))

// Mock AppShell to simplify Server Component rendering in test
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-app-shell">{children}</div>
  ),
}))

describe('TodosPage (Server Component)', () => {
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

    await expect(TodosPage()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(getTasks).not.toHaveBeenCalled()
    expect(getApplicationOptions).not.toHaveBeenCalled()
  })

  it('loads tasks and application options in parallel when authenticated', async () => {
    const mockUser = { id: 'user-789', email: 'pejuang@kerja.id' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mockTasks: TaskWithApplication[] = [
      {
        id: 'task-100',
        user_id: 'user-789',
        application_id: 'app-50',
        title: 'Interview User di Toko Online',
        description: 'Bawa kartu identitas',
        status: 'pending',
        priority: 'high',
        due_date: '2026-10-05',
        completed_at: null,
        created_at: '2026-09-30T10:00:00Z',
        updated_at: '2026-09-30T10:00:00Z',
        application: {
          id: 'app-50',
          job_title: 'Product Designer',
          company_name: 'Toko Online',
        },
      },
    ]

    const mockOptions: ApplicationOption[] = [
      { id: 'app-50', company_name: 'Toko Online', job_title: 'Product Designer' },
    ]

    vi.mocked(getTasks).mockResolvedValue(mockTasks)
    vi.mocked(getApplicationOptions).mockResolvedValue(mockOptions)

    const pageElement = await TodosPage()
    render(pageElement)

    expect(getTasks).toHaveBeenCalledWith(mockSupabase, 'user-789')
    expect(getApplicationOptions).toHaveBeenCalledWith(mockSupabase, 'user-789')

    expect(screen.getByTestId('todos-workspace')).toBeInTheDocument()
    expect(screen.getByText('Interview User di Toko Online')).toBeInTheDocument()
    expect(screen.getByText('Toko Online — Product Designer')).toBeInTheDocument()
  })

  it('handles server data loading errors gracefully without throwing', async () => {
    const mockUser = { id: 'user-789', email: 'pejuang@kerja.id' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    vi.mocked(getTasks).mockRejectedValue(new Error('Internal DB timeout'))
    vi.mocked(getApplicationOptions).mockResolvedValue([])

    const pageElement = await TodosPage()
    render(pageElement)

    expect(screen.getByTestId('workspace-error-banner')).toBeInTheDocument()
    expect(
      screen.getByText('Koneksi ke server sedang lambat. Silakan coba lagi.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Internal DB timeout')).not.toBeInTheDocument()
  })
})
