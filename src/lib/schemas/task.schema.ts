import { z } from 'zod'

/**
 * Task status enum schema
 */
export const taskStatusSchema = z.enum(['pending', 'completed'])

/**
 * Task priority enum schema
 */
export const taskPrioritySchema = z.enum(['low', 'medium', 'high'])

/**
 * Task filter enum schema
 */
export const taskFilterSchema = z.enum(['all', 'today', 'upcoming', 'completed'])

/**
 * Schema for creating a task
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(255, 'Title must not exceed 255 characters'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? null))),

  priority: taskPrioritySchema.default('medium'),

  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? null))),

  application_id: z
    .string()
    .uuid('Invalid application ID')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? null))),
})

/**
 * Schema for updating an existing task
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title cannot be empty')
    .max(255, 'Title must not exceed 255 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? undefined))),

  priority: taskPrioritySchema.optional(),

  status: taskStatusSchema.optional(),

  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? undefined))),

  application_id: z
    .string()
    .uuid('Invalid application ID')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : (val ?? undefined))),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskFilter = z.infer<typeof taskFilterSchema>
