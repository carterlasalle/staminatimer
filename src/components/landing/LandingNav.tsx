'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const transition = {
    duration: prefersReducedMotion ? 0 : 0.28,
    ease: [0.16, 1, 0.3, 1] as const,
  }

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28)
    update()
    window.addEventListener('scroll', update, { passive: true })

    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <motion.header
      animate={scrolled ? 'settled' : 'overScene'}
      className="landing-nav fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5"
      initial={false}
      variants={{
        overScene: { y: 0 },
        settled: { y: 0 },
      }}
    >
      <motion.div
        animate={{ opacity: 1 }}
        transition={transition}
        className="relative mx-auto flex h-14 max-w-[1600px] items-center justify-between px-3 sm:px-5"
      >
        <motion.span
          aria-hidden
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={transition}
          className="pointer-events-none absolute inset-0 border border-landing-mist/15 bg-landing-ink/95"
        />
        <Link
          href="/"
          className="relative font-display text-base font-semibold tracking-tight text-landing-paper"
        >
          Stamina Timer
        </Link>
        <nav aria-label="Main" className="relative hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="landing-nav-link">
            How it works
          </a>
          <a href="#progress" className="landing-nav-link">
            Progress
          </a>
          <a href="#privacy" className="landing-nav-link">
            Privacy
          </a>
        </nav>
        <div className="relative flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-landing-mist transition-colors hover:text-landing-paper sm:block"
          >
            Sign in
          </Link>
          <Link href="/login" className="landing-nav-cta">
            <span>Start training</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </motion.header>
  )
}
