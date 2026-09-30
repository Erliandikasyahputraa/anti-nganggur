import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getTasks,
  getTasksByApplicationId,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  sortTasksDeterministically,
} from '../tasks'
import type { TaskWithApplication, TaskDB } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockTasks: TaskWithApplication[] = [
  {
    id: 'task-1',
    user_id: 'user-123',
    application_id: 'app-1',
    title: 'Follow up after phone screen',
    description: 'Ask HR about timeline',
    status: 'pending',
    priority: 'high',
    due_date: '2026-10-01',
    completed_at: null,
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    application: {
      id: 'app-1',
      job_title: 'Software Engineer',
      company_name: 'Tech Corp',
    },
  },
  {
    id: 'task-2',
    user_id: 'user-123',
    application_id: null,
    title: 'Update portfolio site',
    description: null,
    status: 'completed',
    priority: 'medium',
    due_date: '2026-09-25',
    completed_at: '2026-09-26T12:00:00Z',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-26T12:00:00Z',
    application: null,
  },
]

describe('Tasks API Layer', () => {
  let mockSupabase: any
  let mockQueryBuilder: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTasks[0], error: null }),
      then: (resolve: (value: { data: any; error: any }) => void) => {
        resolve({ data: mockTasks, error: null })
      },
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
    }
  })

  describe('sortTasksDeterministically', () => {
    it('sorts pending tasks first, followed by completed tasks', () => {
      const items: TaskDB[] = [
        { ...mockTasks[1], id: 't1', status: 'completed' },
        { ...mockTasks[0], id: 't2', status: 'pending' },
      ]

      const sorted = sortTasksDeterministically(items)
      expect(sorted[0].status).toBe('pending')
      expect(sorted[1].status).toBe('completed')
    })

    it('sorts due_date ASC with NULL dates last among pending tasks', () => {
      const items: TaskDB[] = [
        { ...mockTasks[0], id: 't1', due_date: null, status: 'pending' },
        { ...mockTasks[0], id: 't2', due_date: '2026-10-15', status: 'pending' },
        { ...mockTasks[0], id: 't3', due_date: '2026-10-01', status: 'pending' },
      ]

      const sorted = sortTasksDeterministically(items)
      expect(sorted[0].id).toBe('t3') // 2026-10-01
      expect(sorted[1].id).toBe('t2') // 2026-10-15
      expect(sorted[2].id).toBe('t1') // null
    })

    it('sorts priority (high > medium > low) when status and due_date are equal', () => {
      const items: TaskDB[] = [
        { ...mockTasks[0], id: 'low', priority: 'low', due_date: '2026-10-01' },
        { ...mockTasks[0], id: 'high', priority: 'high', due_date: '2026-10-01' },
        { ...mockTasks[0], id: 'med', priority: 'medium', due_date: '2026-10-01' },
      ]

      const sorted = sortTasksDeterministically(items)
      expect(sorted[0].id).toBe('high')
      expect(sorted[1].id).toBe('med')
      expect(sorted[2].id).toBe('low')
    })
  })

  describe('getTasks', () => {
    it('fetches tasks for authenticated user', async () => {
      const result = await getTasks(mockSupabase as unknown as SupabaseClient, 'user-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toHaveLength(2)
    })

    it('filters by application_id when provided', async () => {
      await getTasks(mockSupabase as unknown as SupabaseClient, 'user-123', {
        applicationId: 'app-1',
      })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('application_id', 'app-1')
    })

    it('filters by status when provided', async () => {
      await getTasks(mockSupabase as unknown as SupabaseClient, 'user-123', {
        status: 'pending',
      })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('applies limit when provided', async () => {
      await getTasks(mockSupabase as unknown as SupabaseClient, 'user-123', {
        limit: 5,
      })
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5)
    })
  })

  describe('getTasksByApplicationId', () => {
    it('delegates to getTasks with applicationId option', async () => {
      const result = await getTasksByApplicationId(
        mockSupabase as unknown as SupabaseClient,
        'app-1',
        'user-123'
      )
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('application_id', 'app-1')
      expect(result).toBeDefined()
    })
  })

  describe('getTaskById', () => {
    it('fetches single task by ID and verifies user ownership', async () => {
      const task = await getTaskById(
        mockSupabase as unknown as SupabaseClient,
        'task-1',
        'user-123'
      )
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'task-1')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(task).toEqual(mockTasks[0])
    })

    it('returns null when task not found (code PGRST116)', async () => {
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      })

      const task = await getTaskById(
        mockSupabase as unknown as SupabaseClient,
        'task-missing',
        'user-123'
      )
      expect(task).toBeNull()
    })
  })

  describe('createTask & Cross-Tenant Security', () => {
    it('creates general task without application_id', async () => {
      const newTask = {
        title: 'Learn Next.js server actions',
        priority: 'high' as const,
      }

      await createTask(mockSupabase as unknown as SupabaseClient, newTask, 'user-123')

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Learn Next.js server actions',
          user_id: 'user-123',
          application_id: null,
          status: 'pending',
          completed_at: null,
        })
      )
    })

    it('creates application-linked task when user owns the target application', async () => {
      // Mock application lookup: owned by user-123
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'app-1', user_id: 'user-123' },
              error: null,
            }),
          }
        }
        return mockQueryBuilder
      })

      const newTask = {
        title: 'Follow up',
        application_id: 'app-1',
      }

      await createTask(mockSupabase as unknown as SupabaseClient, newTask, 'user-123')

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          application_id: 'app-1',
          user_id: 'user-123',
        })
      )
    })

    it('rejects task creation referencing another user application (Cross-Tenant defense)', async () => {
      // Mock application lookup: owned by another user (user-456)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'app-foreign', user_id: 'user-456' },
              error: null,
            }),
          }
        }
        return mockQueryBuilder
      })

      const newTask = {
        title: 'Exploit attempt',
        application_id: 'app-foreign',
      }

      await expect(
        createTask(mockSupabase as unknown as SupabaseClient, newTask, 'user-123')
      ).rejects.toThrow(/Target application not found or not owned by user/)

      // Verify task was NOT inserted
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled()
    })
  })

  describe('updateTask & toggleTaskStatus', () => {
    it('sets completed_at when updating status to completed', async () => {
      await updateTask(
        mockSupabase as unknown as SupabaseClient,
        'task-1',
        { status: 'completed' },
        'user-123'
      )

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
        })
      )
    })

    it('clears completed_at to null when updating status to pending', async () => {
      await updateTask(
        mockSupabase as unknown as SupabaseClient,
        'task-1',
        { status: 'pending' },
        'user-123'
      )

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          completed_at: null,
        })
      )
    })

    it('toggleTaskStatus toggles pending to completed and records timestamp', async () => {
      await toggleTaskStatus(
        mockSupabase as unknown as SupabaseClient,
        'task-1',
        'pending',
        'user-123'
      )

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'completed',
        completed_at: expect.any(String),
      })
    })

    it('toggleTaskStatus toggles completed to pending and clears timestamp', async () => {
      await toggleTaskStatus(
        mockSupabase as unknown as SupabaseClient,
        'task-1',
        'completed',
        'user-123'
      )

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'pending',
        completed_at: null,
      })
    })
  })

  describe('deleteTask', () => {
    it('deletes task for authenticated user', async () => {
      await deleteTask(mockSupabase as unknown as SupabaseClient, 'task-1', 'user-123')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'task-1')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })
  })
})
