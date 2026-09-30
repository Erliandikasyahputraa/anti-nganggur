import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTaskAction,
  updateTaskAction,
  toggleTaskStatusAction,
  deleteTaskAction,
  getTasksAction,
  getTaskByIdAction,
} from '../actions'
import { createClient } from '@/lib/supabase/server'
import * as tasksApi from '@/lib/api/tasks'
import { revalidatePath } from 'next/cache'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock tasks API
vi.mock('@/lib/api/tasks', () => ({
  getTasks: vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  toggleTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}))

describe('Todos Server Actions (src/app/todos/actions.ts)', () => {
  const mockUserId = 'user-test-123'
  let mockSupabase: any

  const mockTask = {
    id: 'task-100',
    user_id: mockUserId,
    application_id: 'app-200',
    title: 'Follow up recruiter',
    description: 'Check status after 3 days',
    status: 'pending',
    priority: 'high',
    due_date: '2026-10-05',
    completed_at: null,
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    application: {
      id: 'app-200',
      company_name: 'Tech Corp',
      job_title: 'Software Engineer',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId, email: 'test@example.com' } },
          error: null,
        }),
      },
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('Authentication Enforcement', () => {
    it('throws normalized authentication error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No session'),
      })

      await expect(
        createTaskAction({
          title: 'Unauthenticated task',
        })
      ).rejects.toThrow('Sesi Anda telah berakhir. Silakan masuk kembali.')
    })
  })

  describe('createTaskAction', () => {
    it('successfully creates task and triggers revalidation', async () => {
      ;(tasksApi.createTask as any).mockResolvedValue(mockTask)

      const result = await createTaskAction({
        title: 'Follow up recruiter',
        priority: 'high',
        due_date: '2026-10-05',
        application_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
      })

      expect(tasksApi.createTask).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          title: 'Follow up recruiter',
          priority: 'high',
        }),
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/todos')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(result).toEqual(mockTask)
    })

    it('rejects invalid task input schema (empty title)', async () => {
      await expect(
        createTaskAction({
          title: '   ',
        })
      ).rejects.toThrow()
      expect(tasksApi.createTask).not.toHaveBeenCalled()
    })

    it('normalizes internal errors without exposing raw SQL or stack traces', async () => {
      ;(tasksApi.createTask as any).mockRejectedValue(
        new Error('duplicate key value violates unique constraint "tasks_pkey"')
      )

      await expect(
        createTaskAction({
          title: 'Valid title',
        })
      ).rejects.toThrow('Gagal membuat tugas baru.')
    })
  })

  describe('updateTaskAction', () => {
    it('successfully updates task with valid input and triggers revalidation', async () => {
      const updatedMock = { ...mockTask, title: 'Updated title' }
      ;(tasksApi.updateTask as any).mockResolvedValue(updatedMock)

      const result = await updateTaskAction('task-100', {
        title: 'Updated title',
      })

      expect(tasksApi.updateTask).toHaveBeenCalledWith(
        mockSupabase,
        'task-100',
        expect.objectContaining({ title: 'Updated title' }),
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/todos')
      expect(result.title).toBe('Updated title')
    })

    it('normalizes update failure errors cleanly', async () => {
      ;(tasksApi.updateTask as any).mockRejectedValue(new Error('PG error 42P01'))

      await expect(
        updateTaskAction('task-100', {
          title: 'Valid title',
        })
      ).rejects.toThrow('Gagal memperbarui tugas.')
    })
  })

  describe('toggleTaskStatusAction', () => {
    it('toggles task status and triggers path revalidations', async () => {
      const completedMock = {
        ...mockTask,
        status: 'completed',
        completed_at: '2026-09-30T12:00:00Z',
      }
      ;(tasksApi.toggleTaskStatus as any).mockResolvedValue(completedMock)

      const result = await toggleTaskStatusAction('task-100', 'pending')

      expect(tasksApi.toggleTaskStatus).toHaveBeenCalledWith(
        mockSupabase,
        'task-100',
        'pending',
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/todos')
      expect(result.status).toBe('completed')
    })

    it('normalizes error on toggle failure with fallback message', async () => {
      ;(tasksApi.toggleTaskStatus as any).mockRejectedValue(new Error('Unknown internal failure'))

      await expect(toggleTaskStatusAction('task-100', 'pending')).rejects.toThrow(
        'Gagal mengubah status tugas.'
      )
    })

    it('normalizes timeout error into friendly Indonesian message', async () => {
      ;(tasksApi.toggleTaskStatus as any).mockRejectedValue(
        new Error('Database operation timed out')
      )

      await expect(toggleTaskStatusAction('task-100', 'pending')).rejects.toThrow(
        'Koneksi ke server sedang lambat. Silakan coba lagi.'
      )
    })
  })

  describe('deleteTaskAction', () => {
    it('deletes task and revalidates paths', async () => {
      ;(tasksApi.deleteTask as any).mockResolvedValue(undefined)

      await deleteTaskAction('task-100')

      expect(tasksApi.deleteTask).toHaveBeenCalledWith(mockSupabase, 'task-100', mockUserId)
      expect(revalidatePath).toHaveBeenCalledWith('/todos')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/applications')
    })

    it('normalizes error on delete failure', async () => {
      ;(tasksApi.deleteTask as any).mockRejectedValue(new Error('Foreign key violation'))

      await expect(deleteTaskAction('task-100')).rejects.toThrow('Gagal menghapus tugas.')
    })
  })

  describe('getTasksAction & getTaskByIdAction', () => {
    it('fetches tasks for authenticated user', async () => {
      ;(tasksApi.getTasks as any).mockResolvedValue([mockTask])

      const tasks = await getTasksAction()
      expect(tasksApi.getTasks).toHaveBeenCalledWith(mockSupabase, mockUserId, undefined)
      expect(tasks).toEqual([mockTask])
    })

    it('fetches a single task by ID', async () => {
      ;(tasksApi.getTaskById as any).mockResolvedValue(mockTask)

      const task = await getTaskByIdAction('task-100')
      expect(tasksApi.getTaskById).toHaveBeenCalledWith(mockSupabase, 'task-100', mockUserId)
      expect(task).toEqual(mockTask)
    })
  })
})
