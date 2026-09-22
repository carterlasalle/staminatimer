'use client'

// The mini entry, not `motion/react`. It exports per-element components instead
// of a `motion` object and omits the full React entry's viewport machinery and
// layout-animation runtime — a difference measured at ~45 KiB in the landing
// page's initial bundle, which cost about a second of LCP on a page that had
// just been brought down to 2.2 s.
//
// The trade is that `whileInView` is NOT supported here: using it left every
// child on its `hidden` variant permanently, which is content invisible rather
// than an animation that fails to run. The reveal is therefore driven by an
// observer this component owns, and the hidden state is only applied once the
// element is known to be off-screen.
import { div as MotionDiv } from 'motion/react-m'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { prefersReducedMotion } from '@/lib/motion/gsap'

type AnimatedGroupProps = {
  children: ReactNode[]
  className?: string
  /** Seconds between children. Keep it small; this is a list, not a show. */
  stagger?: number
  delay?: number
  itemClassName?: string
}

const HIDDEN = 'hidden'
const VISIBLE = 'visible'

/**
 * A staggered entrance for a list of children (Motion).
 *
 * Variants carry the stagger, so it stays correct for any list length without
 * the caller counting its own items. Transform and opacity only, on the house
 * curve `[0.16, 1, 0.3, 1]` — no spring, which the design system rules out.
 *
 * Safety property, learned the hard way: children start in their VISIBLE state
 * and are only hidden after mount, and only when the group is actually below the
 * fold. Anything already on screen is never hidden, so no failure of the
 * observer or the library can leave a visitor looking at a blank section.
 */
export function AnimatedGroup({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  itemClassName,
}: AnimatedGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'visible' | 'hidden'>(VISIBLE)

  useEffect(() => {
    const element = ref.current

    if (!element || prefersReducedMotion()) return
    if (!('IntersectionObserver' in globalThis)) return

    // Already on screen — leave it alone rather than hiding it to reveal it.
    if (element.getBoundingClientRect().top <= window.innerHeight * 0.9) return

    setPhase(HIDDEN)

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        setPhase(VISIBLE)
        observer.disconnect()
      },
      { threshold: 0.15 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <MotionDiv
      ref={ref}
      className={className}
      initial={false}
      animate={phase}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children.map((child, index) => (
        <MotionDiv
          // Children are static page content, so position is a stable key.
          key={index}
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          {child}
        </MotionDiv>
      ))}
    </MotionDiv>
  )
}
