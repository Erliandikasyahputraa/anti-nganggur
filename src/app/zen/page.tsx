'use client'

import * as React from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function ZenPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-2">
        <h1 className="text-2xl font-bold text-label-primary">Zen Mode</h1>
        <p className="text-sm text-label-secondary">
          Mode fokus dan persiapan kerja sedang dalam pengembangan.
        </p>
      </div>
    </AppShell>
  )
}
