import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskList } from '../TaskList'
import type { TaskWithApplication } from '@/lib/types/database.types'
import { format, addDays, subDays } from 'date-fns'

describe('TaskList Component', () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const mockTasks: TaskWithApplication[] = [
    {
      id: 'task-today',
      user_id: 'user-1',
      application_id: null,
      title: 'Tugas Hari Ini',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: todayStr,
      completed_at: null,
      created_at: '2026-09-30T10:00:00Z',
      updated_at: '2026-09-30T10:00:00Z',
      application: null,
    },
    {
      id: 'task-upcoming',
      user_id: 'user-1',
      application_id: null,
      title: 'Tugas Mendatang',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: tomorrowStr,
      completed_at: null,
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-29T10:00:00Z',
      application: null,
    },
    {
      id: 'task-overdue',
      user_id: 'user-1',
      application_id: null,
      title: 'Tugas Terlewat',
      description: null,
      status: 'pending',
      priority: 'low',
      due_date: yesterdayStr,
      completed_at: null,
      created_at: '2026-09-28T10:00:00Z',
      updated_at: '2026-09-28T10:00:00Z',
      application: null,
    },
    {
      id: 'task-completed',
      user_id: 'user-1',
      application_id: null,
      title: 'Tugas Selesai',
      description: null,
      status: 'completed',
      priority: 'high',
      due_date: todayStr,
      completed_at: '2026-09-30T12:00:00Z',
      created_at: '2026-09-27T10:00:00Z',
      updated_at: '2026-09-30T12:00:00Z',
      application: null,
    },
  ]

  it('renders all tasks under "all" filter including overdue tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        activeFilter="all"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('task-item-task-today')).toBeInTheDocument()
    expect(screen.getByTestId('task-item-task-upcoming')).toBeInTheDocument()
    expect(screen.getByTestId('task-item-task-overdue')).toBeInTheDocument()
    expect(screen.getByTestId('task-item-task-completed')).toBeInTheDocument()
  })

  it('filters correctly for "today" (pending AND local calendar date)', () => {
    render(
      <TaskList
        tasks={mockTasks}
        activeFilter="today"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('task-item-task-today')).toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-upcoming')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-overdue')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-completed')).not.toBeInTheDocument()
  })

  it('filters correctly for "upcoming" (pending AND due_date > local calendar date)', () => {
    render(
      <TaskList
        tasks={mockTasks}
        activeFilter="upcoming"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('task-item-task-upcoming')).toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-today')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-overdue')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-completed')).not.toBeInTheDocument()
  })

  it('filters correctly for "completed" (status === completed)', () => {
    render(
      <TaskList
        tasks={mockTasks}
        activeFilter="completed"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('task-item-task-completed')).toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-today')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-upcoming')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-item-task-overdue')).not.toBeInTheDocument()
  })

  it('renders contextual empty state when filter yields zero tasks', () => {
    render(
      <TaskList
        tasks={[mockTasks[0]]} // only today task
        activeFilter="upcoming"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('empty-tasks-title')).toHaveTextContent('Tidak Ada Tugas Mendatang')
  })

  it('renders global empty state when total task list is empty', () => {
    render(
      <TaskList
        tasks={[]}
        activeFilter="all"
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByTestId('empty-tasks-title')).toHaveTextContent('Belum Ada Tugas')
  })
})
