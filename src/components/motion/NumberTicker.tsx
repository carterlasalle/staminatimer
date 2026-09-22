'use client'

import { useEffect, useRef, useState } from 'react'

import { prefersReducedMotion } from '@/lib/motion/gsap'

type NumberTickerProps = {
  value: number
  className?: string
  durationMs?: number
  /** Decimal places to render. A number rather than a formatter function: a
   *  callback prop cannot cross a client-component boundary. */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Rendered instead of the number when the value is not finite. */
  fallback?: string
}

/** `[0.16, 1, 0.3, 1]` — the house curve, matching `--ease-out-expo`. */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * Counts up to `value` the first time it scrolls into view.
 *
 * Deliberately not built on Motion's `useInView` + `animate`. Those live in
 * Motion's full React entry, which drags the whole library (~45 KiB) into the
 * landing page's initial bundle — measured at roughly a second of LCP on the
 * page that had just been brought down to 2.2 s. An intersection observer and a
 * rAF loop are about fifteen lines and cost nothing; the rest of the page still
 * uses Motion for what it is genuinely good at.
 *
 * The final value is what renders on the server and on first paint, so a visitor
 * without JavaScript, or who prefers reduced motion, sees the real number rather
 * than a zero.
 */
export function NumberTicker({
  value,
  className,
  durationMs = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  fallback = '—',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)
  const started = useRef(false)

  useEffect(() => {
    const element = ref.current

    if (!element || prefersReducedMotion() || !Number.isFinite(value)) return
    if (!('IntersectionObserver' in globalThis)) return

    let frame = 0

    const run = () => {
      const start = performance.now()

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs)

        setDisplay(value * easeOutExpo(progress))

        if (progress < 1) frame = requestAnimationFrame(step)
        else setDisplay(value)
      }

      frame = requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || started.current) return

        started.current = true
        observer.disconnect()
        run()
      },
      { threshold: 0.5 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, durationMs])

  const rendered = Number.isFinite(value)
    ? `${prefix}${display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`
    : fallback

  return (
    <span ref={ref} className={className}>
      {rendered}
    </span>
  )
}
