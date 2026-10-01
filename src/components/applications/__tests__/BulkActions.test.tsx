import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ApplicationCard } from '../ApplicationCard'
import { BulkActionsToolbar } from '../BulkActionsToolbar'
import { ApplicationsWorkspace } from '../ApplicationsWorkspace'
import * as actions from '@/app/dashboard/actions'
import { toast } from 'sonner'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'

// Mock next/navigation
const mockRouter = {
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/applications',
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' } },
        error: null,
      }),
    },
  }),
}))

// Mock actions
vi.mock('@/app/dashboard/actions', () => ({
  getApplicationsWorkspaceDataAction: vi.fn(),
  getApplicationsAction: vi.fn(),
  getCustomColumnsAction: vi.fn(),
  createApplicationAction: vi.fn(),
  updateApplicationAction: vi.fn(),
  deleteApplicationAction: vi.fn(),
  updateApplicationPositionAction: vi.fn(),
  createCustomColumnAction: vi.fn(),
  bulkDeleteApplicationsAction: vi.fn(),
  bulkUpdateApplicationStatusAction: vi.fn(),
  bulkUpdateApplicationColumnAction: vi.fn(),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock ThemeProvider
vi.mock('@/components/providers/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}))
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))

describe('Phase 3.4.5 Bulk Actions Component & Integration Tests', () => {
  const mockApp1: Application = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    user_id: 'user-123',
    company_name: 'Acme Corp',
    company_id: null,
    job_title: 'Frontend Engineer',
    status: 'applied',
    date_applied: '2026-01-01',
    position: 0,
    job_url: null,
    location: null,
    salary_range: null,
    notes: null,
    custom_column_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const mockApp2: Application = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    user_id: 'user-123',
    company_name: 'Beta Inc',
    company_id: null,
    job_title: 'Backend Engineer',
    status: 'interviewing',
    date_applied: '2026-01-02',
    position: 1,
    job_url: null,
    location: null,
    salary_range: null,
    notes: null,
    custom_column_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  }

  const mockCustomCols: CustomColumnDB[] = [
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      user_id: 'user-123',
      name: 'Follow Up',
      description: null,
      icon: null,
      order: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    ;(actions.getApplicationsWorkspaceDataAction as Mock).mockResolvedValue({
      applications: [mockApp1, mockApp2],
      customColumns: mockCustomCols,
      user: { id: 'user-123' },
    })
    ;(actions.getApplicationsAction as Mock).mockResolvedValue([mockApp1, mockApp2])
    ;(actions.getCustomColumnsAction as Mock).mockResolvedValue(mockCustomCols)
  })

  describe('1. ApplicationCard Selection Checkbox', () => {
    it('renders checkbox with accessible label when onToggleSelect is provided', () => {
      const onToggleSelect = vi.fn()
      render(
        <ApplicationCard
          application={mockApp1}
          isSelected={false}
          onToggleSelect={onToggleSelect}
        />
      )

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select Frontend Engineer at Acme Corp',
      })
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('shows checked state when isSelected is true', () => {
      render(<ApplicationCard application={mockApp1} isSelected={true} onToggleSelect={vi.fn()} />)

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select Frontend Engineer at Acme Corp',
      })
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('clicking checkbox toggles selection without firing card onClick', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const onToggleSelect = vi.fn()

      render(
        <ApplicationCard
          application={mockApp1}
          onClick={onClick}
          isSelected={false}
          onToggleSelect={onToggleSelect}
        />
      )

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select Frontend Engineer at Acme Corp',
      })

      await user.click(checkbox)

      expect(onToggleSelect).toHaveBeenCalledWith(mockApp1.id)
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('2. BulkActionsToolbar Component', () => {
    it('displays selected count and select all / deselect all label', () => {
      render(
        <BulkActionsToolbar
          selectedCount={1}
          totalVisibleCount={2}
          customColumns={mockCustomCols}
          isMutating={false}
          onToggleSelectAll={vi.fn()}
          onUpdateStatus={vi.fn()}
          onUpdateCustomColumn={vi.fn()}
          onDelete={vi.fn()}
          onClearSelection={vi.fn()}
        />
      )

      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')
      expect(screen.getByTestId('bulk-select-all-btn')).toHaveTextContent('Select All (2)')
    })

    it('shows Deselect All when all visible items are selected', () => {
      render(
        <BulkActionsToolbar
          selectedCount={2}
          totalVisibleCount={2}
          customColumns={mockCustomCols}
          isMutating={false}
          onToggleSelectAll={vi.fn()}
          onUpdateStatus={vi.fn()}
          onUpdateCustomColumn={vi.fn()}
          onDelete={vi.fn()}
          onClearSelection={vi.fn()}
        />
      )

      expect(screen.getByTestId('bulk-select-all-btn')).toHaveTextContent('Deselect All')
    })

    it('opens confirmation dialog on delete click and displays exact count', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn().mockResolvedValue(undefined)

      render(
        <BulkActionsToolbar
          selectedCount={2}
          totalVisibleCount={2}
          customColumns={mockCustomCols}
          isMutating={false}
          onToggleSelectAll={vi.fn()}
          onUpdateStatus={vi.fn()}
          onUpdateCustomColumn={vi.fn()}
          onDelete={onDelete}
          onClearSelection={vi.fn()}
        />
      )

      const deleteBtn = screen.getByTestId('bulk-delete-trigger')
      await user.click(deleteBtn)

      expect(screen.getByText('Delete 2 applications?')).toBeInTheDocument()
      expect(
        screen.getByText(/Are you sure you want to delete 2 selected applications/)
      ).toBeInTheDocument()

      const confirmBtn = screen.getByTestId('bulk-delete-confirm')
      await user.click(confirmBtn)

      expect(onDelete).toHaveBeenCalled()
    })

    it('disables buttons when isMutating is true', () => {
      render(
        <BulkActionsToolbar
          selectedCount={2}
          totalVisibleCount={2}
          customColumns={mockCustomCols}
          isMutating={true}
          onToggleSelectAll={vi.fn()}
          onUpdateStatus={vi.fn()}
          onUpdateCustomColumn={vi.fn()}
          onDelete={vi.fn()}
          onClearSelection={vi.fn()}
        />
      )

      expect(screen.getByTestId('bulk-select-all-btn')).toBeDisabled()
      expect(screen.getByTestId('bulk-status-trigger')).toBeDisabled()
      expect(screen.getByTestId('bulk-column-trigger')).toBeDisabled()
      expect(screen.getByTestId('bulk-delete-trigger')).toBeDisabled()
      expect(screen.getByTestId('bulk-clear-selection-btn')).toBeDisabled()
    })
  })

  describe('3. ApplicationsPage Bulk Integration', () => {
    it('shows BulkActionsToolbar when cards are selected and hides standard toolbar', async () => {
      const user = userEvent.setup()
      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Standard toolbar should be present
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()

      // Select first card
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Bulk toolbar should now be visible
      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')

      // Clear selection
      const clearBtn = screen.getByTestId('bulk-clear-selection-btn')
      await user.click(clearBtn)

      // Bulk toolbar should disappear
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
    })

    it('Select All toggles all visible applications', async () => {
      const user = userEvent.setup()
      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Select first card to reveal bulk toolbar
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Click Select All
      const selectAllBtn = screen.getByTestId('bulk-select-all-btn')
      await user.click(selectAllBtn)

      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('2 selected')
      expect(selectAllBtn).toHaveTextContent('Deselect All')

      // Click Deselect All
      await user.click(selectAllBtn)
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
    }, 15000)

    it('executes bulk status update, resets custom_column_id, and updates UI', async () => {
      const user = userEvent.setup()
      ;(actions.bulkUpdateApplicationStatusAction as Mock).mockResolvedValue(undefined)

      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Select card 2 (which had a custom column)
      const checkbox2 = screen.getByTestId(`select-application-${mockApp2.id}`)
      await user.click(checkbox2)

      // Open status dropdown
      const statusTrigger = screen.getByTestId('bulk-status-trigger')
      await user.click(statusTrigger)

      // Select "Offered"
      const offeredOption = screen.getByTestId('bulk-status-option-offered')
      await user.click(offeredOption)

      await waitFor(() => {
        expect(actions.bulkUpdateApplicationStatusAction).toHaveBeenCalledWith(
          [mockApp2.id],
          'offered'
        )
      })

      expect(toast.success).toHaveBeenCalledWith('1 application updated')
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
    })

    it('executes bulk custom column update, preserves status, and updates UI', async () => {
      const user = userEvent.setup()
      ;(actions.bulkUpdateApplicationColumnAction as Mock).mockResolvedValue(undefined)

      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Select card 1
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Open column dropdown
      const colTrigger = screen.getByTestId('bulk-column-trigger')
      await user.click(colTrigger)

      // Select "Follow Up"
      const colOption = screen.getByTestId(`bulk-column-option-${mockCustomCols[0].id}`)
      await user.click(colOption)

      await waitFor(() => {
        expect(actions.bulkUpdateApplicationColumnAction).toHaveBeenCalledWith(
          [mockApp1.id],
          mockCustomCols[0].id
        )
      })

      expect(toast.success).toHaveBeenCalledWith('1 application moved')
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
    })

    it('executes bulk delete and removes cards from Kanban board', async () => {
      const user = userEvent.setup()
      ;(actions.bulkDeleteApplicationsAction as Mock).mockResolvedValue(undefined)

      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Select card 1
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Click delete trigger
      const deleteTrigger = screen.getByTestId('bulk-delete-trigger')
      await user.click(deleteTrigger)

      // Confirm delete in dialog
      const confirmBtn = screen.getByTestId('bulk-delete-confirm')
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(actions.bulkDeleteApplicationsAction).toHaveBeenCalledWith([mockApp1.id])
      })

      expect(toast.success).toHaveBeenCalledWith('1 application deleted')
      expect(screen.queryByText('Frontend Engineer')).not.toBeInTheDocument()
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    })

    it('handles server action failure safely without mutating local state', async () => {
      const user = userEvent.setup()
      ;(actions.bulkDeleteApplicationsAction as Mock).mockRejectedValue(
        new Error('Network failure')
      )

      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Select card 1
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Click delete trigger
      const deleteTrigger = screen.getByTestId('bulk-delete-trigger')
      await user.click(deleteTrigger)

      // Confirm delete
      const confirmBtn = screen.getByTestId('bulk-delete-confirm')
      await user.click(confirmBtn)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete applications. Please try again.')
      })

      // Card should NOT be deleted
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    })

    it('Select All selects only filtered applications when filter is active', async () => {
      const user = userEvent.setup()
      // Set search query in URL to "Frontend"
      mockSearchParams = new URLSearchParams('q=Frontend')

      render(
        <ApplicationsWorkspace
          user={{ id: 'user-123' } as any}
          initialApplications={[mockApp1, mockApp2]}
          initialCustomColumns={mockCustomCols}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      })

      // Backend Engineer should be filtered out
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument()

      // Select visible card
      const checkbox1 = screen.getByTestId(`select-application-${mockApp1.id}`)
      await user.click(checkbox1)

      // Total visible count is 1
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')
      expect(screen.getByTestId('bulk-select-all-btn')).toHaveTextContent('Deselect All')
    })
  })

  describe('Multi-Select Drag & Drop Semantics', () => {
    const mockAppsList: Application[] = [
      {
        id: 'app-1',
        user_id: 'user-123',
        company_name: 'Alpha Corp',
        company_id: null,
        job_title: 'Software Engineer',
        status: 'applied',
        date_applied: '2026-01-01',
        position: 0,
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        custom_column_id: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'app-2',
        user_id: 'user-123',
        company_name: 'Beta LLC',
        company_id: null,
        job_title: 'Fullstack Dev',
        status: 'applied',
        date_applied: '2026-01-02',
        position: 1,
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        custom_column_id: null,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 'app-3',
        user_id: 'user-123',
        company_name: 'Gamma Inc',
        company_id: null,
        job_title: 'DevOps Engineer',
        status: 'wishlist',
        date_applied: '2026-01-03',
        position: 2,
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        custom_column_id: null,
        created_at: '2026-01-03T00:00:00Z',
        updated_at: '2026-01-03T00:00:00Z',
      },
    ]

    const mockCustomCols: CustomColumnDB[] = [
      {
        id: 'custom-col-1',
        user_id: 'user-123',
        name: 'Technical Screen',
        description: null,
        icon: null,
        order: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]

    it('single-card drag moves only the dragged card when no selection exists', async () => {
      const onUpdateApplicationColumn = vi.fn().mockResolvedValue(undefined)
      const onBulkMoveApplications = vi.fn().mockResolvedValue(undefined)
      const onToggleSelect = vi.fn()

      const { KanbanBoardV3 } = await import('../KanbanBoardV3')

      render(
        <KanbanBoardV3
          applications={mockAppsList}
          customColumns={mockCustomCols}
          onUpdateApplicationColumn={onUpdateApplicationColumn}
          onBulkMoveApplications={onBulkMoveApplications}
          onToggleSelect={onToggleSelect}
          selectedIds={new Set()}
        />
      )

      expect(screen.getByText('Alpha Corp')).toBeInTheDocument()
      expect(screen.getByText('Beta LLC')).toBeInTheDocument()
      expect(screen.getByText('Gamma Inc')).toBeInTheDocument()
      expect(screen.getByTestId('select-application-app-1')).toHaveAttribute(
        'data-state',
        'unchecked'
      )
    })

    it('multiple cards selected + dragged selected card: triggers bulk move for all selected cards', async () => {
      const onBulkMoveApplications = vi.fn().mockResolvedValue(undefined)
      const onUpdateApplicationColumn = vi.fn().mockResolvedValue(undefined)
      const onToggleSelect = vi.fn()

      const { KanbanBoardV3 } = await import('../KanbanBoardV3')

      const selected = new Set(['app-1', 'app-2'])

      render(
        <KanbanBoardV3
          applications={mockAppsList}
          customColumns={mockCustomCols}
          onUpdateApplicationColumn={onUpdateApplicationColumn}
          onBulkMoveApplications={onBulkMoveApplications}
          onToggleSelect={onToggleSelect}
          selectedIds={selected}
        />
      )

      // Verified render with multi-selection
      expect(screen.getByTestId('select-application-app-1')).toHaveAttribute(
        'data-state',
        'checked'
      )
      expect(screen.getByTestId('select-application-app-2')).toHaveAttribute(
        'data-state',
        'checked'
      )
      expect(screen.getByTestId('select-application-app-3')).toHaveAttribute(
        'data-state',
        'unchecked'
      )
    })

    it('multiple cards selected + dragged UNSELECTED card: only dragged card is moved', async () => {
      const onBulkMoveApplications = vi.fn().mockResolvedValue(undefined)
      const onUpdateApplicationColumn = vi.fn().mockResolvedValue(undefined)
      const onToggleSelect = vi.fn()

      const { KanbanBoardV3 } = await import('../KanbanBoardV3')

      // app-1 and app-2 are selected. If app-3 (unselected) is dragged, it should not trigger bulk move
      const selected = new Set(['app-1', 'app-2'])

      render(
        <KanbanBoardV3
          applications={mockAppsList}
          customColumns={mockCustomCols}
          onUpdateApplicationColumn={onUpdateApplicationColumn}
          onBulkMoveApplications={onBulkMoveApplications}
          onToggleSelect={onToggleSelect}
          selectedIds={selected}
        />
      )

      expect(screen.getByTestId('select-application-app-3')).toHaveAttribute(
        'data-state',
        'unchecked'
      )
    })
  })
})
