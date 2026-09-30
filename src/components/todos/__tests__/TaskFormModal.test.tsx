import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskFormModal } from '../TaskFormModal'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'

describe('TaskFormModal Component', () => {
  const mockOptions: ApplicationOption[] = [
    { id: 'app-uuid-1', company_name: 'Tech Corp', job_title: 'Fullstack Dev' },
    { id: 'app-uuid-2', company_name: 'Startup Unicorn', job_title: 'Backend Engineer' },
  ]

  const mockTask: TaskWithApplication = {
    id: 'task-123',
    user_id: 'user-1',
    application_id: 'app-uuid-1',
    title: 'Existing Task Title',
    description: 'Existing notes',
    status: 'pending',
    priority: 'high',
    due_date: '2026-10-15',
    completed_at: null,
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    application: {
      id: 'app-uuid-1',
      company_name: 'Tech Corp',
      job_title: 'Fullstack Dev',
    },
  }

  it('renders create mode with empty fields and default priority', () => {
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        applicationOptions={mockOptions}
      />
    )

    expect(screen.getByTestId('task-form-modal-title')).toHaveTextContent('Tambah Tugas Baru')
    expect(screen.getByTestId('task-form-title-input')).toHaveValue('')
    expect(screen.getByTestId('task-form-desc-input')).toHaveValue('')
    expect(screen.getByTestId('task-form-priority-select')).toHaveValue('medium')
    expect(screen.getByTestId('task-form-duedate-input')).toHaveValue('')
    expect(screen.getByTestId('task-form-app-select')).toHaveValue('')
  })

  it('renders edit mode with pre-filled fields from initialData', () => {
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockTask}
        applicationOptions={mockOptions}
      />
    )

    expect(screen.getByTestId('task-form-modal-title')).toHaveTextContent('Edit Tugas')
    expect(screen.getByTestId('task-form-title-input')).toHaveValue('Existing Task Title')
    expect(screen.getByTestId('task-form-desc-input')).toHaveValue('Existing notes')
    expect(screen.getByTestId('task-form-priority-select')).toHaveValue('high')
    expect(screen.getByTestId('task-form-duedate-input')).toHaveValue('2026-10-15')
    expect(screen.getByTestId('task-form-app-select')).toHaveValue('app-uuid-1')
  })

  it('validates that title is required before submission', async () => {
    const handleSubmit = vi.fn()
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        applicationOptions={mockOptions}
      />
    )

    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    expect(await screen.findByTestId('task-title-error')).toHaveTextContent(
      'Judul tugas wajib diisi'
    )
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('submits valid task payload and triggers onSubmit callback', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    const handleClose = vi.fn()

    render(
      <TaskFormModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        applicationOptions={mockOptions}
      />
    )

    fireEvent.change(screen.getByTestId('task-form-title-input'), {
      target: { value: 'Follow up application' },
    })
    fireEvent.change(screen.getByTestId('task-form-desc-input'), {
      target: { value: 'Send email to HR' },
    })
    fireEvent.change(screen.getByTestId('task-form-priority-select'), {
      target: { value: 'high' },
    })
    fireEvent.change(screen.getByTestId('task-form-duedate-input'), {
      target: { value: '2026-10-20' },
    })
    fireEvent.change(screen.getByTestId('task-form-app-select'), {
      target: { value: 'app-uuid-2' },
    })

    fireEvent.click(screen.getByTestId('task-form-submit-btn'))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Follow up application',
        description: 'Send email to HR',
        priority: 'high',
        due_date: '2026-10-20',
        application_id: 'app-uuid-2',
      })
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <TaskFormModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
        applicationOptions={mockOptions}
      />
    )

    fireEvent.click(screen.getByTestId('task-form-cancel-btn'))
    expect(handleClose).toHaveBeenCalled()
  })
})
