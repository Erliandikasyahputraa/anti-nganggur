import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ApplicationsWorkspace } from '@/components/applications/ApplicationsWorkspace'
import * as actions from '@/app/dashboard/actions'
import { toast } from 'sonner'
import * as exportUtils from '@/lib/utils/export-utils'
import { filterApplications } from '@/lib/utils/filter-utils'

vi.mock('@/components/applications/ApplicationsToolbar', () => ({
  ApplicationsToolbar: ({ onExport, isExporting }: any) => (
    <div data-testid="mock-toolbar">
      <button data-testid="export-btn" onClick={onExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
    </div>
  ),
}))
vi.mock('@/components/applications/FilterChips', () => ({
  FilterChips: () => <div data-testid="mock-chips" />,
}))
vi.mock('@/components/applications/KanbanBoardV3', () => ({
  KanbanBoardV3: () => <div data-testid="mock-kanban" />,
}))
vi.mock('@/components/applications/NewApplicationModal', () => ({
  NewApplicationModal: () => <div data-testid="mock-new-app-modal" />,
}))
vi.mock('@/components/applications/ManageColumnsModal', () => ({
  ManageColumnsModal: () => <div data-testid="mock-manage-columns-modal" />,
}))
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock('@/components/providers/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}))
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))
vi.mock('@/app/dashboard/actions', () => ({
  getApplicationsWorkspaceDataAction: vi.fn(),
  getApplicationsAction: vi.fn(),
  getCustomColumnsAction: vi.fn(),
}))
vi.mock('@/lib/utils/export-utils', () => ({
  generateApplicationsCSV: vi.fn(),
  generateFilename: vi.fn(),
  triggerDownload: vi.fn(),
}))
vi.mock('@/lib/utils/filter-utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils/filter-utils')>()
  return {
    ...actual,
    filterApplications: vi.fn(),
  }
})

const mockRouter = {
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/applications',
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
  }),
}))

describe('ApplicationsPage Export', () => {
  const mockApplications = [
    {
      id: 'app-1',
      user_id: 'user-123',
      company_name: 'Test Co',
      job_title: 'Engineer',
      status: 'applied',
      date_applied: '2026-01-01',
      position: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(actions.getApplicationsWorkspaceDataAction as Mock).mockResolvedValue({
      applications: mockApplications,
      customColumns: [],
      user: { id: 'user-123' },
    })
    ;(actions.getApplicationsAction as Mock).mockResolvedValue(mockApplications)
    ;(actions.getCustomColumnsAction as Mock).mockResolvedValue([])
    ;(filterApplications as Mock).mockReturnValue(mockApplications)
  })

  it('handles successful export flow', async () => {
    ;(exportUtils.generateApplicationsCSV as Mock).mockReturnValue('csv,content')
    ;(exportUtils.generateFilename as Mock).mockReturnValue('file.csv')

    render(
      <ApplicationsWorkspace
        user={{ id: 'user-123' } as any}
        initialApplications={mockApplications as any}
        initialCustomColumns={[]}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument()
    })

    const exportBtn = screen.getByTestId('export-btn')
    fireEvent.click(exportBtn)

    expect(exportUtils.generateApplicationsCSV).toHaveBeenCalled()
    expect(exportUtils.triggerDownload).toHaveBeenCalledWith('csv,content', 'file.csv')
    expect(toast.success).toHaveBeenCalledWith('Applications exported')
  })

  it('handles empty dataset by showing error toast and not downloading', async () => {
    ;(filterApplications as Mock).mockReturnValue([]) // empty after filtering

    render(
      <ApplicationsWorkspace
        user={{ id: 'user-123' } as any}
        initialApplications={mockApplications as any}
        initialCustomColumns={[]}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument()
    })

    const exportBtn = screen.getByTestId('export-btn')
    fireEvent.click(exportBtn)

    expect(exportUtils.generateApplicationsCSV).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Couldn't export applications. Please try again.")
  })

  it('handles export failure safely', async () => {
    ;(exportUtils.generateApplicationsCSV as Mock).mockImplementation(() => {
      throw new Error('Export failed')
    })

    render(
      <ApplicationsWorkspace
        user={{ id: 'user-123' } as any}
        initialApplications={mockApplications as any}
        initialCustomColumns={[]}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument()
    })

    const exportBtn = screen.getByTestId('export-btn')
    fireEvent.click(exportBtn)

    expect(exportUtils.generateApplicationsCSV).toHaveBeenCalled()
    expect(exportUtils.triggerDownload).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Couldn't export applications. Please try again.")
  })
})
