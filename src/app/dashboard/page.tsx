import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardWorkspace } from '@/components/dashboard/DashboardWorkspace'
import { getApplications } from '@/lib/api/applications'
import { getTasks } from '@/lib/api/tasks'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  let applications: Application[] = []
  let tasks: TaskWithApplication[] = []
  let initialError: string | null = null
  let initialTaskError: string | null = null

  const [appResult, taskResult] = await Promise.allSettled([
    getApplications(supabase, user.id),
    getTasks(supabase, user.id, { status: 'pending', limit: 5 }),
  ])

  if (appResult.status === 'fulfilled') {
    applications = appResult.value
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load applications for dashboard:', appResult.reason)
    }
    initialError = getNormalizedErrorMessage(
      appResult.reason,
      'Failed to load applications. Please try again.'
    )
  }

  if (taskResult.status === 'fulfilled') {
    tasks = taskResult.value
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load dashboard tasks:', taskResult.reason)
    }
    initialTaskError = getNormalizedErrorMessage(
      taskResult.reason,
      'Gagal memuat tugas. Silakan coba lagi.'
    )
  }

  return (
    <AppShell user={user}>
      <DashboardWorkspace
        user={user}
        initialApplications={applications}
        initialTasks={tasks}
        initialTaskError={initialTaskError}
        initialError={initialError}
      />
    </AppShell>
  )
}
