'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, CheckSquare, Focus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ProfileDropdown } from '@/components/auth/ProfileDropdown'
import { cn } from '@/lib/utils'

export interface NavigationNotchProps {
  user?: User | null
  className?: string
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { id: 'applications', label: 'Apps', href: '/applications', icon: Briefcase, exact: false },
  { id: 'todos', label: 'To-Do', href: '/todos', icon: CheckSquare, exact: false },
  { id: 'zen', label: 'Zen', href: '/zen', icon: Focus, exact: false },
]

export function NavigationNotch({ user, className }: NavigationNotchProps) {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <header
      role="banner"
      className={cn(
        'fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40',
        'w-fit max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]',
        'rounded-full glass-medium shadow-glass-medium',
        'border border-[var(--glass-border-strong)]',
        'px-2.5 sm:px-3.5 py-1 sm:py-1.5',
        'flex items-center gap-1 sm:gap-2',
        'transition-all duration-200 ease-out',
        'motion-reduce:transition-none motion-reduce:transform-none',
        className
      )}
    >
      {/* Primary Navigation Links */}
      <nav aria-label="Navigasi Utama" className="flex items-center gap-1 sm:gap-1.5">
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={cn(
                'relative flex items-center justify-center sm:justify-start gap-2',
                'h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full',
                'text-sm font-medium transition-colors duration-150',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                'motion-reduce:transition-none',
                'before:absolute before:-inset-1 before:content-[""] sm:before:hidden',
                active
                  ? 'bg-label-quaternary/15 dark:bg-white/10 text-label-primary font-semibold shadow-xs'
                  : 'text-label-secondary hover:text-label-primary hover:bg-label-quaternary/8'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sr-only sm:hidden">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Hairline Separator */}
      <div
        className="h-4 sm:h-5 w-px bg-[var(--glass-border-subtle)] mx-0.5 sm:mx-1 opacity-60 shrink-0"
        aria-hidden="true"
      />

      {/* Global Utilities Cluster */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <ThemeToggle />
        {user && <ProfileDropdown user={user} className="h-9 px-2 sm:px-3 rounded-full" />}
      </div>
    </header>
  )
}
