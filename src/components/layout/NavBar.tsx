'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ProfileDropdown } from '@/components/auth/ProfileDropdown'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { useLogout } from '@/hooks/useLogout'

interface NavBarProps {
  variant?: 'landing' | 'authenticated' | 'auth-pages'
  user?: User | null
  showThemeToggle?: boolean
  className?: string
}

export function NavBar({
  variant = 'landing',
  user,
  showThemeToggle = true,
  className,
}: NavBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useLogout()

  // Unified styling for all variants
  const unifiedStyles = {
    borderColor: 'var(--glass-border-subtle)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }

  // Determine logo destination based on variant
  const logoHref = variant === 'authenticated' ? '/dashboard' : '/'

  // Variant 1: Landing Page NavBar
  if (variant === 'landing') {
    return (
      <header
        className={cn('fixed top-0 left-0 right-0 z-50 border-b glass-light', className)}
        style={unifiedStyles}
      >
        <div className="mx-auto w-[98%] px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="Anti-Nganggur Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text">Anti-Nganggur</span>
            </Link>

            {/* Navigation Links & Actions */}
            <div className="flex items-center gap-4">
              {/* Section Anchors */}
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-label-secondary mr-2">
                <a href="#fitur" className="hover:text-label-primary transition-colors">
                  Fitur
                </a>
                <a href="#cara-kerja" className="hover:text-label-primary transition-colors">
                  Cara Kerja
                </a>
                <a href="#faq" className="hover:text-label-primary transition-colors">
                  FAQ
                </a>
              </nav>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-2 rounded-glass-sm glass-medium px-4 py-2 text-sm font-semibold text-label-primary shadow-glass-subtle hover:glass-heavy transition-all duration-300"
                    style={{
                      border: '1px solid var(--glass-border-strong)',
                    }}
                  >
                    Buka Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-label-primary hover:text-label-secondary transition-colors glass-interactive"
                  >
                    Masuk
                  </Link>

                  <Link
                    href="/signup"
                    className="hidden sm:inline-flex items-center gap-2 rounded-glass-sm btn-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glass-subtle hover:scale-105 transition-all duration-300"
                    style={{
                      border: '1px solid var(--glass-border-strong)',
                    }}
                  >
                    Daftar
                  </Link>
                </>
              )}

              <Link
                href="https://github.com/Erliandikasyahputraa/anti-nganggur"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-label-primary hover:text-label-secondary transition-colors glass-interactive"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>

              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Variant 2: Authenticated Pages NavBar (Dashboard)
  if (variant === 'authenticated') {
    return (
      <header className={cn('border-b glass-light', className)} style={unifiedStyles}>
        <div className="mx-auto w-full px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80 shrink-0"
            >
              <Image
                src="/logo.png"
                alt="Anti-Nganggur Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text hidden sm:inline-block">Anti-Nganggur</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-2 ml-6 flex-1">
              <Link
                href="/dashboard"
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-glass-sm transition-all',
                  pathname === '/dashboard'
                    ? 'bg-label-quaternary/10 text-label-primary font-semibold'
                    : 'text-label-secondary hover:text-label-primary hover:bg-label-quaternary/5'
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/applications"
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-glass-sm transition-all',
                  pathname === '/applications'
                    ? 'bg-label-quaternary/10 text-label-primary font-semibold'
                    : 'text-label-secondary hover:text-label-primary hover:bg-label-quaternary/5'
                )}
              >
                Lamaran
              </Link>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {user && (
                <ProfileDropdown
                  user={user}
                  onProfileClick={() => {
                    router.push('/profile')
                  }}
                  onLogoutClick={logout}
                />
              )}

              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="flex sm:hidden mt-3 p-1 bg-label-quaternary/10 rounded-glass-sm gap-1 w-full">
            <Link
              href="/dashboard"
              className={cn(
                'flex-1 text-center py-2 text-sm font-medium rounded-md transition-all',
                pathname === '/dashboard'
                  ? 'bg-background shadow-glass-subtle text-label-primary font-semibold'
                  : 'text-label-secondary hover:text-label-primary'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/applications"
              className={cn(
                'flex-1 text-center py-2 text-sm font-medium rounded-md transition-all',
                pathname === '/applications'
                  ? 'bg-background shadow-glass-subtle text-label-primary font-semibold'
                  : 'text-label-secondary hover:text-label-primary'
              )}
            >
              Applications
            </Link>
          </div>
        </div>
      </header>
    )
  }

  // Variant 3: Auth Pages NavBar (Login/Signup)
  if (variant === 'auth-pages') {
    return (
      <header className={cn('border-b glass-light', className)} style={unifiedStyles}>
        <div className="mx-auto w-[98%] px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="Anti-Nganggur Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text">Anti-Nganggur</span>
            </Link>

            {/* Theme Toggle */}
            {showThemeToggle && (
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Default fallback (should never reach here with TypeScript)
  return null
}
