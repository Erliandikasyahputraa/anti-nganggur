'use client'

import * as React from 'react'
import { Plus, Rocket, Lightbulb } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import dynamic from 'next/dynamic'
import {
  ActivityCalendarSkeleton,
  StatusDistributionSkeleton,
} from '@/components/dashboard/DashboardChartSkeletons'

const ActivityCalendar = dynamic(
  () => import('@/components/dashboard/ActivityCalendar').then(m => m.ActivityCalendar),
  {
    ssr: false,
    loading: () => <ActivityCalendarSkeleton />,
  }
)

const StatusDistributionChart = dynamic(
  () =>
    import('@/components/dashboard/StatusDistributionChart').then(m => m.StatusDistributionChart),
  {
    ssr: false,
    loading: () => <StatusDistributionSkeleton />,
  }
)
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { DashboardTasks } from '@/components/dashboard/DashboardTasks'
import {
  getDashboardStats,
  getActivityCalendarData,
  getStatusDistribution,
  getRecentActivity,
} from '@/lib/utils/dashboard'
import { Button } from '@/components/ui/button'
import type { Application, TaskWithApplication } from '@/lib/types/database.types'
import type { User } from '@supabase/supabase-js'
import { getTasksAction, toggleTaskStatusAction } from '@/app/todos/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface DashboardWorkspaceProps {
  user: User
  initialApplications: Application[]
  initialTasks: TaskWithApplication[]
  initialTaskError?: string | null
  initialError?: string | null
}

export function DashboardWorkspace({
  initialApplications,
  initialTasks,
  initialTaskError = null,
  initialError = null,
}: DashboardWorkspaceProps) {
  const router = useRouter()
  const [applications, setApplications] = React.useState<Application[]>(initialApplications)
  const [tasks, setTasks] = React.useState<TaskWithApplication[]>(initialTasks)
  const [error] = React.useState<string | null>(initialError)
  const [taskError, setTaskError] = React.useState<string | null>(initialTaskError)
  const [mutatingTaskIds, setMutatingTaskIds] = React.useState<Set<string>>(new Set())

  // Keep internal state in sync if initial server props update (e.g. server revalidation)
  React.useEffect(() => {
    setApplications(initialApplications)
  }, [initialApplications])

  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  React.useEffect(() => {
    setTaskError(initialTaskError)
  }, [initialTaskError])

  // Derived dashboard metrics
  const stats = React.useMemo(() => getDashboardStats(applications), [applications])
  const calendarData = React.useMemo(() => getActivityCalendarData(applications), [applications])
  const distributionData = React.useMemo(() => getStatusDistribution(applications), [applications])
  const recentActivityData = React.useMemo(() => getRecentActivity(applications), [applications])

  // Retry fetching only pending tasks
  const handleRetryTasks = React.useCallback(async () => {
    try {
      setTaskError(null)
      const pendingTasks = await getTasksAction({ status: 'pending', limit: 5 })
      setTasks(pendingTasks)
    } catch (err) {
      console.error('Failed to retry dashboard tasks:', err)
      setTaskError('Gagal memuat tugas. Silakan coba lagi.')
    }
  }, [])

  // Optimistic completion toggle for pending task
  const handleToggleTask = React.useCallback(
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
      // Optimistically remove from pending list
      setTasks(prev => prev.filter(t => t.id !== task.id))

      try {
        await toggleTaskStatusAction(task.id, 'pending')
        toast.success('Tugas ditandai selesai.')
      } catch (err) {
        console.error('Failed to toggle task status:', err)
        // Rollback exact state
        setTasks(previousTasks)
        toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status tugas.')
      } finally {
        setMutatingTaskIds(prev => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      }
    },
    [tasks]
  )

  if (error) {
    return (
      <div className="mx-auto w-full px-4 max-w-7xl">
        <div className="flex items-center justify-center p-8 bg-[var(--surface-card)] rounded-2xl shadow-depth-1 border border-[var(--border-default)]">
          <div className="text-center space-y-3">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={() => window.location.reload()} className="btn-brand-gradient">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-4 max-w-7xl relative" data-testid="dashboard-workspace">
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md text-center space-y-6 bg-[var(--surface-card)] rounded-2xl p-8 sm:p-10 shadow-depth-2 border border-[var(--border-default)] relative overflow-hidden">
            {/* Subtle SVG Geometric Background */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-44 w-44 text-[var(--border-strong)] opacity-[0.04] dark:opacity-0"
              fill="none"
              viewBox="0 0 160 160"
            >
              <circle
                cx="80"
                cy="80"
                r="35"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray="3 3"
              />
              <circle cx="80" cy="80" r="55" stroke="currentColor" strokeWidth="0.75" />
              <circle
                cx="80"
                cy="80"
                r="75"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            </svg>

            <div className="relative z-10 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-xs">
                <Rocket className="h-8 w-8 text-amber-600 dark:text-amber-500" />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Mulai Perjalanan Cari Kerja Kamu
              </h2>
              <span className="sr-only">Start Your Job Hunt Journey</span>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                Dashboard analitik kamu sudah siap. Yuk, mulai masukkan daftar lamaran kerja
                pertamamu!
              </p>
              <span className="sr-only">Your analytics dashboard is ready.</span>
            </div>

            <div className="relative z-10">
              <Button
                onClick={() => router.push('/applications')}
                size="lg"
                aria-label="Go to Applications"
                className="w-full sm:w-auto btn-brand-gradient font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Buka Papan Lamaran
              </Button>
            </div>

            <div className="relative z-10 bg-[var(--surface-recessed)] rounded-xl p-4 border border-[var(--border-subtle)]">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-center justify-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>
                  Tips: Mulai dengan menambahkan lowongan yang kamu incar ke kolom Incaran
                </span>
              </p>
              <span className="sr-only">
                Tip: Start by adding jobs you&apos;re interested in to your wishlist
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Editorial Dashboard Header with Subtle Atmospheric SVG */}
          <div className="relative mb-6 pb-2 overflow-hidden rounded-2xl">
            {/* Atmospheric SVG Watermark (Technical Drafting Motif) */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -top-4 -right-4 h-40 w-72 text-[var(--border-strong)] opacity-[0.035] dark:opacity-0"
              fill="none"
              viewBox="0 0 280 160"
            >
              <defs>
                <pattern id="editorial-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path
                    d="M 16 0 L 0 0 0 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.75"
                  />
                </pattern>
                <radialGradient id="grid-fade" cx="80%" cy="20%" r="80%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id="grid-mask">
                  <rect width="280" height="160" fill="url(#grid-fade)" />
                </mask>
              </defs>
              <rect width="280" height="160" fill="url(#editorial-grid)" mask="url(#grid-mask)" />
              <circle
                cx="220"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray="3 3"
                mask="url(#grid-mask)"
              />
              <circle
                cx="220"
                cy="40"
                r="60"
                stroke="currentColor"
                strokeWidth="0.5"
                mask="url(#grid-mask)"
              />
            </svg>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Ringkasan dan analitik progres lamaran kerja kamu.
                </p>
              </div>
              {stats.active > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1 px-3 py-1.5 rounded-lg w-fit">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>
                    <strong className="text-[var(--text-primary)] tabular-nums font-semibold">
                      {stats.active}
                    </strong>{' '}
                    lamaran aktif
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Overview Section */}
          <div className="mb-8 space-y-6">
            <DashboardStats stats={stats} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityCalendar years={calendarData.years} dataByYear={calendarData.dataByYear} />
              </div>
              <div>
                <StatusDistributionChart data={distributionData} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardTasks
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onRetry={handleRetryTasks}
                isMutatingTaskIds={mutatingTaskIds}
                error={taskError}
              />
              <RecentActivity applications={recentActivityData} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
