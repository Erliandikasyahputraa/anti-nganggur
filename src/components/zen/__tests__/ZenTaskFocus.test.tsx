import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZenTaskFocus } from '../ZenTaskFocus'
import type { TaskWithApplication } from '@/lib/types/database.types'

describe('ZenTaskFocus Component', () => {
  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-1',
      user_id: 'user-123',
      title: 'Persiapan interview teknis Tokopedia',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: '2026-10-05',
      completed_at: null,
      application_id: 'app-1',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      application: {
        id: 'app-1',
        company_name: 'Tokopedia',
        job_title: 'Frontend Engineer',
      },
    },
    {
      id: 'task-2',
      user_id: 'user-123',
      title: 'Rapikan portofolio proyek Next.js',
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

  it('renders "Fokus Mandiri" when tasks list is empty and no task is active', () => {
    render(
      <ZenTaskFocus
        tasks={[]}
        activeTaskId={null}
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
      />
    )

    expect(screen.getByTestId('zen-fokus-mandiri-notice')).toBeInTheDocument()
    expect(screen.getByText(/Mode Fokus Mandiri/i)).toBeInTheDocument()
  })

  it('renders task selector button when tasks are available and no task is active', () => {
    const onSelectTask = vi.fn()
    render(
      <ZenTaskFocus
        tasks={mockTasks}
        activeTaskId={null}
        onSelectTask={onSelectTask}
        onCompleteTask={vi.fn()}
      />
    )

    const toggle = screen.getByTestId('zen-select-task-toggle')
    expect(toggle).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(toggle)
    expect(screen.getByTestId('zen-task-picker-list')).toBeInTheDocument()
    expect(screen.getByText('Persiapan interview teknis Tokopedia')).toBeInTheDocument()
    expect(screen.getByText('Rapikan portofolio proyek Next.js')).toBeInTheDocument()

    // Select task-1
    fireEvent.click(screen.getByTestId('zen-task-option-task-1'))
    expect(onSelectTask).toHaveBeenCalledWith('task-1')
  })

  it('renders pinned active task card with company context and priority', () => {
    render(
      <ZenTaskFocus
        tasks={mockTasks}
        activeTaskId="task-1"
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
      />
    )

    expect(screen.getByTestId('zen-active-task-card')).toBeInTheDocument()
    expect(screen.getByTestId('zen-active-task-title')).toHaveTextContent(
      'Persiapan interview teknis Tokopedia'
    )
    expect(screen.getByText('Tokopedia — Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('calls onCompleteTask when checkbox is clicked', async () => {
    const onCompleteTask = vi.fn()
    render(
      <ZenTaskFocus
        tasks={mockTasks}
        activeTaskId="task-1"
        onSelectTask={vi.fn()}
        onCompleteTask={onCompleteTask}
      />
    )

    const completeBtn = screen.getByTestId('zen-task-complete-btn-task-1')
    fireEvent.click(completeBtn)

    expect(onCompleteTask).toHaveBeenCalledWith(mockTasks[0])
  })

  it('clears active task when clear button (X) is clicked', () => {
    const onSelectTask = vi.fn()
    render(
      <ZenTaskFocus
        tasks={mockTasks}
        activeTaskId="task-1"
        onSelectTask={onSelectTask}
        onCompleteTask={vi.fn()}
      />
    )

    const clearBtn = screen.getByTestId('zen-clear-task-btn')
    fireEvent.click(clearBtn)

    expect(onSelectTask).toHaveBeenCalledWith(null)
  })

  it('disables completion checkbox when task is in mutatingTaskIds', () => {
    render(
      <ZenTaskFocus
        tasks={mockTasks}
        activeTaskId="task-1"
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
        isMutatingTaskIds={new Set(['task-1'])}
      />
    )

    const completeBtn = screen.getByTestId('zen-task-complete-btn-task-1')
    expect(completeBtn).toBeDisabled()
  })

  it('renders task loading error and triggers onRetry', () => {
    const onRetry = vi.fn()
    render(
      <ZenTaskFocus
        tasks={[]}
        activeTaskId={null}
        onSelectTask={vi.fn()}
        onCompleteTask={vi.fn()}
        error="Gagal memuat tugas."
        onRetry={onRetry}
      />
    )

    expect(screen.getByTestId('zen-task-error')).toBeInTheDocument()
    expect(screen.getByText('Gagal memuat tugas.')).toBeInTheDocument()

    const retryBtn = screen.getByTestId('zen-task-retry-btn')
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
