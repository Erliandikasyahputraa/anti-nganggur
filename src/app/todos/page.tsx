import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { TodosWorkspace } from '@/components/todos/TodosWorkspace'
import { getTasks } from '@/lib/api/tasks'
import { getApplicationOptions } from '@/lib/api/applications'
import { getNormalizedErrorMessage } from '@/lib/utils/error-handler'
import type { TaskWithApplication } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'

export default async function TodosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  let initialTasks: TaskWithApplication[] = []
  let applicationOptions: ApplicationOption[] = []
  let initialError: string | null = null

  try {
    const [tasks, options] = await Promise.all([
      getTasks(supabase, user.id),
      getApplicationOptions(supabase, user.id),
    ])
    initialTasks = tasks
    applicationOptions = options
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load initial todos data:', error)
    }
    initialError = getNormalizedErrorMessage(
      error,
      'Gagal memuat data tugas. Silakan muat ulang halaman.'
    )
  }

  return (
    <AppShell user={user}>
      <TodosWorkspace
        user={user}
        initialTasks={initialTasks}
        applicationOptions={applicationOptions}
        initialError={initialError}
      />
    </AppShell>
  )
}
