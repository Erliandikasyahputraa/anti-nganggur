'use client'

import * as React from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function TodosPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-2">
        <h1 className="text-2xl font-bold text-label-primary">To-Do</h1>
        <p className="text-sm text-label-secondary">Workspace tugas sedang dalam pengembangan.</p>
      </div>
    </AppShell>
  )
}
