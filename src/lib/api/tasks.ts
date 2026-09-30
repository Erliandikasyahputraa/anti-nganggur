import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TaskDB,
  TaskInsert,
  TaskUpdate,
  TaskStatus,
  TaskPriority,
  TaskWithApplication,
} from '@/lib/types/database.types'
import type { TaskFilter } from '@/lib/schemas/task.schema'

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Verify authentication context and extract authenticated user ID
 */
async function verifyAuthenticationContext(
  supabase: SupabaseClient,
  userId?: string
): Promise<string> {
  if (userId) {
    return userId
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication required')
  }

  return user.id
}

/**
 * Verify that the target application belongs to the authenticated user (Defense in Depth)
 */
async function verifyApplicationOwnership(
  supabase: SupabaseClient,
  applicationId: string,
  authenticatedUserId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, user_id')
    .eq('id', applicationId)
    .single()

  if (error || !data || data.user_id !== authenticatedUserId) {
    throw new Error('Target application not found or not owned by user')
  }
}

export interface GetTasksOptions {
  applicationId?: string
  filter?: TaskFilter
  status?: TaskStatus
  limit?: number
}

/**
 * Sort tasks deterministically:
 * 1. Pending first, completed last
 * 2. Due date ASC with NULL due dates last
 * 3. Priority: high > medium > low
 * 4. Created at DESC
 */
export function sortTasksDeterministically<T extends TaskDB>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    // 1. Pending first
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }

    // 2. Due date ASC, NULLs last
    if (a.due_date && b.due_date) {
      if (a.due_date !== b.due_date) {
        return a.due_date.localeCompare(b.due_date)
      }
    } else if (a.due_date && !b.due_date) {
      return -1
    } else if (!a.due_date && b.due_date) {
      return 1
    }

    // 3. Priority: high > medium > low
    const pDiff = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)
    if (pDiff !== 0) {
      return pDiff
    }

    // 4. Created at DESC
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

/**
 * Fetch tasks for authenticated user with optional filtering and application join
 */
export async function getTasks(
  supabase: SupabaseClient,
  userId?: string,
  options?: GetTasksOptions
): Promise<TaskWithApplication[]> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

  let query = supabase
    .from('tasks')
    .select('*, application:applications(id, job_title, company_name)')
    .eq('user_id', authenticatedUserId)

  if (options?.applicationId) {
    query = query.eq('application_id', options.applicationId)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Handle high-level filter
  const todayStr = new Date().toISOString().split('T')[0]
  if (options?.filter === 'today') {
    query = query.eq('status', 'pending').lte('due_date', todayStr)
  } else if (options?.filter === 'upcoming') {
    query = query.eq('status', 'pending').gt('due_date', todayStr)
  } else if (options?.filter === 'completed') {
    query = query.eq('status', 'completed')
  }

  // Database ordering utilizes idx_tasks_user_status_due
  query = query
    .order('status', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return sortTasksDeterministically((data || []) as TaskWithApplication[])
}

/**
 * Fetch tasks associated with a specific job application
 */
export async function getTasksByApplicationId(
  supabase: SupabaseClient,
  applicationId: string,
  userId?: string
): Promise<TaskWithApplication[]> {
  return getTasks(supabase, userId, { applicationId })
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  supabase: SupabaseClient,
  taskId: string,
  userId?: string
): Promise<TaskWithApplication | null> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

  const { data, error } = await supabase
    .from('tasks')
    .select('*, application:applications(id, job_title, company_name)')
    .eq('id', taskId)
    .eq('user_id', authenticatedUserId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch task: ${error.message}`)
  }

  return data as TaskWithApplication
}

/**
 * Create a new task with defense-in-depth application ownership verification
 */
export async function createTask(
  supabase: SupabaseClient,
  taskData: TaskInsert,
  userId?: string
): Promise<TaskWithApplication> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

  // Defense-in-depth: Validate application ownership if application_id is provided
  if (taskData.application_id) {
    await verifyApplicationOwnership(supabase, taskData.application_id, authenticatedUserId)
  }

  const payload = {
    ...taskData,
    user_id: authenticatedUserId,
    application_id: taskData.application_id || null,
    status: taskData.status || 'pending',
    priority: taskData.priority || 'medium',
    due_date: taskData.due_date || null,
    completed_at: taskData.status === 'completed' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('*, application:applications(id, job_title, company_name)')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create task: ${error?.message || 'Database insert failed'}`)
  }

  return data as TaskWithApplication
}

/**
 * Update an existing task with defense-in-depth application ownership verification
 */
export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: TaskUpdate,
  userId?: string
): Promise<TaskWithApplication> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

  // Defense-in-depth: Validate application ownership if updating application_id
  if (updates.application_id) {
    await verifyApplicationOwnership(supabase, updates.application_id, authenticatedUserId)
  }

  const updatePayload: Record<string, any> = { ...updates }

  // Manage completed_at if status changed
  if (updates.status !== undefined) {
    if (updates.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString()
    } else {
      updatePayload.completed_at = null
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('user_id', authenticatedUserId)
    .select('*, application:applications(id, job_title, company_name)')
    .single()

  if (error || !data) {
    throw new Error(`Failed to update task: ${error?.message || 'Task not found'}`)
  }

  return data as TaskWithApplication
}

/**
 * Toggle task completion status
 * Guarantees that only status and completed_at mutate; all other fields are preserved
 */
export async function toggleTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  currentStatus: TaskStatus,
  userId?: string
): Promise<TaskWithApplication> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)
  const isCompleting = currentStatus === 'pending'
  const newStatus: TaskStatus = isCompleting ? 'completed' : 'pending'
  const completedAt = isCompleting ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      completed_at: completedAt,
    })
    .eq('id', taskId)
    .eq('user_id', authenticatedUserId)
    .select('*, application:applications(id, job_title, company_name)')
    .single()

  if (error || !data) {
    throw new Error(`Failed to toggle task status: ${error?.message || 'Task not found'}`)
  }

  return data as TaskWithApplication
}

/**
 * Delete a task owned by the authenticated user
 */
export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string,
  userId?: string
): Promise<void> {
  const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', authenticatedUserId)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}
