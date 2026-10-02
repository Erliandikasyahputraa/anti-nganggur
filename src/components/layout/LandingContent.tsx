'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { NavBar } from '@/components/layout/NavBar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { ProductShowcaseSection } from '@/components/landing/ProductShowcaseSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PlatformFeaturesSection } from '@/components/landing/PlatformFeaturesSection'
import { ValuePropositionsSection } from '@/components/landing/ValuePropositionsSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { FinalCTASection } from '@/components/landing/FinalCTASection'
import type { User } from '@supabase/supabase-js'

interface LandingContentProps {
  user: User | null
}

/**
 * Main landing page content component
 * Orchestrates consumer-first marketing sections with animated background
 */
export function LandingContent({ user }: LandingContentProps) {
  return (
    <AnimatedBackground>
      <NavBar variant="landing" user={user} />
      <main className="relative pt-16 sm:pt-20">
        <HeroSection />
        <ProblemSection />
        <ProductShowcaseSection />
        <HowItWorksSection />
        <PlatformFeaturesSection />
        <ValuePropositionsSection />
        <FAQSection />
        <FinalCTASection />

        {/* Footer */}
        <footer className="px-4 py-12 border-t border-border/40 bg-background/30 backdrop-blur-xs">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border/20">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="Anti-Nganggur Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span className="font-bold text-lg text-foreground">Anti-Nganggur</span>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                  — Biar cari kerja nggak berantakan.
                </span>
              </div>

              {/* Footer Quick Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/75">
                <Link
                  href="/signup"
                  className="hover:text-brand-primary transition-colors font-medium"
                >
                  Mulai Gratis
                </Link>
                <Link href="/login" className="hover:text-brand-primary transition-colors">
                  Masuk
                </Link>
                <a href="#fitur" className="hover:text-brand-primary transition-colors">
                  Fitur
                </a>
                <a href="#cara-kerja" className="hover:text-brand-primary transition-colors">
                  Cara Kerja
                </a>
                <a href="#faq" className="hover:text-brand-primary transition-colors">
                  FAQ
                </a>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
              <p>
                &copy; {new Date().getFullYear()} Anti-Nganggur. Dibuat untuk para pencari kerja di
                Indonesia.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com/Erliandikasyahputraa/anti-nganggur"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub repository"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </Link>
                <span>•</span>
                <Link
                  href="https://github.com/Erliandikasyahputraa/anti-nganggur/blob/main/LICENSE"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MIT License
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </AnimatedBackground>
  )
}
