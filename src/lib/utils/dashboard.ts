import { DashboardApplication } from '@/lib/types/database.types'
import { format, parseISO } from 'date-fns'
import { getStatusCategory, STATUS_STYLES, type StatusCategory } from './status-colors'

export interface DashboardStats {
  total: number
  active: number
  interviews: number
  offers: number
}

export function getDashboardStats(applications: DashboardApplication[]): DashboardStats {
  return applications.reduce(
    (acc, app) => {
      acc.total++

      if (
        [
          'wishlist',
          'applied',
          'phone_screen',
          'assessment',
          'take_home',
          'interviewing',
          'final_round',
          'offered',
        ].includes(app.status)
      ) {
        acc.active++
      }

      if (
        ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'].includes(
          app.status
        )
      ) {
        acc.interviews++
      }

      if (['offered', 'accepted'].includes(app.status)) {
        acc.offers++
      }

      return acc
    },
    { total: 0, active: 0, interviews: 0, offers: 0 }
  )
}

export function getActivityCalendarData(applications: DashboardApplication[]) {
  const countsByDay: Record<string, number> = {}
  const years = new Set<string>()

  applications.forEach(app => {
    // Some older apps might not have date_applied, fallback to created_at
    const dateStr = app.date_applied || app.created_at
    if (!dateStr) return

    try {
      const date = parseISO(dateStr)
      const dayKey = format(date, 'yyyy-MM-dd')
      const year = format(date, 'yyyy')

      countsByDay[dayKey] = (countsByDay[dayKey] || 0) + 1
      years.add(year)
    } catch (_e) {
      console.warn('Failed to parse date:', dateStr)
    }
  })

  // If no data, add the current year
  if (years.size === 0) {
    years.add(format(new Date(), 'yyyy'))
  }

  const sortedYears = Array.from(years).sort()
  const dataByYear: Record<string, { day: string; value: number }[]> = {}

  sortedYears.forEach(year => {
    dataByYear[year] = []
  })

  Object.entries(countsByDay).forEach(([day, value]) => {
    const year = day.substring(0, 4)
    if (dataByYear[year]) {
      dataByYear[year].push({ day, value })
    }
  })

  return { years: sortedYears, dataByYear }
}

export function getStatusDistribution(applications: DashboardApplication[]) {
  const statusCounts: Record<string, number> = {}

  applications.forEach(app => {
    const category = getStatusCategory(app.status)
    statusCounts[category] = (statusCounts[category] || 0) + 1
  })

  return Object.entries(statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([label, value]) => ({
      id: label,
      label,
      value,
      color: STATUS_STYLES[label as StatusCategory]?.chart || STATUS_STYLES.Other.chart,
    }))
    .sort((a, b) => b.value - a.value)
}

export function getRecentActivity(applications: DashboardApplication[], limit = 5) {
  return [...applications]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime()
      const dateB = new Date(b.updated_at || b.created_at).getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}
