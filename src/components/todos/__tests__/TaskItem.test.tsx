import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from '../TaskItem'
import type { TaskWithApplication } from '@/lib/types/database.types'

describe('TaskItem Component', () => {
  const pendingTask: TaskWithApplication = {
    id: 'task-1',
    user_id: 'user-1',
    application_id: 'app-1',
    title: 'Interview Preparation',
    description: 'Review system design concepts',
    status: 'pending',
    priority: 'high',
    due_date: '2026-10-10',
    completed_at: null,
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    application: {
      id: 'app-1',
      company_name: 'Tech Nusantara',
      job_title: 'Fullstack Dev',
    },
  }

  const completedTask: TaskWithApplication = {
    ...pendingTask,
    id: 'task-2',
    status: 'completed',
    completed_at: '2026-09-30T12:00:00Z',
  }

  it('renders pending task details with priority, due date, and application context', () => {
    render(
      <TaskItem task={pendingTask} onToggleStatus={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )

    expect(screen.getByTestId('task-title-task-1')).toHaveTextContent('Interview Preparation')
    expect(screen.getByTestId('task-title-task-1')).not.toHaveClass('line-through')
    expect(screen.getByTestId('task-priority-task-1')).toHaveTextContent('high')
    expect(screen.getByTestId('task-desc-task-1')).toHaveTextContent(
      'Review system design concepts'
    )
    expect(screen.getByTestId('task-duedate-task-1')).toHaveTextContent('2026-10-10')
    expect(screen.getByTestId('task-app-task-1')).toHaveTextContent(
      'Tech Nusantara — Fullstack Dev'
    )
    expect(screen.queryByTestId('task-completed-badge-task-1')).not.toBeInTheDocument()
  })

  it('renders completed task with line-through title and completed badge', () => {
    render(
      <TaskItem task={completedTask} onToggleStatus={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )

    expect(screen.getByTestId('task-title-task-2')).toHaveClass('line-through')
    expect(screen.getByTestId('task-completed-badge-task-2')).toBeInTheDocument()
    expect(screen.getByTestId('task-checkbox-task-2')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggleStatus when checkbox is clicked', () => {
    const handleToggle = vi.fn()
    render(
      <TaskItem
        task={pendingTask}
        onToggleStatus={handleToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const checkbox = screen.getByTestId('task-checkbox-task-1')
    fireEvent.click(checkbox)
    expect(handleToggle).toHaveBeenCalledWith(pendingTask)
  })

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = vi.fn()
    render(
      <TaskItem
        task={pendingTask}
        onToggleStatus={vi.fn()}
        onEdit={handleEdit}
        onDelete={vi.fn()}
      />
    )

    const editBtn = screen.getByTestId('task-edit-btn-task-1')
    fireEvent.click(editBtn)
    expect(handleEdit).toHaveBeenCalledWith(pendingTask)
  })

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn()
    render(
      <TaskItem
        task={pendingTask}
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={handleDelete}
      />
    )

    const deleteBtn = screen.getByTestId('task-delete-btn-task-1')
    fireEvent.click(deleteBtn)
    expect(handleDelete).toHaveBeenCalledWith(pendingTask)
  })

  it('enforces min 44x44px touch targets on checkbox, edit, and delete controls', () => {
    render(
      <TaskItem task={pendingTask} onToggleStatus={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )

    const checkbox = screen.getByTestId('task-checkbox-task-1')
    const editBtn = screen.getByTestId('task-edit-btn-task-1')
    const deleteBtn = screen.getByTestId('task-delete-btn-task-1')

    expect(checkbox.className).toContain('min-h-[44px]')
    expect(checkbox.className).toContain('min-w-[44px]')
    expect(editBtn.className).toContain('min-h-[44px]')
    expect(editBtn.className).toContain('min-w-[44px]')
    expect(deleteBtn.className).toContain('min-h-[44px]')
    expect(deleteBtn.className).toContain('min-w-[44px]')
  })
})
