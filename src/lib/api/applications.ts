import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  ApplicationStatus,
  ApplicationStatusHistoryDB,
  DashboardApplication,
} from '@/lib/types/database.types'
import {
  bulkApplicationIdsSchema,
  bulkStatusUpdateSchema,
  bulkCustomColumnUpdateSchema,
} from '@/lib/schemas/bulk.schema'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'

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

  if (authError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', authError)
    }
    throw new Error(`Authentication failed: ${authError.message}. Please check your login session.`)
  }

  if (!user) {
    throw new Error('No authenticated user found. Please log in and try again.')
  }

  return user.id
}

export async function getApplications(
  supabase: SupabaseClient,
  userId?: string
): Promise<Application[]> {
  try {
    // Verify authentication context first
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .order('status', { ascending: true })
      .order('position', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database query error:', error)
      }

      // Provide specific guidance for common errors
      if (error.message.includes('permission denied')) {
        throw new Error(
          `Permission denied accessing applications table. This usually indicates: ` +
            `1) RLS policies are not properly configured, ` +
            `2) Environment variables are missing/incorrect, or ` +
            `3) User session is invalid. Original error: ${error.message}`
        )
      }

      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplications error:', error)
    }
    throw error
  }
}

export const DASHBOARD_APPLICATIONS_PROJECTION =
  'id, company_name, job_title, status, date_applied, created_at, updated_at' as const

export async function getDashboardApplications(
  supabase: SupabaseClient,
  userId?: string
): Promise<DashboardApplication[]> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .select(DASHBOARD_APPLICATIONS_PROJECTION)
      .eq('user_id', authenticatedUserId)
      .order('created_at', { ascending: false })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database query error in getDashboardApplications:', error)
      }

      if (error.message.includes('permission denied')) {
        throw new Error(
          `Permission denied accessing applications table. This usually indicates: ` +
            `1) RLS policies are not properly configured, ` +
            `2) Environment variables are missing/incorrect, or ` +
            `3) User session is invalid. Original error: ${error.message}`
        )
      }

      throw new Error(`Failed to fetch dashboard applications: ${error.message}`)
    }

    return (data || []) as unknown as DashboardApplication[]
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getDashboardApplications error:', error)
    }
    throw error
  }
}

export async function getApplication(
  supabase: SupabaseClient,
  id: string,
  userId?: string
): Promise<Application> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', authenticatedUserId) // Ensure user can only access their own applications
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch application:', error)
      }
      throw new Error(`Failed to fetch application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplication error:', error)
    }
    throw error
  }
}

export async function createApplication(
  supabase: SupabaseClient,
  application: ApplicationInsert,
  userId?: string
): Promise<Application> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    // Ensure the application is created for the authenticated user
    const applicationWithUser = { ...application, user_id: authenticatedUserId }

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationWithUser)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create application:', error)
      }
      throw new Error(`Failed to create application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('createApplication error:', error)
    }
    throw error
  }
}

export async function updateApplication(
  supabase: SupabaseClient,
  id: string,
  updates: ApplicationUpdate,
  userId?: string
): Promise<Application> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', authenticatedUserId) // Ensure user can only update their own applications
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update application:', error)
      }
      throw new Error(`Failed to update application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateApplication error:', error)
    }
    throw error
  }
}

export async function deleteApplication(
  supabase: SupabaseClient,
  id: string,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', authenticatedUserId) // Ensure user can only delete their own applications

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete application:', error)
      }
      throw new Error(`Failed to delete application: ${error.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('deleteApplication error:', error)
    }
    throw error
  }
}

export async function getApplicationsByStatus(
  supabase: SupabaseClient,
  status: Application['status'],
  userId?: string
): Promise<Application[]> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('status', status)
      .eq('user_id', authenticatedUserId) // Ensure user can only access their own applications
      .order('position', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch applications by status:', error)
      }
      throw new Error(`Failed to fetch applications by status: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplicationsByStatus error:', error)
    }
    throw error
  }
}

/**
 * Reorder applications within a column
 * Updates positions for all applications in the reordered list
 */
export async function reorderApplicationsInColumn(
  supabase: SupabaseClient,
  updates: Array<{ id: string; position: number }>,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    // Execute all updates in parallel
    const updatePromises = updates.map(
      ({ id, position }) =>
        supabase
          .from('applications')
          .update({ position, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', authenticatedUserId) // Ensure user can only update their own applications
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to reorder applications:', errors)
      }
      throw new Error('Failed to reorder applications')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('reorderApplicationsInColumn error:', error)
    }
    throw error
  }
}

/**
 * Update application position and optionally status
 * Used for both same-column reordering and cross-column moves
 */
export async function updateApplicationPosition(
  supabase: SupabaseClient,
  id: string,
  position: number,
  status?: Application['status'],
  customColumnId?: string | null,
  userId?: string
): Promise<Application> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const updates: Partial<Application> = {
      position,
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updates.status = status
    }

    if (customColumnId !== undefined) {
      updates.custom_column_id = customColumnId
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', authenticatedUserId) // Ensure user can only update their own applications
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update application position:', error)
      }
      throw new Error(`Failed to update application position: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateApplicationPosition error:', error)
    }
    throw error
  }
}

/**
 * Bulk delete applications
 * 1. Validates inputs & user authentication
 * 2. Fetches associated storage paths from application_documents for this user
 * 3. Removes files from private jobhunt_documents bucket
 * 4. Deletes application rows from PostgreSQL (application_documents metadata cascades)
 */
export async function bulkDeleteApplications(
  supabase: SupabaseClient,
  applicationIds: string[],
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)
    const validatedIds = bulkApplicationIdsSchema.parse(applicationIds)
    const uniqueIds = Array.from(new Set(validatedIds))

    // 1. Query storage paths belonging to selected applications AND authenticated user
    const { data: docs, error: docError } = await supabase
      .from('application_documents')
      .select('storage_path')
      .in('application_id', uniqueIds)
      .eq('user_id', authenticatedUserId)

    if (docError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to query documents for bulk delete:', docError)
      }
      throw new Error(`Failed to check application documents: ${docError.message}`)
    }

    // 2. Remove storage objects from jobhunt_documents bucket
    if (docs && docs.length > 0) {
      const storagePaths = docs.map(d => d.storage_path).filter(Boolean)
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('jobhunt_documents')
          .remove(storagePaths)

        if (storageError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Storage deletion error during bulk delete:', storageError)
          }
          throw new Error(`Failed to delete document files: ${storageError.message}`)
        }
      }
    }

    // 3. Delete application records (PostgreSQL cascades application_documents rows)
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .in('id', uniqueIds)
      .eq('user_id', authenticatedUserId)

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete applications in bulk:', deleteError)
      }
      throw new Error(`Failed to delete applications: ${deleteError.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('bulkDeleteApplications error:', error)
    }
    throw error
  }
}

/**
 * Bulk update application core status
 * Preserves Phase 3.1 invariant: moving to core status resets custom_column_id to null
 */
export async function bulkUpdateApplicationStatus(
  supabase: SupabaseClient,
  applicationIds: string[],
  status: ApplicationStatus,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)
    const validated = bulkStatusUpdateSchema.parse({ ids: applicationIds, status })
    const uniqueIds = Array.from(new Set(validated.ids))

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: validated.status,
        custom_column_id: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', uniqueIds)
      .eq('user_id', authenticatedUserId)

    if (updateError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to bulk update application status:', updateError)
      }
      throw new Error(`Failed to update application status: ${updateError.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('bulkUpdateApplicationStatus error:', error)
    }
    throw error
  }
}

/**
 * Bulk update application custom column
 * Validates ownership of destination custom column if non-null
 */
export async function bulkUpdateApplicationCustomColumn(
  supabase: SupabaseClient,
  applicationIds: string[],
  customColumnId: string | null,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)
    const validated = bulkCustomColumnUpdateSchema.parse({
      ids: applicationIds,
      customColumnId,
    })
    const uniqueIds = Array.from(new Set(validated.ids))

    // If a custom column UUID is provided, verify it belongs to the authenticated user
    if (validated.customColumnId !== null) {
      const { data: column, error: colError } = await supabase
        .from('custom_columns')
        .select('id')
        .eq('id', validated.customColumnId)
        .eq('user_id', authenticatedUserId)
        .single()

      if (colError || !column) {
        throw new Error('Unauthorized or custom column not found')
      }
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        custom_column_id: validated.customColumnId,
        updated_at: new Date().toISOString(),
      })
      .in('id', uniqueIds)
      .eq('user_id', authenticatedUserId)

    if (updateError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to bulk update application custom column:', updateError)
      }
      throw new Error(`Failed to update application custom column: ${updateError.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('bulkUpdateApplicationCustomColumn error:', error)
    }
    throw error
  }
}

/**
 * Get status and column transition history for a specific application
 */
export async function getApplicationHistory(
  supabase: SupabaseClient,
  applicationId: string,
  userId?: string
): Promise<ApplicationStatusHistoryDB[]> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', authenticatedUserId)
      .order('created_at', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch application status history:', error)
      }
      return []
    }

    return (data as ApplicationStatusHistoryDB[]) || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplicationHistory error:', error)
    }
    return []
  }
}

export interface ApplicationOption {
  id: string
  company_name: string
  job_title: string
}

/**
 * Fetch lightweight application options (id, company_name, job_title) for selection dropdowns.
 * Scoped strictly to the authenticated user and ordered alphabetically by company_name.
 */
export async function getApplicationOptions(
  supabase: SupabaseClient,
  userId?: string
): Promise<ApplicationOption[]> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('applications')
      .select('id, company_name, job_title')
      .eq('user_id', authenticatedUserId)
      .order('company_name', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database query error in getApplicationOptions:', error)
      }
      throw new Error(getNormalizedErrorMessage(error, 'Gagal memuat daftar opsi lamaran.'))
    }

    return (data || []) as ApplicationOption[]
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplicationOptions error:', error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Gagal memuat daftar opsi lamaran.')
  }
}
