'use client'

import * as React from 'react'
import type { User } from '@supabase/supabase-js'
import { NavigationNotch } from '@/components/layout/NavigationNotch'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { cn } from '@/lib/utils'

export interface AppShellProps {
  user?: User | null
  children: React.ReactNode
  className?: string
  mainClassName?: string
}

export function AppShell({ user, children, className, mainClassName }: AppShellProps) {
  return (
    <AnimatedBackground variant="minimal">
      <div className={cn('min-h-screen flex flex-col relative', className)}>
        {/* Floating Top Navigation Notch */}
        <NavigationNotch user={user} />

        {/* Global Main Basin with Centralized Top Clearance */}
        <main className={cn('flex-1 w-full pt-20 sm:pt-24 pb-6', mainClassName)}>{children}</main>
      </div>
    </AnimatedBackground>
  )
}
