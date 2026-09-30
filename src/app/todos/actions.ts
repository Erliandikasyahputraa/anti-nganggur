'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'
import { createTaskSchema, updateTaskSchema } from '@/lib/schemas/task.schema'
import type { TaskStatus, TaskWithApplication } from '@/lib/types/database.types'

export type CreateTaskActionInput = z.input<typeof createTaskSchema>
export type UpdateTaskActionInput = z.input<typeof updateTaskSchema>
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  type GetTasksOptions,
} from '@/lib/api/tasks'

/**
 * Helper to authenticate user on the server
 */
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const err = new Error('Unauthorized')
    err.name = 'AuthSessionMissingError'
    throw err
  }

  return { supabase, user }
}

/**
 * Fetch tasks for the authenticated user
 */
export async function getTasksAction(options?: GetTasksOptions): Promise<TaskWithApplication[]> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    return await getTasks(supabase, user.id, options)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get tasks in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal memuat tugas. Silakan coba lagi.'))
  }
}

/**
 * Fetch a single task by ID
 */
export async function getTaskByIdAction(taskId: string): Promise<TaskWithApplication | null> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    return await getTaskById(supabase, taskId, user.id)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get task by id in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal memuat tugas.'))
  }
}

/**
 * Create a new task with validation and cache revalidation
 */
export async function createTaskAction(input: CreateTaskActionInput): Promise<TaskWithApplication> {
  try {
    const validatedData = createTaskSchema.parse(input)
    const { supabase, user } = await getAuthenticatedUser()

    const task = await createTask(supabase, validatedData, user.id)

    revalidatePath('/todos')
    revalidatePath('/dashboard')
    if (task.application_id) {
      revalidatePath('/applications')
    }

    return task
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create task in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal membuat tugas baru.'))
  }
}

/**
 * Update an existing task with validation and cache revalidation
 */
export async function updateTaskAction(
  taskId: string,
  input: UpdateTaskActionInput
): Promise<TaskWithApplication> {
  try {
    const validatedData = updateTaskSchema.parse(input)
    const { supabase, user } = await getAuthenticatedUser()

    const task = await updateTask(supabase, taskId, validatedData, user.id)

    revalidatePath('/todos')
    revalidatePath('/dashboard')
    if (task.application_id) {
      revalidatePath('/applications')
    }

    return task
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update task in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal memperbarui tugas.'))
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskStatusAction(
  taskId: string,
  currentStatus: TaskStatus
): Promise<TaskWithApplication> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    const task = await toggleTaskStatus(supabase, taskId, currentStatus, user.id)

    revalidatePath('/todos')
    revalidatePath('/dashboard')
    if (task.application_id) {
      revalidatePath('/applications')
    }

    return task
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to toggle task status in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal mengubah status tugas.'))
  }
}

/**
 * Delete a task
 */
export async function deleteTaskAction(taskId: string): Promise<void> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    await deleteTask(supabase, taskId, user.id)

    revalidatePath('/todos')
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to delete task in action:', error)
    }
    throw new Error(getNormalizedErrorMessage(error, 'Gagal menghapus tugas.'))
  }
}
