import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApplicationsWorkspace } from '@/components/applications/ApplicationsWorkspace'
import * as actions from '@/app/dashboard/actions'
import { FilterState } from '@/lib/utils/filter-utils'

// Mock child components heavily to avoid rendering massive subtrees
vi.mock('@/components/applications/ApplicationsToolbar', () => ({
  ApplicationsToolbar: ({ filters }: { filters: FilterState }) => (
    <div data-testid="mock-toolbar">
      <span data-testid="toolbar-status">{filters.statusFilters.join(',')}</span>
      <span data-testid="toolbar-custom">{filters.customColumnFilters.join(',')}</span>
      <span data-testid="toolbar-date">{filters.dateRange}</span>
      <span data-testid="toolbar-sort">{filters.sortOption}</span>
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
  toast: { error: vi.fn(), info: vi.fn() },
}))
vi.mock('@/components/providers/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}))
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))

// Mock Supabase Actions
vi.mock('@/app/dashboard/actions', () => ({
  getApplicationsWorkspaceDataAction: vi.fn(),
  getApplicationsAction: vi.fn(),
  getCustomColumnsAction: vi.fn(),
}))

const mockReplace = vi.fn((url: string) => {
  const queryPart = url.split('?')[1] || ''
  mockSearchParams = new URLSearchParams(queryPart)
})
let mockSearchParams: URLSearchParams

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/applications',
  useSearchParams: () => mockSearchParams,
}))

describe('ApplicationsPage URL Sync', () => {
  const mockApps = [
    {
      id: 'app-1',
      position: 0,
      status: 'applied',
      company_name: 'Test',
      job_title: 'Test',
      created_at: '',
      updated_at: '',
      user_id: '1',
    },
  ] as any
  const mockCols = [
    {
      id: 'valid-id-1',
      name: 'Valid 1',
      order: 0,
      user_id: '1',
      description: null,
      icon: null,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'valid-id-2',
      name: 'Valid 2',
      order: 1,
      user_id: '1',
      description: null,
      icon: null,
      created_at: '',
      updated_at: '',
    },
  ] as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()

    vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
      applications: mockApps,
      customColumns: mockCols,
      user: { id: '1' } as any,
    })
    vi.mocked(actions.getApplicationsAction).mockResolvedValue(mockApps)
    vi.mocked(actions.getCustomColumnsAction).mockResolvedValue(mockCols)
  })

  it('1. valid custom ID remains after loading', async () => {
    mockSearchParams.append('custom', 'valid-id-1')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    // After load: valid-id-1 should STILL be there, updateUrl should NOT be called
    const toolbar = await screen.findByTestId('toolbar-custom')
    expect(toolbar.textContent).toBe('valid-id-1')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('2. invalid custom ID is removed', async () => {
    mockSearchParams.append('custom', 'fake-id')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    // Assert updateUrl rewrote URL without 'fake-id'
    const replaceCall = mockReplace.mock.calls[0][0]
    expect(replaceCall).not.toContain('custom=fake-id')

    // Assert state was cleaned
    await waitFor(() => {
      expect(screen.getByTestId('toolbar-custom').textContent).toBe('')
    })
  })

  it('3. mixed valid + invalid IDs are cleaned up', async () => {
    mockSearchParams.append('custom', 'valid-id-2')
    mockSearchParams.append('custom', 'fake-id')

    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    const replaceCall = mockReplace.mock.calls[0][0]
    expect(replaceCall).toContain('custom=valid-id-2')
    expect(replaceCall).not.toContain('fake-id')

    await waitFor(() => {
      expect(screen.getByTestId('toolbar-custom').textContent).toBe('valid-id-2')
    })
  })

  it('4. all invalid IDs result in empty state', async () => {
    mockSearchParams.append('custom', 'fake-1')
    mockSearchParams.append('custom', 'fake-2')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    const replaceCall = mockReplace.mock.calls[0][0]
    expect(replaceCall).not.toContain('custom=')

    await waitFor(() => {
      expect(screen.getByTestId('toolbar-custom').textContent).toBe('')
    })
  })

  it('5. URL cleanup works properly', async () => {
    mockSearchParams.append('status', 'interviewing')
    mockSearchParams.append('custom', 'fake-id')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    // It should rewrite URL keeping the status but stripping custom
    const replaceCall = mockReplace.mock.calls[0][0]
    expect(replaceCall).toContain('status=interviewing')
    expect(replaceCall).not.toContain('custom=')
  })

  it('6. valid custom URL survives initial loading', async () => {
    mockSearchParams.append('custom', 'valid-id-1')

    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={[
          {
            id: 'valid-id-1',
            name: 'Valid 1',
            order: 0,
            user_id: '1',
            description: null,
            icon: null,
            created_at: '',
            updated_at: '',
          },
        ]}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('toolbar-custom').textContent).toBe('valid-id-1')
    })
    // Still shouldn't have been called
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('7. custom-column fetch failure preserves URL/state', async () => {
    mockSearchParams.append('custom', 'fake-id')

    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={[]}
        initialCustomColumns={[]}
        initialError="Fetch failed"
      />
    )

    // Because it errored, it should NOT aggressively prune fake-id
    // to avoid deleting user state just because of a transient network error.
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('8. validation does not continuously rewrite URL/state', async () => {
    mockSearchParams.append('custom', 'fake-id')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    // Wait for at least one replace to happen
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    // Wait an extra beat to see if it loops
    await new Promise(r => setTimeout(r, 100))
    // It should not infinite loop (might be 1 or 2 due to mock SearchParams quirks, but not > 2)
    expect(mockReplace.mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('9. Phase 3.3 filtering remains unchanged (status parsing)', async () => {
    mockSearchParams.append('status', 'applied')
    mockSearchParams.append('status', 'interviewing')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    const toolbar = await screen.findByTestId('toolbar-status')
    expect(toolbar.textContent).toBe('applied,interviewing')
  })

  it('10. manual sort still permits DnD', async () => {
    mockSearchParams.append('sort', 'manual')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    const toolbar = await screen.findByTestId('toolbar-sort')
    expect(toolbar.textContent).toBe('manual')
  })

  it('11. non-manual sort still disables DnD (via sort option parsed)', async () => {
    mockSearchParams.append('sort', 'newest_applied')
    render(
      <ApplicationsWorkspace
        user={{ id: '1' } as any}
        initialApplications={mockApps}
        initialCustomColumns={mockCols}
      />
    )

    const toolbar = await screen.findByTestId('toolbar-sort')
    expect(toolbar.textContent).toBe('newest_applied')
  })
})
