'use client'

import * as React from 'react'
import { Plus, Rocket, Lightbulb } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import dynamic from 'next/dynamic'

const ActivityCalendar = dynamic(
  () => import('@/components/dashboard/ActivityCalendar').then(m => m.ActivityCalendar),
  { ssr: false }
)

const StatusDistributionChart = dynamic(
  () =>
    import('@/components/dashboard/StatusDistributionChart').then(m => m.StatusDistributionChart),
  { ssr: false }
)
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import {
  getDashboardStats,
  getActivityCalendarData,
  getStatusDistribution,
  getRecentActivity,
} from '@/lib/utils/dashboard'
import { Button } from '@/components/ui/button'
import type { Application } from '@/lib/types/database.types'
import type { User } from '@supabase/supabase-js'
import { getApplicationsWorkspaceDataAction } from './actions'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = React.useState<Application[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // User state for NavBar
  const [user, setUser] = React.useState<User | null>(null)

  // Derived dashboard metrics
  const stats = React.useMemo(() => getDashboardStats(applications), [applications])
  const calendarData = React.useMemo(() => getActivityCalendarData(applications), [applications])
  const distributionData = React.useMemo(() => getStatusDistribution(applications), [applications])
  const recentActivityData = React.useMemo(() => getRecentActivity(applications), [applications])

  // Load user session and applications on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Load applications and user in a single authenticated server action
        const data = await getApplicationsWorkspaceDataAction()
        setUser(data.user)
        setApplications(data.applications)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <AppShell user={user}>
        <div className="mx-auto w-full px-4 max-w-7xl">
          <span className="sr-only">Loading dashboard...</span>
          {/* Dashboard Skeleton */}
          <div
            className="space-y-6 animate-pulse"
            aria-busy="true"
            aria-label="Loading dashboard..."
          >
            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="bg-[var(--surface-card)] rounded-2xl p-6 shadow-depth-1 space-y-3 border border-[var(--border-default)]"
                >
                  <div className="h-4 w-24 bg-muted/60 rounded-md" />
                  <div className="h-8 w-16 bg-muted/80 rounded-md" />
                </div>
              ))}
            </div>

            {/* Charts Row Skeleton */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-2xl p-6 shadow-depth-1 border border-[var(--border-default)] h-72 flex flex-col justify-between">
                <div className="h-5 w-40 bg-muted/60 rounded-md" />
                <div className="h-44 w-full bg-muted/30 rounded-xl" />
              </div>
              <div className="bg-[var(--surface-card)] rounded-2xl p-6 shadow-depth-1 border border-[var(--border-default)] h-72 flex flex-col justify-between">
                <div className="h-5 w-36 bg-muted/60 rounded-md" />
                <div className="h-44 w-full bg-muted/30 rounded-xl" />
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="bg-[var(--surface-card)] rounded-2xl p-6 shadow-depth-1 border border-[var(--border-default)] space-y-4">
              <div className="h-5 w-32 bg-muted/60 rounded-md" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 w-full bg-muted/30 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell user={user}>
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
      </AppShell>
    )
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto w-full px-4 max-w-7xl relative">
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
                  <ActivityCalendar
                    years={calendarData.years}
                    dataByYear={calendarData.dataByYear}
                  />
                </div>
                <div>
                  <StatusDistributionChart data={distributionData} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <RecentActivity applications={recentActivityData} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
