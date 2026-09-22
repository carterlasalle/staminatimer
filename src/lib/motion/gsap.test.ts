import { describe, expect, it, vi, afterEach } from 'vitest'

import { houseEase, prefersReducedMotion } from '@/lib/motion/gsap'

/**
 * These run during server rendering too, where the DOM globals do not exist.
 * Reading `document` or `matchMedia` there would throw and take the page down,
 * so the guards are the behaviour worth pinning.
 */
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('prefersReducedMotion', () => {
  it('reports false when there is no document, as during server rendering', () => {
    // Deleting the key is what simulates SSR: the guard is `'document' in
    // globalThis`, so assigning `undefined` would leave it present and then
    // throw on the first property read.
    const saved = Reflect.getOwnPropertyDescriptor(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'document')

    try {
      expect(prefersReducedMotion()).toBe(false)
    } finally {
      if (saved) Object.defineProperty(globalThis, 'document', saved)
    }
  })

  it('follows the reduced-motion media query in both directions', () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }))

    expect(prefersReducedMotion()).toBe(true)

    vi.stubGlobal('matchMedia', () => ({ matches: false }))

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('houseEase', () => {
  it('returns the fallback when there is no document', () => {
    const saved = Reflect.getOwnPropertyDescriptor(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'document')

    try {
      expect(houseEase()).toBe('power3.out')
      expect(houseEase('custom')).toBe('custom')
    } finally {
      if (saved) Object.defineProperty(globalThis, 'document', saved)
    }
  })

  it('reads the easing from the CSS custom property so JS cannot drift from CSS', () => {
    vi.stubGlobal('document', { documentElement: {} })
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (name: string) =>
        name === '--ease-out-expo' ? '  cubic-bezier(0.16, 1, 0.3, 1)  ' : '',
    }))

    expect(houseEase()).toBe('cubic-bezier(0.16, 1, 0.3, 1)')
  })

  it('falls back when the custom property is unset', () => {
    vi.stubGlobal('document', { documentElement: {} })
    vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '   ' }))

    expect(houseEase()).toBe('power3.out')
  })
})
