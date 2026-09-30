import { AppShell } from '@/components/layout/AppShell'

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] px-4 flex-1 flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 rounded-md bg-label-quaternary/20 animate-pulse mb-2"></div>
            <div className="h-4 w-64 rounded-md bg-label-quaternary/20 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 rounded-md bg-label-quaternary/20 animate-pulse"></div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-[120px] rounded-glass bg-label-quaternary/20 animate-pulse shadow-glass-subtle glass-light"
            ></div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <div className="h-[300px] w-full rounded-glass bg-label-quaternary/20 animate-pulse shadow-glass-subtle glass-light"></div>
          </div>
          <div>
            <div className="h-[300px] w-full rounded-glass bg-label-quaternary/20 animate-pulse shadow-glass-subtle glass-light"></div>
          </div>
        </div>

        <div>
          <div className="h-[400px] w-full rounded-glass bg-label-quaternary/20 animate-pulse shadow-glass-subtle glass-light"></div>
        </div>
      </div>
    </AppShell>
  )
}
