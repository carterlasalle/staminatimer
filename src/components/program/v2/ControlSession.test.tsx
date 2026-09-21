// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ControlSession } from './ControlSession'
import { useGuidedSessionV2, type GuidedSessionController } from '@/hooks/useGuidedSessionV2'

let controller: GuidedSessionController

const OPTIONS = {
  userId: 'ui-test-user',
  sessionType: 'control' as const,
  prepSeconds: 300,
  targetMs: 240_000,
  sleeveTargetMs: 120_000,
}

function Harness() {
  const session = useGuidedSessionV2(OPTIONS)
  controller = session

  return <ControlSession session={session} />
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function beginMainTraining() {
  act(() => controller.startSession())
  advance(300_000)
  act(() => controller.beginMainBlock({ prepCompleted: true }))
}

describe('ControlSession guided states', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))
    window.localStorage.clear()
    render(<Harness />)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('opens on a breathing prep with the countdown visible', () => {
    expect(screen.getByRole('button', { name: 'Start 5-minute breathing prep' })).toBeTruthy()

    act(() => controller.startSession())

    expect(screen.getByText(/Prep · 5:00 remaining/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Breathing prep in progress' })).toHaveProperty(
      'disabled',
      true
    )
  })

  it('offers the three large main controls once training begins', () => {
    beginMainTraining()

    expect(screen.getByRole('button', { name: 'Steady' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Accelerating' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Need reset' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Complete training' })).toBeTruthy()
  })

  it('shows slow-and-continue guidance while accelerating, then returns to the block', () => {
    beginMainTraining()
    advance(60_000)

    act(() => controller.markAccelerating())

    expect(screen.getByText(/Slow by roughly 30-50%/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back in range' })).toBeTruthy()

    act(() => controller.backInRange())

    expect(screen.queryByText(/Slow by roughly 30-50%/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Accelerating' })).toBeTruthy()
    expect(controller.completedBlocksMs).toHaveLength(0)
  })

  it('requires an explicit 3 or 4 before leaving the full reset', () => {
    beginMainTraining()
    advance(75_000)
    act(() => controller.requestReset())

    expect(screen.getByText(/Recovery elapsed/)).toBeTruthy()
    expect(screen.getByText(/Stop completely/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '3' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '4' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Still above 4' })).toBeTruthy()

    act(() => controller.stillAboveFour())
    expect(screen.getByText(/Recovery elapsed/)).toBeTruthy()

    advance(30_000)
    act(() => controller.confirmReset(3))

    expect(screen.queryByText(/Recovery elapsed/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Accelerating' })).toBeTruthy()
    expect(controller.rescueStopCount).toBe(1)
    expect(controller.completedBlocksMs).toHaveLength(1)
  })

  it('shows the recovery clock as elapsed time with no countdown target', () => {
    beginMainTraining()
    advance(40_000)
    act(() => controller.requestReset())
    advance(92_000)

    // The elapsed clock is its own element now, so assert the value and the
    // explanatory label separately.
    expect(screen.getByText('1:32')).toBeTruthy()
    expect(screen.getByText(/Recovery elapsed/)).toBeTruthy()
  })

  it('ends the structured block and explains the rescue loop instead of inviting a retry', () => {
    beginMainTraining()

    advance(10_000)
    act(() => controller.requestReset())
    act(() => controller.confirmReset(3))
    advance(10_000)
    act(() => controller.requestReset())

    expect(screen.getByText(/Repeated rescue loop detected/)).toBeTruthy()
    expect(
      screen.getByText(/prevents this session from turning into repeated edge\/recovery cycles/)
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Need reset' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save session summary' })).toBeTruthy()
  })

  it('reports the rescue cap rather than the loop when three rescues were already used', () => {
    beginMainTraining()

    for (let index = 0; index < 3; index += 1) {
      advance(180_000)
      act(() => controller.requestReset())
      act(() => controller.confirmReset(4))
    }

    advance(180_000)
    act(() => controller.requestReset())

    expect(screen.getByText(/Rescue limit reached/)).toBeTruthy()
    expect(screen.getByText(/maximum of three rescue stops/)).toBeTruthy()
  })
})
