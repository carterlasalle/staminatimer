'use client'

/**
 * Synchronous motion helpers with no library behind them.
 *
 * GSAP is deliberately NOT imported here. A module that statically references
 * `gsap` puts it in whatever chunk its importers land in — measured on the
 * landing page as ScrollTrigger and SplitText being pulled in eagerly by the
 * initial HTML, ~15 KiB, despite the calls being wrapped in `import()`. The
 * plugin loading lives in `gsap-runtime.ts`, which nothing imports statically,
 * so GSAP cannot reach a first-paint chunk.
 */

/**
 * Motion is a preference, not a decoration. Everything animated here collapses
 * to its finished state for anyone who has asked the OS to reduce motion.
 *
 * `in` narrowing rather than `typeof`: this runs during server rendering too,
 * where the DOM globals do not exist. Reading the property then would throw.
 */
export function prefersReducedMotion(): boolean {
  if (!('document' in globalThis) || !('matchMedia' in globalThis)) {
    return false
  }

  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The house easing, read from the CSS custom properties so JS and CSS cannot
 * drift apart. `ease-out-expo` is cubic-bezier(0.16, 1, 0.3, 1) — no spring, no
 * overshoot, in keeping with the design system.
 */
export function houseEase(fallback = 'power3.out'): string {
  if (!('document' in globalThis)) return fallback

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--ease-out-expo')
    .trim()

  return value || fallback
}
