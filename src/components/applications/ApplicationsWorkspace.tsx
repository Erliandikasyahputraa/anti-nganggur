'use client'

import * as React from 'react'
import { Plus, Rocket, Lightbulb } from 'lucide-react'
import { KanbanBoardV3 } from '@/components/applications/KanbanBoardV3'
import ApplicationForm from '@/components/applications/ApplicationForm'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { ApplicationsToolbar } from '@/components/applications/ApplicationsToolbar'
import { BulkActionsToolbar } from '@/components/applications/BulkActionsToolbar'
import { FilterChips } from '@/components/applications/FilterChips'
import { ColumnManageModal } from '@/components/applications/ColumnManageModal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Application, ApplicationStatus, CustomColumnDB } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { User } from '@supabase/supabase-js'
import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  updateApplicationPositionAction,
  createCustomColumnAction,
  bulkDeleteApplicationsAction,
  bulkUpdateApplicationStatusAction,
  bulkUpdateApplicationColumnAction,
} from '@/app/dashboard/actions'
import { columnStorage } from '@/lib/storage/column-storage'
import {
  filterApplications,
  type FilterState,
  type SortOption,
  type DateFilterOption,
  isValidStatus,
  isValidSortOption,
  isValidDateOption,
} from '@/lib/utils/filter-utils'
import {
  generateApplicationsCSV,
  generateFilename,
  triggerDownload,
} from '@/lib/utils/export-utils'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export interface ApplicationsWorkspaceProps {
  user: User
  initialApplications: Application[]
  initialCustomColumns: CustomColumnDB[]
  initialError?: string | null
}

export function ApplicationsWorkspace({
  user: _user,
  initialApplications,
  initialCustomColumns,
  initialError = null,
}: ApplicationsWorkspaceProps) {
  const [applications, setApplications] = React.useState<Application[]>(initialApplications)
  const [customColumns, setCustomColumns] = React.useState<CustomColumnDB[]>(initialCustomColumns)
  const [error] = React.useState<string | null>(initialError)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Sync state if initial server props update (e.g. server revalidation)
  React.useEffect(() => {
    setApplications(initialApplications)
  }, [initialApplications])

  React.useEffect(() => {
    setCustomColumns(initialCustomColumns)
  }, [initialCustomColumns])

  // Filter State initialized from URL
  const [filters, setFilters] = React.useState<FilterState>(() => {
    const statusFilters = searchParams.getAll('status').filter(isValidStatus)
    const customColumnFilters = searchParams.getAll('custom')

    const dateParam = searchParams.get('date')
    const dateRange = dateParam && isValidDateOption(dateParam) ? dateParam : 'all'

    const sortParam = searchParams.get('sort')
    const sortOption = sortParam && isValidSortOption(sortParam) ? sortParam : 'manual'

    const searchQuery = searchParams.get('q') || ''

    return {
      searchQuery,
      statusFilters,
      customColumnFilters,
      dateRange,
      sortOption,
    }
  })

  // Separate state for instant typing, debounced into `filters.searchQuery`
  const [searchInput, setSearchInput] = React.useState(filters.searchQuery)

  // displayFilters merges the debounced state with the instant search input for the UI toolbar
  const displayFilters = React.useMemo(
    () => ({ ...filters, searchQuery: searchInput }),
    [filters, searchInput]
  )

  const updateUrl = React.useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams()

      if (newFilters.searchQuery.trim()) {
        params.set('q', newFilters.searchQuery.trim())
      }

      newFilters.statusFilters.forEach(status => params.append('status', status))
      newFilters.customColumnFilters.forEach(custom => params.append('custom', custom))

      if (newFilters.dateRange !== 'all') {
        params.set('date', newFilters.dateRange)
      }

      if (newFilters.sortOption !== 'manual') {
        params.set('sort', newFilters.sortOption)
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  // Sync state to URL if it differs from URL (e.g., Browser Back/Forward)
  React.useEffect(() => {
    const urlStatuses = searchParams.getAll('status').filter(isValidStatus)
    const urlCustoms = searchParams.getAll('custom')
    const urlDateRaw = searchParams.get('date')
    const urlDate = urlDateRaw && isValidDateOption(urlDateRaw) ? urlDateRaw : 'all'
    const urlSortRaw = searchParams.get('sort')
    const urlSort = urlSortRaw && isValidSortOption(urlSortRaw) ? urlSortRaw : 'manual'
    const urlQuery = searchParams.get('q') || ''

    const isDifferent =
      urlQuery !== filters.searchQuery ||
      urlDate !== filters.dateRange ||
      urlSort !== filters.sortOption ||
      urlStatuses.join(',') !== filters.statusFilters.join(',') ||
      urlCustoms.join(',') !== filters.customColumnFilters.join(',')

    if (isDifferent) {
      const nextFilters: FilterState = {
        searchQuery: urlQuery,
        statusFilters: urlStatuses,
        customColumnFilters: urlCustoms,
        dateRange: urlDate,
        sortOption: urlSort,
      }
      setFilters(nextFilters)
      setSearchInput(urlQuery)
    }
  }, [searchParams, filters])

  // Validate custom column filters after initial load
  const currentCustomFilters = filters.customColumnFilters
  React.useEffect(() => {
    if (error) return

    const validIds = new Set(customColumns.map(c => c.id))
    validIds.add('none')

    const hasInvalid = currentCustomFilters.some(id => !validIds.has(id))

    if (hasInvalid) {
      const validFilters = currentCustomFilters.filter(id => validIds.has(id))
      setFilters(prev => {
        const nextFilters = { ...prev, customColumnFilters: validFilters }
        // Update the URL to remove the invalid parameters silently
        updateUrl(nextFilters)
        return nextFilters
      })
    }
  }, [error, customColumns, currentCustomFilters, updateUrl])

  // Effect for debouncing search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.searchQuery !== searchInput) {
        const nextFilters = { ...filters, searchQuery: searchInput }
        setFilters(nextFilters)
        updateUrl(nextFilters)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, updateUrl])

  // Modal states
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = React.useState(false)
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)

  // Selection & Bulk mutation state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isBulkMutating, setIsBulkMutating] = React.useState(false)

  // Clear selection when filters change
  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [filters])

  // Operation loading states
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Handle LocalStorage Migration if initial custom columns is empty
  React.useEffect(() => {
    if (initialCustomColumns.length === 0) {
      const localData = columnStorage.getColumns().filter(col => col.isCustom)
      if (localData.length > 0) {
        async function migrateLocal() {
          try {
            const migrationPromises = localData.map(col =>
              createCustomColumnAction({
                name: col.name,
                description: col.description || null,
                icon: col.icon || null,
                order: col.order,
              })
            )
            const migratedCols = await Promise.all(migrationPromises)
            setCustomColumns(migratedCols)
            if (typeof window !== 'undefined') {
              localStorage.removeItem('kanban-columns')
            }
          } catch (migrationError) {
            console.error('Failed to migrate local columns:', migrationError)
          }
        }
        migrateLocal()
      }
    }
  }, [initialCustomColumns])

  const processedApplications = React.useMemo(() => {
    // 1. Filter
    const filtered = filterApplications(applications, filters)
    // 2. Sorting is handled INSIDE KanbanBoardV3 because it needs to sort WITHIN groups.
    return filtered
  }, [applications, filters])

  // Handlers for Filters
  const handleSearchChange = (query: string) => {
    setSearchInput(query)
  }

  const handleStatusFilterChange = (status: ApplicationStatus) => {
    const newStatusFilters = filters.statusFilters.includes(status)
      ? filters.statusFilters.filter(s => s !== status)
      : [...filters.statusFilters, status]
    const nextFilters = { ...filters, statusFilters: newStatusFilters }
    setFilters(nextFilters)
    updateUrl(nextFilters)
  }

  const handleCustomColumnFilterChange = (colId: string) => {
    const newCustomFilters = filters.customColumnFilters.includes(colId)
      ? filters.customColumnFilters.filter(c => c !== colId)
      : [...filters.customColumnFilters, colId]
    const nextFilters = { ...filters, customColumnFilters: newCustomFilters }
    setFilters(nextFilters)
    updateUrl(nextFilters)
  }

  const handleDateRangeChange = (range: DateFilterOption) => {
    const nextFilters = { ...filters, dateRange: range }
    setFilters(nextFilters)
    updateUrl(nextFilters)
  }

  const handleSortChange = (sort: SortOption) => {
    const nextFilters = { ...filters, sortOption: sort }
    setFilters(nextFilters)
    updateUrl(nextFilters)
    if (sort !== 'manual') {
      toast.info('Drag and drop is disabled while custom sorting is active')
    }
  }

  const handleClearFilters = () => {
    const nextFilters: FilterState = {
      ...filters,
      statusFilters: [],
      customColumnFilters: [],
      dateRange: 'all',
      searchQuery: '',
    }
    setFilters(nextFilters)
    setSearchInput('')
    updateUrl(nextFilters)
  }

  // Handle create application
  const handleCreateApplication = async (formData: ApplicationFormData) => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const newApplication = await createApplicationAction(formData)
      setApplications(prev => [newApplication, ...prev])
      setIsNewApplicationModalOpen(false)
      toast.success('Application added')
    } catch (err) {
      console.error('Failed to create application:', err)
      setCreateError("Couldn't save changes. Please try again.")
      toast.error("Couldn't save changes. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  // Handle update application
  const handleUpdateApplication = async (id: string, formData: ApplicationFormData) => {
    try {
      const updatedApplication = await updateApplicationAction(id, formData)
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to update application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle delete application
  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteApplicationAction(id)
      setApplications(prev => prev.filter(app => app.id !== id))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to delete application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle update application status (drag-and-drop)
  const handleUpdateApplicationColumn = async (
    id: string,
    position: number,
    newStatus?: Application['status'],
    customColumnId?: string | null
  ) => {
    try {
      const updatedApplication = await updateApplicationPositionAction(
        id,
        position,
        newStatus,
        customColumnId
      )
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
    } catch (err) {
      console.error('Failed to update application column:', err)
      throw err // Re-throw to let KanbanBoard handle the error
    }
  }

  // Handle custom column changes
  const handleCustomColumnsChange = (newColumns: CustomColumnDB[]) => {
    setCustomColumns(newColumns)
  }

  // Handle application card click
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application)
  }

  // Handle close detail modal
  const handleCloseDetail = () => {
    setSelectedApplication(null)
  }

  // Handle open new application modal
  const handleOpenNewModal = () => {
    setCreateError(null)
    setIsNewApplicationModalOpen(true)
  }

  // Handle close new application modal
  const handleCloseNewModal = () => {
    setIsNewApplicationModalOpen(false)
    setCreateError(null)
  }

  // Selection Handlers
  const handleToggleSelect = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleSelectAll = React.useCallback(() => {
    if (processedApplications.length === 0) return
    const allVisibleIds = processedApplications.map(a => a.id)
    const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id))

    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allVisibleIds))
    }
  }, [processedApplications, selectedIds])

  const handleClearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk Action Handlers
  const handleBulkUpdateStatus = async (status: ApplicationStatus) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsBulkMutating(true)
    try {
      await bulkUpdateApplicationStatusAction(ids, status)
      const idsSet = new Set(ids)
      setApplications(prev =>
        prev.map(app =>
          idsSet.has(app.id)
            ? { ...app, status, custom_column_id: null, updated_at: new Date().toISOString() }
            : app
        )
      )
      setSelectedIds(new Set())
      toast.success(`${ids.length} application${ids.length === 1 ? '' : 's'} updated`)
    } catch (err) {
      console.error('Failed to bulk update status:', err)
      toast.error('Failed to update applications. Please try again.')
    } finally {
      setIsBulkMutating(false)
    }
  }

  const handleBulkUpdateCustomColumn = async (customColumnId: string | null) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsBulkMutating(true)
    try {
      await bulkUpdateApplicationColumnAction(ids, customColumnId)
      const idsSet = new Set(ids)
      setApplications(prev =>
        prev.map(app =>
          idsSet.has(app.id)
            ? { ...app, custom_column_id: customColumnId, updated_at: new Date().toISOString() }
            : app
        )
      )
      setSelectedIds(new Set())
      toast.success(`${ids.length} application${ids.length === 1 ? '' : 's'} moved`)
    } catch (err) {
      console.error('Failed to bulk update custom column:', err)
      toast.error('Failed to move applications. Please try again.')
    } finally {
      setIsBulkMutating(false)
    }
  }

  const handleBulkMoveApplications = async (
    ids: string[],
    targetColumn: { id: string; name: string; isCustom?: boolean; statuses?: ApplicationStatus[] }
  ) => {
    setIsBulkMutating(true)
    try {
      if (targetColumn.isCustom) {
        await bulkUpdateApplicationColumnAction(ids, targetColumn.id)
        const idsSet = new Set(ids)
        setApplications(prev =>
          prev.map(app =>
            idsSet.has(app.id)
              ? { ...app, custom_column_id: targetColumn.id, updated_at: new Date().toISOString() }
              : app
          )
        )
      } else {
        const newStatus = targetColumn.statuses ? targetColumn.statuses[0] : 'applied'
        await bulkUpdateApplicationStatusAction(ids, newStatus)
        const idsSet = new Set(ids)
        setApplications(prev =>
          prev.map(app =>
            idsSet.has(app.id)
              ? {
                  ...app,
                  status: newStatus,
                  custom_column_id: null,
                  updated_at: new Date().toISOString(),
                }
              : app
          )
        )
      }
    } catch (err) {
      console.error('Failed to bulk move applications:', err)
      throw err
    } finally {
      setIsBulkMutating(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsBulkMutating(true)
    try {
      await bulkDeleteApplicationsAction(ids)
      const deletedSet = new Set(ids)
      setApplications(prev => prev.filter(app => !deletedSet.has(app.id)))
      setSelectedIds(new Set())
      toast.success(`${ids.length} application${ids.length === 1 ? '' : 's'} deleted`)
    } catch (err) {
      console.error('Failed to bulk delete applications:', err)
      toast.error('Failed to delete applications. Please try again.')
      throw err
    } finally {
      setIsBulkMutating(false)
    }
  }

  // Handle export
  const handleExport = () => {
    if (processedApplications.length === 0) {
      toast.error("Couldn't export applications. Please try again.")
      return
    }

    setIsExporting(true)
    try {
      const csvContent = generateApplicationsCSV(processedApplications, customColumns)
      const filename = generateFilename()
      triggerDownload(csvContent, filename)
      toast.success('Applications exported')
    } catch (err) {
      console.error('Failed to export CSV:', err)
      toast.error("Couldn't export applications. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  if (error) {
    return (
      <div className="w-full flex-1 px-4 flex flex-col">
        <div className="flex flex-1 items-center justify-center p-8 glass-light rounded-glass shadow-glass-soft">
          <div className="text-center">
            <p
              className="text-label-primary font-medium mb-4"
              style={{ color: 'var(--color-error)' }}
            >
              {error}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4 btn-glass">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isDatabaseEmpty = applications.length === 0
  const isFilterEmpty = !isDatabaseEmpty && processedApplications.length === 0

  return (
    <div className="w-full flex-1 px-4 flex flex-col" data-testid="applications-workspace">
      {isDatabaseEmpty && !isNewApplicationModalOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md text-center space-y-6 glass-ultra rounded-glass-lg p-8 shadow-glass-soft">
            <div className="flex justify-center">
              <Rocket className="h-24 w-24" style={{ color: 'var(--tint-blue)' }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-label-primary">
                Start Your Job Hunt Journey
              </h2>
              <p className="text-label-secondary text-lg">
                Track applications, ace interviews, land your dream job
              </p>
            </div>

            <Button
              onClick={handleOpenNewModal}
              size="lg"
              className="w-full sm:w-auto btn-glass font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Application
            </Button>

            <div
              className="glass-medium rounded-glass-sm p-4 shadow-glass-subtle"
              style={{ border: '1px solid var(--glass-border-medium)' }}
            >
              <p className="text-sm text-label-primary flex items-center gap-2">
                <Lightbulb className="h-4 w-4" style={{ color: 'var(--tint-yellow)' }} />
                <span>Tip: Start by adding jobs you&apos;re interested in to your wishlist</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          {selectedIds.size > 0 ? (
            <div className="p-4 pb-0">
              <BulkActionsToolbar
                selectedCount={selectedIds.size}
                totalVisibleCount={processedApplications.length}
                customColumns={customColumns}
                isMutating={isBulkMutating}
                onToggleSelectAll={handleToggleSelectAll}
                onUpdateStatus={handleBulkUpdateStatus}
                onUpdateCustomColumn={handleBulkUpdateCustomColumn}
                onDelete={handleBulkDelete}
                onClearSelection={handleClearSelection}
              />
            </div>
          ) : (
            <ApplicationsToolbar
              filters={displayFilters}
              onSearchChange={handleSearchChange}
              onStatusFilterChange={handleStatusFilterChange}
              onCustomColumnFilterChange={handleCustomColumnFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
              customColumns={customColumns}
              onManageColumns={() => setIsManageColumnsModalOpen(true)}
              onNewApplication={handleOpenNewModal}
              onExport={handleExport}
              isExporting={isExporting}
            />
          )}

          <FilterChips
            filters={displayFilters}
            onRemoveStatus={handleStatusFilterChange}
            onRemoveCustomColumn={handleCustomColumnFilterChange}
            onClearDate={() => handleDateRangeChange('all')}
            onClearAll={handleClearFilters}
            customColumns={customColumns}
          />

          {isFilterEmpty ? (
            <div className="flex flex-1 items-center justify-center p-8 mt-4">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-medium text-label-primary">
                  No applications match your filters
                </h3>
                <p className="text-label-secondary">Try adjusting your search or active filters.</p>
                <Button onClick={handleClearFilters} variant="outline" className="glass-light">
                  Clear all filters
                </Button>
              </div>
            </div>
          ) : (
            <KanbanBoardV3
              applications={processedApplications}
              customColumns={customColumns}
              onUpdateApplicationColumn={handleUpdateApplicationColumn}
              onBulkMoveApplications={handleBulkMoveApplications}
              onApplicationClick={handleApplicationClick}
              isLoading={false}
              sortOption={filters.sortOption}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              isMutating={isBulkMutating}
            />
          )}
        </div>
      )}

      {/* New Application Modal */}
      <Dialog open={isNewApplicationModalOpen} onOpenChange={handleCloseNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:max-h-[92vh] max-sm:p-5">
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Fill in the details of your job application below.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
              {createError}
            </div>
          )}

          <ApplicationForm
            onSubmit={handleCreateApplication}
            onCancel={handleCloseNewModal}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Application Detail Sheet */}
      {selectedApplication && (
        <ApplicationDetail
          application={selectedApplication}
          customColumns={customColumns}
          onUpdate={handleUpdateApplication}
          onDelete={handleDeleteApplication}
          onClose={handleCloseDetail}
          isOpen={true}
        />
      )}

      {/* Column Manage Modal */}
      <ColumnManageModal
        isOpen={isManageColumnsModalOpen}
        onClose={() => setIsManageColumnsModalOpen(false)}
        customColumns={customColumns}
        onCustomColumnsChange={handleCustomColumnsChange}
      />
    </div>
  )
}
