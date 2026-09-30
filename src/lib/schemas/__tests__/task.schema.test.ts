import { describe, it, expect } from 'vitest'
import {
  createTaskSchema,
  updateTaskSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskFilterSchema,
} from '../task.schema'

describe('Task Validation Schemas', () => {
  describe('taskPrioritySchema', () => {
    it('accepts valid priorities', () => {
      expect(taskPrioritySchema.parse('low')).toBe('low')
      expect(taskPrioritySchema.parse('medium')).toBe('medium')
      expect(taskPrioritySchema.parse('high')).toBe('high')
    })

    it('rejects invalid priority', () => {
      expect(() => taskPrioritySchema.parse('urgent')).toThrow()
      expect(() => taskPrioritySchema.parse('critical')).toThrow()
      expect(() => taskPrioritySchema.parse('')).toThrow()
    })
  })

  describe('taskStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(taskStatusSchema.parse('pending')).toBe('pending')
      expect(taskStatusSchema.parse('completed')).toBe('completed')
    })

    it('rejects invalid status', () => {
      expect(() => taskStatusSchema.parse('in_progress')).toThrow()
      expect(() => taskStatusSchema.parse('done')).toThrow()
    })
  })

  describe('taskFilterSchema', () => {
    it('accepts valid filter values', () => {
      expect(taskFilterSchema.parse('all')).toBe('all')
      expect(taskFilterSchema.parse('today')).toBe('today')
      expect(taskFilterSchema.parse('upcoming')).toBe('upcoming')
      expect(taskFilterSchema.parse('completed')).toBe('completed')
    })

    it('rejects invalid filter', () => {
      expect(() => taskFilterSchema.parse('yesterday')).toThrow()
    })
  })

  describe('createTaskSchema', () => {
    it('validates a complete, valid task input', () => {
      const input = {
        title: 'Follow up recruiter',
        description: 'Send polite email about interview results',
        priority: 'high' as const,
        due_date: '2026-10-05',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const parsed = createTaskSchema.parse(input)
      expect(parsed.title).toBe('Follow up recruiter')
      expect(parsed.description).toBe('Send polite email about interview results')
      expect(parsed.priority).toBe('high')
      expect(parsed.due_date).toBe('2026-10-05')
      expect(parsed.application_id).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('defaults priority to medium when omitted', () => {
      const input = { title: 'Update resume' }
      const parsed = createTaskSchema.parse(input)
      expect(parsed.priority).toBe('medium')
      expect(parsed.description).toBeNull()
      expect(parsed.due_date).toBeNull()
      expect(parsed.application_id).toBeNull()
    })

    it('transforms empty strings to null for optional fields', () => {
      const input = {
        title: 'Study system design',
        description: '',
        due_date: '',
        application_id: '',
      }

      const parsed = createTaskSchema.parse(input)
      expect(parsed.description).toBeNull()
      expect(parsed.due_date).toBeNull()
      expect(parsed.application_id).toBeNull()
    })

    it('rejects empty or whitespace-only title', () => {
      expect(() => createTaskSchema.parse({ title: '' })).toThrow(/Task title is required/)
      expect(() => createTaskSchema.parse({ title: '   ' })).toThrow(/Task title is required/)
    })

    it('rejects title longer than 255 characters', () => {
      const longTitle = 'a'.repeat(256)
      expect(() => createTaskSchema.parse({ title: longTitle })).toThrow(
        /Title must not exceed 255 characters/
      )
    })

    it('accepts title up to 255 characters', () => {
      const validTitle = 'a'.repeat(255)
      const parsed = createTaskSchema.parse({ title: validTitle })
      expect(parsed.title).toBe(validTitle)
    })

    it('rejects description longer than 2000 characters', () => {
      const longDesc = 'd'.repeat(2001)
      expect(() => createTaskSchema.parse({ title: 'Valid title', description: longDesc })).toThrow(
        /Description must not exceed 2000 characters/
      )
    })

    it('rejects invalid date format', () => {
      expect(() => createTaskSchema.parse({ title: 'Task', due_date: '05-10-2026' })).toThrow(
        /Invalid date format/
      )
      expect(() => createTaskSchema.parse({ title: 'Task', due_date: 'invalid-date' })).toThrow(
        /Invalid date format/
      )
    })

    it('rejects invalid application UUID', () => {
      expect(() => createTaskSchema.parse({ title: 'Task', application_id: 'not-a-uuid' })).toThrow(
        /Invalid application ID/
      )
    })
  })

  describe('updateTaskSchema', () => {
    it('accepts partial updates', () => {
      const parsed = updateTaskSchema.parse({ title: 'New title' })
      expect(parsed.title).toBe('New title')
      expect(parsed.priority).toBeUndefined()
    })

    it('rejects empty title when updating title', () => {
      expect(() => updateTaskSchema.parse({ title: '   ' })).toThrow(/Task title cannot be empty/)
    })

    it('accepts status update', () => {
      const parsed = updateTaskSchema.parse({ status: 'completed' })
      expect(parsed.status).toBe('completed')
    })
  })
})
