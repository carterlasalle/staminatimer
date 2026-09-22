// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScrollReveal } from '@/components/motion/ScrollReveal'

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock('@/lib/motion/gsap', () => ({
  houseEase: () => 'power3.out',
  prefersReducedMotion: () => reducedMotion.value,
}))

afterEach(() => {
  reducedMotion.value = false
  vi.resetModules()
})

/**
 * The invariant this component exists to protect: **content must never be
 * withheld**. A scroll animation that leaves a blank page when its chunk 404s,
 * when JavaScript is blocked, or for a visitor who asked for reduced motion is a
 * strictly worse bug than having no animation at all.
 */
describe('ScrollReveal', () => {
  it('always renders its children', () => {
    render(<ScrollReveal>Visible copy</ScrollReveal>)

    expect(screen.getByText('Visible copy')).toBeTruthy()
  })

  it('never hides content when the visitor prefers reduced motion', async () => {
    reducedMotion.value = true

    const { container } = render(<ScrollReveal>Reduced motion copy</ScrollReveal>)
    const wrapper = container.firstElementChild as HTMLElement

    // Give the layout effect and the dynamic import a chance to run; if either
    // were going to hide the content they would have done so by now.
    await waitFor(() => {
      expect(wrapper.style.opacity).toBe('')
    })
    expect(screen.getByText('Reduced motion copy')).toBeTruthy()
  })

  it('shows the content again when the animation chunk fails to load', async () => {
    vi.doMock('@/lib/motion/gsap-runtime', () => {
      throw new Error('chunk unavailable')
    })
    vi.resetModules()

    const { ScrollReveal: Fresh } = await import('@/components/motion/ScrollReveal')
    const { container } = render(<Fresh>Fallback copy</Fresh>)
    const wrapper = container.firstElementChild as HTMLElement

    // The hidden state is applied before paint, so the catch is what stops a
    // failed chunk from leaving the content permanently invisible.
    await waitFor(() => {
      expect(wrapper.style.opacity).toBe('')
    })
    expect(screen.getByText('Fallback copy')).toBeTruthy()
  })
})
