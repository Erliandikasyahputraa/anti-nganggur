import { AppShell } from '@/components/layout/AppShell'

export default function ApplicationsLoading() {
  return (
    <AppShell>
      <div className="w-full px-4 flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 pb-4">
          <div className="h-7 w-48 rounded-md bg-label-quaternary/20 animate-pulse"></div>

          <div className="flex-1 w-full sm:mx-4">
            <div className="h-10 w-full sm:max-w-md mx-auto rounded-glass-sm bg-label-quaternary/20 animate-pulse"></div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <div className="h-9 w-full sm:w-36 rounded-md bg-label-quaternary/20 animate-pulse"></div>
            <div className="h-9 w-full sm:w-36 rounded-md bg-label-quaternary/20 animate-pulse"></div>
          </div>
        </div>

        {/* Kanban Board Skeleton */}
        <div className="flex-1 w-full overflow-hidden mt-4">
          <div className="flex flex-col md:flex-row gap-6 md:gap-4 p-0 sm:p-3 h-full">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex w-full md:w-auto min-w-0 md:min-w-[280px] lg:min-w-[320px] flex-1 flex-col rounded-glass p-3 shadow-glass-soft glass-light"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-label-quaternary/20 animate-pulse"></div>
                    <div className="h-6 w-24 rounded-md bg-label-quaternary/20 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-8 rounded-md bg-label-quaternary/20 animate-pulse"></div>
                </div>

                <div className="flex flex-col gap-3 h-full">
                  {[1, 2, 3].map(card => (
                    <div
                      key={card}
                      className="h-[120px] rounded-lg bg-label-quaternary/20 animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
