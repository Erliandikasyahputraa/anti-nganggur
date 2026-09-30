import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardTasks } from '../DashboardTasks'
import type { TaskWithApplication } from '@/lib/types/database.types'
import { format, subDays, addDays } from 'date-fns'

describe('DashboardTasks Component', () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const overdueStr = format(subDays(new Date(), 2), 'yyyy-MM-dd')
  const futureStr = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  const sampleTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-1',
      application_id: 'app-1',
      title: 'Pelajari System Design GoTo',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: overdueStr,
      completed_at: null,
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-09-20T10:00:00Z',
      application: {
        id: 'app-1',
        company_name: 'GoTo',
        job_title: 'Backend Engineer',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-1',
      application_id: null,
      title:
        'Perbarui resume versi bahasa Inggris dengan format ATS terkini yang sangat panjang sekali melebihi batas tampilan standar layar kecil',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: todayStr,
      completed_at: null,
      created_at: '2026-09-21T10:00:00Z',
      updated_at: '2026-09-21T10:00:00Z',
      application: null,
    },
    {
      id: 'task-3',
      user_id: 'user-1',
      application_id: 'app-2',
      title: 'Follow up HR Tokopedia',
      description: null,
      status: 'pending',
      priority: 'low',
      due_date: futureStr,
      completed_at: null,
      created_at: '2026-09-22T10:00:00Z',
      updated_at: '2026-09-22T10:00:00Z',
      application: {
        id: 'app-2',
        company_name: 'Tokopedia',
        job_title: 'Software Engineer',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pending task with title, priority, due date, and application info', () => {
    render(<DashboardTasks tasks={[sampleTasks[0]]} onToggleTask={vi.fn()} />)

    expect(screen.getByText('Pelajari System Design GoTo')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-task-priority-task-1')).toHaveTextContent(/high/i)
    expect(screen.getByTestId('dashboard-task-app-task-1')).toHaveTextContent(
      'GoTo — Backend Engineer'
    )
  })

  it('renders multiple tasks up to limit of 5', () => {
    render(<DashboardTasks tasks={sampleTasks} onToggleTask={vi.fn()} />)

    expect(screen.getByTestId('dashboard-task-item-task-1')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-task-item-task-2')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-task-item-task-3')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-tasks-count-badge')).toHaveTextContent('3')
  })

  it('renders priority badge correctly for high, medium, and low', () => {
    render(<DashboardTasks tasks={sampleTasks} onToggleTask={vi.fn()} />)

    expect(screen.getByTestId('dashboard-task-priority-task-1')).toHaveTextContent(/high/i)
    expect(screen.getByTestId('dashboard-task-priority-task-2')).toHaveTextContent(/medium/i)
    expect(screen.getByTestId('dashboard-task-priority-task-3')).toHaveTextContent(/low/i)
  })

  it('renders due date and marks overdue state in red', () => {
    render(<DashboardTasks tasks={sampleTasks} onToggleTask={vi.fn()} />)

    const overdueEl = screen.getByTestId('dashboard-task-due-task-1')
    expect(overdueEl).toHaveTextContent(`Terlewat: ${overdueStr}`)
    expect(overdueEl).toHaveClass('text-red-600')

    const todayEl = screen.getByTestId('dashboard-task-due-task-2')
    expect(todayEl).toHaveTextContent('Hari ini')
    expect(todayEl).toHaveClass('text-amber-600')
  })

  it('renders standalone task without application badge safely', () => {
    render(<DashboardTasks tasks={[sampleTasks[1]]} onToggleTask={vi.fn()} />)

    expect(screen.getByText(/Perbarui resume versi bahasa Inggris/i)).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-task-app-task-2')).not.toBeInTheDocument()
  })

  it('renders empty state when tasks array is empty', () => {
    render(<DashboardTasks tasks={[]} onToggleTask={vi.fn()} />)

    expect(screen.getByTestId('dashboard-tasks-empty')).toBeInTheDocument()
    expect(screen.getByText('Semua tugas beres!')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-tasks-empty-cta')).toBeInTheDocument()
  })

  it('renders error state and invokes onRetry callback when clicked', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(
      <DashboardTasks
        tasks={[]}
        onToggleTask={vi.fn()}
        onRetry={onRetry}
        error="Koneksi terputus saat memuat tugas"
      />
    )

    expect(screen.getByTestId('dashboard-tasks-error')).toBeInTheDocument()
    expect(screen.getByText('Koneksi terputus saat memuat tugas')).toBeInTheDocument()

    const retryBtn = screen.getByTestId('dashboard-tasks-retry-btn')
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('dispatches onToggleTask callback when checkbox is clicked', async () => {
    const onToggleTask = vi.fn().mockResolvedValue(undefined)
    render(<DashboardTasks tasks={sampleTasks} onToggleTask={onToggleTask} />)

    const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
    fireEvent.click(checkbox)

    expect(onToggleTask).toHaveBeenCalledWith(sampleTasks[0])
  })

  it('disables checkbox during active mutation', () => {
    const mutatingIds = new Set(['task-1'])
    render(
      <DashboardTasks tasks={sampleTasks} onToggleTask={vi.fn()} isMutatingTaskIds={mutatingIds} />
    )

    const checkbox1 = screen.getByTestId('dashboard-task-checkbox-task-1')
    expect(checkbox1).toBeDisabled()

    const checkbox2 = screen.getByTestId('dashboard-task-checkbox-task-2')
    expect(checkbox2).not.toBeDisabled()
  })

  it('renders accessible link to /todos with touch-friendly dimensions', () => {
    render(<DashboardTasks tasks={sampleTasks} onToggleTask={vi.fn()} />)

    const viewAllLink = screen.getByTestId('dashboard-tasks-view-all-link')
    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink).toHaveAttribute('href', '/todos')
    expect(viewAllLink).toHaveClass('min-h-[44px]')
  })

  it('ensures checkbox touch target satisfies minimum 44x44px', () => {
    render(<DashboardTasks tasks={[sampleTasks[0]]} onToggleTask={vi.fn()} />)

    const checkbox = screen.getByTestId('dashboard-task-checkbox-task-1')
    expect(checkbox).toHaveClass('min-h-[44px]')
    expect(checkbox).toHaveClass('min-w-[44px]')
  })

  it('handles extremely long task title safely without breaking layout', () => {
    render(<DashboardTasks tasks={[sampleTasks[1]]} onToggleTask={vi.fn()} />)

    const titleEl = screen.getByTestId('dashboard-task-title-task-2')
    expect(titleEl).toHaveClass('break-words')
    expect(titleEl).toHaveClass('line-clamp-1')
    expect(titleEl).toHaveAttribute('title')
  })
})
