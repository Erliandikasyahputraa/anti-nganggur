import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ApplicationsWorkspace } from '@/components/applications/ApplicationsWorkspace'
import ApplicationsLoading from './loading'
import { getApplications } from '@/lib/api/applications'
import { getCustomColumns } from '@/lib/api/custom-columns'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  let applications: Application[] = []
  let customColumns: CustomColumnDB[] = []
  let initialError: string | null = null

  try {
    const [apps, cols] = await Promise.all([
      getApplications(supabase, user.id),
      getCustomColumns(supabase, user.id),
    ])
    applications = apps
    customColumns = cols
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load applications workspace data:', error)
    }
    initialError = getNormalizedErrorMessage(
      error,
      'Authentication required or failed to load data. Please log in.'
    )
  }

  return (
    <AppShell user={user}>
      <React.Suspense fallback={<ApplicationsLoading />}>
        <ApplicationsWorkspace
          user={user}
          initialApplications={applications}
          initialCustomColumns={customColumns}
          initialError={initialError}
        />
      </React.Suspense>
    </AppShell>
  )
}
