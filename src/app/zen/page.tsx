import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ZenWorkspace } from '@/components/zen/ZenWorkspace'
import { getTasks } from '@/lib/api/tasks'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'
import type { TaskWithApplication } from '@/lib/types/database.types'

export default async function ZenPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  let initialTasks: TaskWithApplication[] = []
  let initialError: string | null = null

  try {
    initialTasks = await getTasks(supabase, user.id, { status: 'pending' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load initial tasks for Zen Mode:', error)
    }
    initialError = getNormalizedErrorMessage(error, 'Gagal memuat data tugas.')
  }

  return (
    <AppShell user={user}>
      <ZenWorkspace user={user} initialTasks={initialTasks} initialTaskError={initialError} />
    </AppShell>
  )
}
