'use client'

import * as React from 'react'
import type { User } from '@supabase/supabase-js'
import type { TaskWithApplication } from '@/lib/types/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { ZenTimer } from './ZenTimer'
import { ZenTimerControls } from './ZenTimerControls'
import { ZenTaskFocus } from './ZenTaskFocus'
import { ZenAmbientSound } from './ZenAmbientSound'
import { useZenTimer } from './hooks/useZenTimer'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { getTasksAction, toggleTaskStatusAction } from '@/app/todos/actions'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

export interface ZenWorkspaceProps {
  user?: User | null
  initialTasks?: TaskWithApplication[]
  initialTaskError?: string | null
}

export function ZenWorkspace({ initialTasks = [], initialTaskError = null }: ZenWorkspaceProps) {
  // Timer Hook
  const { status, preset, progress, formattedTime, start, pause, resume, reset, setPreset } =
    useZenTimer()

  // Ambient Audio Hook
  const { sound, volume, toggleSound, setVolume } = useAmbientAudio()

  // Task Integration State
  const [tasks, setTasks] = React.useState<TaskWithApplication[]>(initialTasks)
  const [taskError, setTaskError] = React.useState<string | null>(initialTaskError)
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null)
  const [mutatingTaskIds, setMutatingTaskIds] = React.useState<Set<string>>(new Set())

  // Load tasks on mount if not provided as initialTasks
  React.useEffect(() => {
    if (initialTasks.length > 0 || initialTaskError) return

    let isMounted = true
    async function fetchTasks() {
      try {
        setTaskError(null)
        const pendingTasks = await getTasksAction({ status: 'pending' })
        if (isMounted) {
          setTasks(pendingTasks)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load tasks for Zen Mode:', err)
          setTaskError('Gagal memuat daftar tugas.')
        }
      }
    }

    fetchTasks()
    return () => {
      isMounted = false
    }
  }, [initialTasks.length, initialTaskError])

  // Retry fetching tasks (isolated from timer)
  const handleRetryTasks = React.useCallback(async () => {
    try {
      setTaskError(null)
      const pendingTasks = await getTasksAction({ status: 'pending' })
      setTasks(pendingTasks)
    } catch (err) {
      console.error('Failed to retry tasks for Zen Mode:', err)
      setTaskError('Gagal memuat daftar tugas.')
    }
  }, [])

  // Direct task completion with optimistic removal & rollback
  const handleCompleteTask = React.useCallback(
    async (task: TaskWithApplication) => {
      let shouldProceed = false
      setMutatingTaskIds(prev => {
        if (prev.has(task.id)) return prev
        shouldProceed = true
        const next = new Set(prev)
        next.add(task.id)
        return next
      })

      if (!shouldProceed) return

      const previousTasks = [...tasks]
      const wasActive = activeTaskId === task.id

      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== task.id))
      if (wasActive) {
        setActiveTaskId(null)
      }

      try {
        await toggleTaskStatusAction(task.id, 'pending')
        toast.success('Tugas ditandai selesai.')
      } catch (err) {
        console.error('Failed to complete task from Zen:', err)
        // Rollback state
        setTasks(previousTasks)
        if (wasActive) {
          setActiveTaskId(task.id)
        }
        toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status tugas.')
      } finally {
        setMutatingTaskIds(prev => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      }
    },
    [tasks, activeTaskId]
  )

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-12 space-y-6" data-testid="zen-workspace">
      {/* Editorial Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ruang Fokus & Produktivitas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Zen Mode
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Fokus mendalam untuk persiapan karier, riset perusahaan, dan latihan wawancara kerjamu.
        </p>
      </div>

      {/* Main Timer Card */}
      <Card
        className="w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1 rounded-3xl overflow-hidden"
        data-testid="zen-timer-card"
      >
        <CardContent className="p-6 sm:p-8 space-y-6">
          <ZenTimer formattedTime={formattedTime} progress={progress} status={status} />

          <ZenTimerControls
            status={status}
            preset={preset}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onSelectPreset={setPreset}
          />
        </CardContent>
      </Card>

      {/* Task Focus Section */}
      <ZenTaskFocus
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectTask={setActiveTaskId}
        onCompleteTask={handleCompleteTask}
        isMutatingTaskIds={mutatingTaskIds}
        error={taskError}
        onRetry={handleRetryTasks}
      />

      {/* Ambient Sound Section */}
      <ZenAmbientSound
        sound={sound}
        volume={volume}
        onToggleSound={toggleSound}
        onChangeVolume={setVolume}
      />
    </div>
  )
}
