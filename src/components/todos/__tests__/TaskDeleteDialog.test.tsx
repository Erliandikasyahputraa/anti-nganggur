import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskDeleteDialog } from '../TaskDeleteDialog'
import type { TaskWithApplication } from '@/lib/types/database.types'

describe('TaskDeleteDialog Component', () => {
  const mockTask: TaskWithApplication = {
    id: 'task-del-1',
    user_id: 'user-1',
    application_id: null,
    title: 'Hapus Tugas Uji Coba',
    description: null,
    status: 'pending',
    priority: 'medium',
    due_date: null,
    completed_at: null,
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    application: null,
  }

  it('renders confirmation dialog with task title identification', () => {
    render(<TaskDeleteDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} task={mockTask} />)

    expect(screen.getByTestId('task-delete-dialog-title')).toHaveTextContent('Hapus Tugas?')
    expect(screen.getByTestId('task-delete-dialog-desc')).toHaveTextContent('Hapus Tugas Uji Coba')
    expect(screen.getByTestId('task-delete-confirm-btn')).toBeInTheDocument()
    expect(screen.getByTestId('task-delete-cancel-btn')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <TaskDeleteDialog isOpen={true} onClose={handleClose} onConfirm={vi.fn()} task={mockTask} />
    )

    fireEvent.click(screen.getByTestId('task-delete-cancel-btn'))
    expect(handleClose).toHaveBeenCalled()
  })

  it('calls onConfirm when destructive delete button is clicked', () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <TaskDeleteDialog isOpen={true} onClose={vi.fn()} onConfirm={handleConfirm} task={mockTask} />
    )

    fireEvent.click(screen.getByTestId('task-delete-confirm-btn'))
    expect(handleConfirm).toHaveBeenCalled()
  })

  it('returns null and does not render when task is null', () => {
    const { container } = render(
      <TaskDeleteDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} task={null} />
    )

    expect(container.firstChild).toBeNull()
  })
})
