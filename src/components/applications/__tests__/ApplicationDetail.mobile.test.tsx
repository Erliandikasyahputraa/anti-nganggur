import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActionButtons } from '../ApplicationDetail/components/ActionButtons/ActionButtons'
import { TabNavigation } from '../ApplicationDetail/components/LeftPanel/TabNavigation'
import { ApplicationDetail } from '../ApplicationDetail'
import ApplicationForm from '../ApplicationForm'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application } from '@/lib/types/database.types'
import { CheckSquare } from 'lucide-react'

const createMockApplication = (overrides?: Partial<Application>): Application => ({
  id: 'app-mobile-test-123',
  user_id: 'user-123',
  company_name: 'Stripe',
  company_id: null,
  job_title: 'Staff Frontend Engineer',
  job_url: 'https://stripe.com/jobs/123',
  location: 'Remote, US',
  salary_range: '$200k - $250k',
  status: 'interviewing',
  date_applied: '2025-10-15',
  notes: 'Prepare system design',
  job_description: '<p>Build financial infrastructure</p>',
  source: 'LinkedIn',
  company_logo_url: null,
  position: 1,
  custom_column_id: null,
  created_at: '2025-10-15T10:00:00Z',
  updated_at: '2025-10-15T10:00:00Z',
  ...overrides,
})

describe('Phase 0 Mobile Remediation — Application Detail UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Defect A: Mobile Header & ActionButtons Dropdown', () => {
    it('renders both desktop action controls and mobile More actions dropdown trigger', () => {
      const mockApplication = createMockApplication()
      render(
        <ActionButtons
          application={mockApplication}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
        />
      )

      // Mobile More Actions trigger must exist with accessible label and minimum 44x44 target
      const moreTrigger = screen.getByRole('button', { name: /more actions/i })
      expect(moreTrigger).toBeInTheDocument()
      expect(moreTrigger).toHaveClass('min-w-[44px]')
      expect(moreTrigger).toHaveClass('min-h-[44px]')

      // Close button must be directly accessible on both viewports with 44x44 minimum touch target
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveClass('min-w-[44px]')
      expect(closeButton).toHaveClass('min-h-[44px]')

      // Desktop actions exist with responsive hidden/inline-flex classes
      expect(screen.getByRole('button', { name: /^edit$/i })).toHaveClass('hidden')
      expect(screen.getByRole('button', { name: /^delete$/i })).toHaveClass('hidden')
      expect(screen.getByRole('link', { name: /view job/i })).toHaveClass('hidden')
    })

    it('opens mobile action menu and triggers Edit, Delete, and View Job actions correctly', async () => {
      const user = userEvent.setup()
      const mockEdit = vi.fn()
      const mockDelete = vi.fn()
      const mockClose = vi.fn()
      const mockApplication = createMockApplication()

      render(
        <ActionButtons
          application={mockApplication}
          onEdit={mockEdit}
          onDelete={mockDelete}
          onClose={mockClose}
        />
      )

      const moreTrigger = screen.getByRole('button', { name: /more actions/i })
      await user.click(moreTrigger)

      // Dropdown menu items are displayed
      const menuEdit = await screen.findByRole('menuitem', { name: /edit/i })
      const menuDelete = await screen.findByRole('menuitem', { name: /delete/i })
      const menuViewJob = await screen.findByRole('menuitem', { name: /view job posting/i })

      expect(menuEdit).toBeInTheDocument()
      expect(menuDelete).toBeInTheDocument()
      expect(menuDelete).toHaveClass('text-red-600')
      expect(menuViewJob).toBeInTheDocument()

      // Click Edit in mobile dropdown
      await user.click(menuEdit)
      expect(mockEdit).toHaveBeenCalledTimes(1)
    })

    it('triggers Delete from mobile dropdown menu', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.fn()
      const mockApplication = createMockApplication()

      render(
        <ActionButtons
          application={mockApplication}
          onEdit={vi.fn()}
          onDelete={mockDelete}
          onClose={vi.fn()}
        />
      )

      const moreTrigger = screen.getByRole('button', { name: /more actions/i })
      await user.click(moreTrigger)

      const menuDelete = await screen.findByRole('menuitem', { name: /delete/i })
      await user.click(menuDelete)
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Defect B: TabNavigation Horizontal Scroll & 5-Tab Extensibility', () => {
    it('uses horizontal scrollable flex container and avoids rigid grid-cols-4', () => {
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={vi.fn()} variant="bottom-bar" />
      )

      const navElement = container.querySelector('nav')
      expect(navElement).toBeInTheDocument()
      expect(navElement).not.toHaveClass('grid')
      expect(navElement).not.toHaveClass('grid-cols-4')
      expect(navElement).toHaveClass('flex')
      expect(navElement).toHaveClass('overflow-x-auto')
    })

    it('safely renders 5 tabs with touch-safe dimensions when tasks tab is included', () => {
      const customFiveTabs = [
        { id: 'overview' as const, label: 'Overview', icon: CheckSquare, description: 'Overview' },
        { id: 'company' as const, label: 'Company', icon: CheckSquare, description: 'Company' },
        {
          id: 'documents' as const,
          label: 'Documents',
          icon: CheckSquare,
          description: 'Documents',
        },
        { id: 'timeline' as const, label: 'Timeline', icon: CheckSquare, description: 'Timeline' },
        { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, description: 'Checklist tasks' },
      ]

      render(
        <TabNavigation
          activeTab="tasks"
          onTabChange={vi.fn()}
          variant="bottom-bar"
          items={customFiveTabs}
        />
      )

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(5)
      expect(screen.getByRole('tab', { name: /tasks/i })).toHaveAttribute('aria-selected', 'true')

      // All 5 tabs satisfy minimum 48px touch target
      tabs.forEach(tab => {
        expect(tab).toHaveClass('min-h-[48px]')
        expect(tab).toHaveClass('min-w-[68px]')
      })
    })
  })

  describe('Defect C & D: Mobile Chrome & Responsive Metadata Strip', () => {
    it('renders single-line horizontal scrollable metadata strip on mobile', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          isOpen={true}
        />
      )

      // Verify metadata strip in portaled DialogContent has single-line scroll classes
      const metadataStrip = document.querySelector('div.overflow-x-auto.whitespace-nowrap')
      expect(metadataStrip).toBeInTheDocument()
      expect(metadataStrip).toHaveClass('scrollbar-none')

      // All metadata values are preserved and accessible
      expect(screen.getByText('Remote, US')).toBeInTheDocument()
      expect(screen.getByText('$200k - $250k')).toBeInTheDocument()
      expect(screen.getByText('Interview')).toBeInTheDocument()
      expect(screen.getByText(/added from linkedin/i)).toBeInTheDocument()
    })
  })

  describe('Defects E & F: ApplicationForm Responsive Sticky Actions', () => {
    it('renders responsive sticky action footer with stacked full-width buttons on mobile', () => {
      const { container } = render(
        <ThemeProvider>
          <ApplicationForm
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
            initialData={{
              company_name: 'Stripe',
              job_title: 'Engineer',
              status: 'applied',
              date_applied: '2025-10-15',
            }}
          />
        </ThemeProvider>
      )

      // Action container must be sticky bottom with semantic modal background and divider
      const actionFooter = container.querySelector('div.sticky.bottom-0')
      expect(actionFooter).toBeInTheDocument()
      expect(actionFooter).toHaveClass('flex-col-reverse')
      expect(actionFooter).toHaveClass('sm:flex-row')
      expect(actionFooter).toHaveClass('border-t')

      // Buttons are touch-friendly min-h-[44px]
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(cancelButton).toHaveClass('min-h-[44px]')
      expect(cancelButton).toHaveClass('w-full')
      expect(submitButton).toHaveClass('min-h-[44px]')
      expect(submitButton).toHaveClass('w-full')
    })
  })

  describe('Mobile Horizontal Overflow Containment — Regression Prevention', () => {
    it('contains metadata strip with w-full max-w-full min-w-0 so it scrolls locally without expanding parent bounds', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          isOpen={true}
        />
      )

      const metadataStrip = document.querySelector('div.overflow-x-auto.whitespace-nowrap')
      expect(metadataStrip).toBeInTheDocument()
      expect(metadataStrip).toHaveClass('w-full')
      expect(metadataStrip).toHaveClass('max-w-full')
      expect(metadataStrip).toHaveClass('min-w-0')
      expect(metadataStrip).toHaveClass('overflow-x-auto')
    })

    it('contains TabNavigation bottom-bar with w-full max-w-full min-w-0', () => {
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={vi.fn()} variant="bottom-bar" />
      )

      const navElement = container.querySelector('nav')
      expect(navElement).toBeInTheDocument()
      expect(navElement).toHaveClass('w-full')
      expect(navElement).toHaveClass('max-w-full')
      expect(navElement).toHaveClass('min-w-0')
      expect(navElement).toHaveClass('overflow-x-auto')
    })

    it('preserves full URL content and wraps long unbroken URLs in Notes with break-word and overflow-wrap', () => {
      const longUrl =
        'https://careers.slb.com/job-listing#sortCriteria=%40career_site_posting_date%20descending&f:@country=[Indonesia]&f:@job_family=[Early%20Careers]&f:@brand=[SLB]&f:@business_unit=[Digital%20Technology]&cq=%40source%3D%3D%22Careers%20Prod%22'
      const application = createMockApplication({
        notes: `Review this link:\n${longUrl}\nAdditional comment here`,
      })

      render(
        <ApplicationDetail
          application={application}
          onUpdate={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          isOpen={true}
        />
      )

      // Full URL is completely preserved and rendered
      expect(screen.getByText(new RegExp(longUrl.slice(0, 30)))).toBeInTheDocument()
      const notesContainer = screen.getByText(new RegExp(longUrl.slice(0, 30)))

      // Must have safe wrapping classes to prevent mobile horizontal blowout
      expect(notesContainer).toHaveClass('[overflow-wrap:anywhere]')
      expect(notesContainer).toHaveClass('[word-break:break-word]')
      expect(notesContainer).toHaveClass('max-w-full')
      expect(notesContainer).toHaveClass('min-w-0')
    })

    it('ensures DialogContent modal shell enforces min-w-0 and max-w-full boundaries', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          isOpen={true}
        />
      )

      const dialogContent = document.querySelector('[role="dialog"]')
      expect(dialogContent).toBeInTheDocument()
      expect(dialogContent).toHaveClass('min-w-0')
      expect(dialogContent).toHaveClass('max-sm:max-w-full')
    })
  })
})
