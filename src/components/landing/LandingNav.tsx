'use client'

import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

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
        animate={{
          backgroundColor: scrolled ? 'rgba(7, 21, 33, 0.92)' : 'rgba(7, 21, 33, 0)',
          borderColor: scrolled ? 'rgba(215, 229, 229, 0.14)' : 'rgba(215, 229, 229, 0)',
          boxShadow: scrolled ? '0 10px 32px rgba(0,0,0,0.16)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex h-14 max-w-[1600px] items-center justify-between border px-3 sm:px-5"
      >
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight text-[#edf3f1]"
        >
          Stamina
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
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
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-[#d7e5e5] transition-colors hover:text-white sm:block"
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
