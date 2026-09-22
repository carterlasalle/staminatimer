'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

import { houseEase, prefersReducedMotion } from '@/lib/motion/gsap'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type SplitHeadingProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** `h1` for the page hero, `h2` for a section. */
  as?: 'h1' | 'h2'
}

/**
 * A heading whose lines rise in individually (GSAP SplitText).
 *
 * Three details that matter and are easy to get wrong:
 *
 * - **`aria: 'auto'`.** SplitText rewrites the DOM into per-line spans. Without
 *   this the heading is read out as a series of disconnected fragments or not at
 *   all, because the source text is replaced by elements. The option makes the
 *   plugin put the original string in an `aria-label` and hide the fragments.
 * - **It waits for the fonts.** Lines are measured to split, and the self-hosted
 *   display font is a web font — splitting before it loads measures the fallback
 *   and produces the wrong line breaks, which then reflow visibly.
 * - **The hidden state is applied in a layout effect, never in CSS**, so a
 *   visitor without JavaScript or with reduced motion gets the plain heading.
 */
export function SplitHeading({
  children,
  className,
  delay = 0,
  as: Tag = 'h2',
}: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

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

    void (async () => {
      const { withGsap } = await import('@/lib/motion/gsap-runtime')

      // Splitting before the display font settles measures the fallback and
      // breaks the lines in the wrong places.
      if (document.fonts?.ready) {
        await document.fonts.ready
      }

      if (cancelled || !ref.current) return

      await withGsap(({ gsap, SplitText }) => {
        const heading = ref.current
        if (!heading) return

        const split = new SplitText(heading, {
          type: 'lines',
          linesClass: 'split-line',
          aria: 'auto',
        })

        gsap.set(heading, { opacity: 1 })

        gsap.fromTo(
          split.lines,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            delay,
            stagger: 0.08,
            ease: houseEase(),
          }
        )

        revert = () => {
          split.revert()
        }
      })
    })()
      // The heading is hidden before paint, so a failed chunk would leave it
      // permanently invisible. Showing the heading is the correct failure mode.
      .catch(() => {
        if (ref.current) ref.current.style.opacity = ''
      })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [delay])

  return (
    // `data-split` tells the CSS `entrance` utility to leave this element alone:
    // its lines are animated here, and doing both moved the heading twice.
    <Tag ref={ref} data-split className={className}>
      {children}
    </Tag>
  )
}
