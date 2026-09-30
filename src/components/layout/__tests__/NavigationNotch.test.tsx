import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { NavigationNotch } from '../NavigationNotch'
import { AppShell } from '../AppShell'
import { setupMatchMedia } from '@/test/setup'

// Track active pathname for next/navigation mock
let currentPathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock ThemeToggle
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme Toggle</button>,
}))

// Mock ProfileDropdown
vi.mock('@/components/auth/ProfileDropdown', () => ({
  ProfileDropdown: ({ user, className }: { user: User; className?: string }) => (
    <button aria-label={`User menu for ${user.email}`} className={className}>
      Profile: {user.email}
    </button>
  ),
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
} as unknown as User

describe('NavigationNotch Component', () => {
  beforeEach(() => {
    setupMatchMedia()
    currentPathname = '/dashboard'
  })

  describe('Destination Rendering & Route Mapping', () => {
    it('should render all four navigation destinations', () => {
      render(<NavigationNotch user={mockUser} />)
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /apps/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /to-do/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /zen/i })).toBeInTheDocument()
    })

    it('should map Dashboard to /dashboard', () => {
      render(<NavigationNotch />)
      const link = screen.getByRole('link', { name: /dashboard/i })
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should map Applications to /applications', () => {
      render(<NavigationNotch />)
      const link = screen.getByRole('link', { name: /apps/i })
      expect(link).toHaveAttribute('href', '/applications')
    })

    it('should map To-Do to /todos', () => {
      render(<NavigationNotch />)
      const link = screen.getByRole('link', { name: /to-do/i })
      expect(link).toHaveAttribute('href', '/todos')
    })

    it('should map Zen to /zen', () => {
      render(<NavigationNotch />)
      const link = screen.getByRole('link', { name: /zen/i })
      expect(link).toHaveAttribute('href', '/zen')
    })
  })

  describe('Active Route State Matching', () => {
    it('should activate Dashboard on exact /dashboard match', () => {
      currentPathname = '/dashboard'
      render(<NavigationNotch />)
      const activeLink = screen.getByRole('link', { name: /dashboard/i })
      expect(activeLink).toHaveAttribute('aria-current', 'page')

      expect(screen.getByRole('link', { name: /apps/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: /to-do/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: /zen/i })).not.toHaveAttribute('aria-current')
    })

    it('should NOT activate Dashboard on subpaths because exact match is required', () => {
      currentPathname = '/dashboard/settings'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
    })

    it('should activate Applications on /applications', () => {
      currentPathname = '/applications'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /apps/i })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
    })

    it('should activate Applications on nested subpaths like /applications/123', () => {
      currentPathname = '/applications/123'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /apps/i })).toHaveAttribute('aria-current', 'page')
    })

    it('should activate To-Do on /todos', () => {
      currentPathname = '/todos'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /to-do/i })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
    })

    it('should activate To-Do on nested subpaths like /todos/active', () => {
      currentPathname = '/todos/active'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /to-do/i })).toHaveAttribute('aria-current', 'page')
    })

    it('should activate Zen on /zen', () => {
      currentPathname = '/zen'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /zen/i })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
    })

    it('should activate Zen on nested subpaths like /zen/session', () => {
      currentPathname = '/zen/session'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /zen/i })).toHaveAttribute('aria-current', 'page')
    })

    it('should have no active destination on unrelated routes like /profile', () => {
      currentPathname = '/profile'
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: /apps/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: /to-do/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: /zen/i })).not.toHaveAttribute('aria-current')
    })
  })

  describe('Accessibility & Screen Reader Contracts', () => {
    it('should render header landmark with role banner and nav landmark with label', () => {
      render(<NavigationNotch />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Navigasi Utama' })).toBeInTheDocument()
    })

    it('should provide accessible text for screen readers on mobile via sr-only spans', () => {
      const { container } = render(<NavigationNotch />)
      const srSpans = container.querySelectorAll('nav a span.sr-only')
      expect(srSpans.length).toBe(4)
      const labels = Array.from(srSpans).map(s => s.textContent)
      expect(labels).toEqual(['Dashboard', 'Apps', 'To-Do', 'Zen'])
    })

    it('should provide visible labels for desktop via hidden sm:inline spans', () => {
      const { container } = render(<NavigationNotch />)
      const desktopSpans = container.querySelectorAll('nav a span.hidden.sm\\:inline')
      expect(desktopSpans.length).toBe(4)
      const labels = Array.from(desktopSpans).map(s => s.textContent)
      expect(labels).toEqual(['Dashboard', 'Apps', 'To-Do', 'Zen'])
    })

    it('should provide title attributes matching labels on all links', () => {
      render(<NavigationNotch />)
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('title', 'Dashboard')
      expect(screen.getByRole('link', { name: /apps/i })).toHaveAttribute('title', 'Apps')
      expect(screen.getByRole('link', { name: /to-do/i })).toHaveAttribute('title', 'To-Do')
      expect(screen.getByRole('link', { name: /zen/i })).toHaveAttribute('title', 'Zen')
    })

    it('should provide focus-visible rings with ring-ring on all links', () => {
      const { container } = render(<NavigationNotch />)
      const links = container.querySelectorAll('nav a')
      links.forEach(link => {
        expect(link).toHaveClass('focus-visible:ring-2')
        expect(link).toHaveClass('focus-visible:ring-ring')
      })
    })

    it('should provide touch hit envelope expansion for mobile via pseudo-element', () => {
      const { container } = render(<NavigationNotch />)
      const links = container.querySelectorAll('nav a')
      links.forEach(link => {
        expect(link).toHaveClass('before:absolute')
        expect(link).toHaveClass('before:-inset-1')
        expect(link).toHaveClass('sm:before:hidden')
      })
    })
  })

  describe('User Session & Utility Integration', () => {
    it('should always render ThemeToggle', () => {
      render(<NavigationNotch />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })

    it('should render ProfileDropdown when user is provided', () => {
      render(<NavigationNotch user={mockUser} />)
      expect(screen.getByLabelText(`User menu for ${mockUser.email}`)).toBeInTheDocument()
    })

    it('should NOT render ProfileDropdown when user is null', () => {
      render(<NavigationNotch user={null} />)
      expect(screen.queryByLabelText(/user menu/i)).not.toBeInTheDocument()
    })

    it('should NOT render ProfileDropdown when user is undefined', () => {
      render(<NavigationNotch />)
      expect(screen.queryByLabelText(/user menu/i)).not.toBeInTheDocument()
    })

    it('should apply custom className to header container', () => {
      const { container } = render(<NavigationNotch className="custom-notch-class" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-notch-class')
    })
  })

  describe('Regression & Architectural Invariants', () => {
    it('should render exactly 4 navigation destinations without duplicates', () => {
      const { container } = render(<NavigationNotch />)
      const links = container.querySelectorAll('nav a')
      expect(links.length).toBe(4)
    })

    it('should NOT render an EN/ID language switcher', () => {
      render(<NavigationNotch />)
      expect(screen.queryByText('EN')).not.toBeInTheDocument()
      expect(screen.queryByText('ID')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/language/i)).not.toBeInTheDocument()
    })

    it('should NOT render sidebar or mobile bottom nav elements', () => {
      const { container } = render(<NavigationNotch />)
      expect(container.querySelector('aside')).not.toBeInTheDocument()
      expect(container.querySelector('.bottom-nav')).not.toBeInTheDocument()
      expect(container.querySelector('nav.fixed.bottom-0')).not.toBeInTheDocument()
    })
  })
})

describe('AppShell Component', () => {
  beforeEach(() => {
    setupMatchMedia()
    currentPathname = '/dashboard'
  })

  it('should render children within the main basin', () => {
    render(
      <AppShell>
        <div data-testid="test-child">Child Content</div>
      </AppShell>
    )
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should render NavigationNotch header inside AppShell', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigasi Utama' })).toBeInTheDocument()
  })

  it('should own AnimatedBackground with minimal variant wrapper', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    const bg = container.firstChild as HTMLElement
    expect(bg).toHaveClass('relative')
    expect(bg).toHaveClass('min-h-screen')
  })

  it('should preserve pt-20 sm:pt-24 pb-6 clearance on main element', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    const main = container.querySelector('main')
    expect(main).toHaveClass('pt-20')
    expect(main).toHaveClass('sm:pt-24')
    expect(main).toHaveClass('pb-6')
  })

  it('should NOT impose max-w-7xl on the AppShell main basin', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    const main = container.querySelector('main')
    expect(main).not.toHaveClass('max-w-7xl')
    expect(main).toHaveClass('w-full')
  })

  it('should pass user prop down to NavigationNotch for authenticated utilities', () => {
    render(
      <AppShell user={mockUser}>
        <div>Content</div>
      </AppShell>
    )
    expect(screen.getByLabelText(`User menu for ${mockUser.email}`)).toBeInTheDocument()
  })

  it('should apply custom className and mainClassName props', () => {
    const { container } = render(
      <AppShell className="custom-shell-class" mainClassName="custom-main-class">
        <div>Content</div>
      </AppShell>
    )
    const innerWrapper = container.querySelector('.custom-shell-class')
    expect(innerWrapper).toBeInTheDocument()
    const main = container.querySelector('main')
    expect(main).toHaveClass('custom-main-class')
  })
})
