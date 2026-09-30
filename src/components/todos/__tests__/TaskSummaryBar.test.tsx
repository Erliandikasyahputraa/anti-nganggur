import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskSummaryBar } from '../TaskSummaryBar'
import type { TaskWithApplication } from '@/lib/types/database.types'
import { format } from 'date-fns'

describe('TaskSummaryBar Component', () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  it('correctly calculates pending, due today, and completed counts', () => {
    const tasks: TaskWithApplication[] = [
      {
        id: '1',
        user_id: 'u1',
        application_id: null,
        title: 'Task 1',
        description: null,
        status: 'pending',
        priority: 'high',
        due_date: todayStr, // pending & due today
        completed_at: null,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'u1',
        application_id: null,
        title: 'Task 2',
        description: null,
        status: 'pending',
        priority: 'medium',
        due_date: '2099-01-01', // pending & future
        completed_at: null,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '3',
        user_id: 'u1',
        application_id: null,
        title: 'Task 3',
        description: null,
        status: 'completed',
        priority: 'low',
        due_date: todayStr, // completed (should NOT count as due today)
        completed_at: '2026-09-01T12:00:00Z',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T12:00:00Z',
      },
      {
        id: '4',
        user_id: 'u1',
        application_id: null,
        title: 'Task 4',
        description: null,
        status: 'pending',
        priority: 'low',
        due_date: null, // pending with no due date
        completed_at: null,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ]

    render(<TaskSummaryBar tasks={tasks} />)

    // Total Pending = Task 1, Task 2, Task 4 = 3
    expect(screen.getByTestId('summary-pending-count')).toHaveTextContent('3')

    // Due Today = Task 1 (only pending tasks due today) = 1
    expect(screen.getByTestId('summary-today-count')).toHaveTextContent('1')

    // Completed = Task 3 = 1
    expect(screen.getByTestId('summary-completed-count')).toHaveTextContent('1')
  })

  it('renders zeros when task list is empty', () => {
    render(<TaskSummaryBar tasks={[]} />)

    expect(screen.getByTestId('summary-pending-count')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-today-count')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-completed-count')).toHaveTextContent('0')
  })
})
