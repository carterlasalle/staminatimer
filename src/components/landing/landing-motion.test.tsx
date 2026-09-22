// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CinematicHero } from './CinematicHero'
import { ProductStory } from './ProductStory'
import { ProgressLandscape } from './ProgressLandscape'

const withGsapMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/motion/gsap-runtime', () => ({ withGsap: withGsapMock }))

type FrameCallback = (time: number) => void

let frameId = 0
let frames: Map<number, FrameCallback>

beforeEach(() => {
  frames = new Map()
  frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => {
    frameId += 1
    frames.set(frameId, callback)

    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  withGsapMock.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function runNextFrame() {
  const next = frames.entries().next().value as [number, FrameCallback] | undefined
  if (!next) return false

  const [id, callback] = next
  frames.delete(id)
  callback(0)

  return true
}

describe('CinematicHero pointer motion', () => {
  it('idles after convergence and restarts without duplicate loops', () => {
    const { container } = render(<CinematicHero />)
    const scene = container.querySelector<HTMLElement>('.landing-hero-scene')
    expect(scene).not.toBeNull()

    act(() => {
      runNextFrame()
    })
    expect(frames.size).toBe(0)

    vi.spyOn(scene!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    })

    fireEvent.pointerMove(scene!, { clientX: 100, clientY: 100 })
    expect(frames.size).toBe(1)

    fireEvent.pointerMove(scene!, { clientX: 90, clientY: 90 })
    expect(frames.size).toBe(1)

    let executed = 0
    act(() => {
      while (runNextFrame() && executed < 300) executed += 1
    })

    expect(executed).toBeLessThan(300)
    expect(frames.size).toBe(0)

    fireEvent.pointerLeave(scene!)
    expect(frames.size).toBe(1)
  })
})

describe('landing fallbacks', () => {
  it('keeps story content and the progress path present without motion enhancement', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    const { container } = render(
      <>
        <ProductStory />
        <ProgressLandscape />
      </>
    )

    expect(screen.getByText('One clear session.')).toBeTruthy()
    expect(screen.getByText('Keep the signal simple.')).toBeTruthy()
    expect(screen.getByText('Evidence changes the target.')).toBeTruthy()
    expect(screen.getByText('Pause').tagName).toBe('SPAN')
    expect(screen.getByText('Need a reset').tagName).toBe('SPAN')
    expect(container.querySelector('.story-train.absolute')).toBeNull()
    expect(container.querySelector('.story-progress.absolute')).toBeNull()

    const path = container.querySelector<SVGPathElement>('.landing-ridge-chart path')
    expect(path?.style.strokeDasharray).toBe('')
    expect(path?.style.strokeDashoffset).toBe('')
  })

  it('adds the enhanced story state only after GSAP is available and removes it on cleanup', async () => {
    const revert = vi.fn()
    withGsapMock.mockImplementation(async (work) => {
      const timeline = {
        to: vi.fn(() => timeline),
        fromTo: vi.fn(() => timeline),
      }
      const gsap = {
        context: (callback: () => void) => {
          callback()

          return { revert }
        },
        fromTo: vi.fn(),
        set: vi.fn(),
        timeline: vi.fn(() => timeline),
        utils: {
          toArray: (selector: string) => Array.from(document.querySelectorAll(selector)),
        },
      }

      return work({ gsap })
    })

    const { container, unmount } = render(<ProductStory />)
    const section = container.querySelector<HTMLElement>('.landing-story-section')

    await waitFor(() => expect(section?.classList.contains('story-enhanced')).toBe(true))

    unmount()

    expect(revert).toHaveBeenCalledOnce()
    expect(section?.classList.contains('story-enhanced')).toBe(false)
  })
})
