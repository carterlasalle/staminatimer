'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

import { houseEase, prefersReducedMotion } from '@/lib/motion/gsap'

/** `useLayoutEffect` without the server-render warning. */
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type ScrollRevealProps = {
  children: ReactNode
  /** Distance travelled on the way in. Transform only — never layout properties. */
  distance?: number
  delay?: number
  className?: string
}

/**
 * Reveals its children once, when they first scroll into view.
 *
 * Two things this deliberately does NOT do:
 *
 * 1. It never hides content in CSS. The hidden state is applied in a layout
 *    effect, so if JavaScript fails, is blocked, or the visitor prefers reduced
 *    motion, the content is simply there. A scroll animation that leaves a blank
 *    page when a chunk 404s is a worse bug than no animation.
 * 2. It animates `opacity` and `transform` only, at the house easing curve. No
 *    spring, no overshoot, no width/height/margin motion — that is the design
 *    system's rule and it is also what keeps the compositor doing the work.
 */
export function ScrollReveal({ children, distance = 22, delay = 0, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Runs before paint, so an element that is already on screen at load cannot
  // flash visible and then jump back to animate in.
  useBrowserLayoutEffect(() => {
    const element = ref.current

    if (!element || prefersReducedMotion()) return

    element.style.opacity = '0'
  }, [])

  useEffect(() => {
    const element = ref.current

    if (!element || prefersReducedMotion()) return

    let cancelled = false
    let revert: (() => void) | undefined

    void import('@/lib/motion/gsap-runtime')
      .then(({ withGsap }) =>
        withGsap(({ gsap, ScrollTrigger }) => {
          if (cancelled) return

          const context = gsap.context(() => {
            gsap.fromTo(
              element,
              { opacity: 0, y: distance },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                delay,
                ease: houseEase(),
                scrollTrigger: { trigger: element, start: 'top 88%', once: true },
              }
            )
          }, element)

          revert = () => {
            context.revert()
            ScrollTrigger.refresh()
          }
        })
      )
      // The hidden state above is applied before paint, so a chunk that never
      // arrives would leave the content permanently invisible. Whatever went
      // wrong, showing the content is the correct failure mode.
      .catch(() => {
        element.style.opacity = ''
      })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [distance, delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
