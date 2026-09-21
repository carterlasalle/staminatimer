// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGuidedSessionV2, type UseGuidedSessionV2Options } from './useGuidedSessionV2'

const BASE_OPTIONS: UseGuidedSessionV2Options = {
  userId: 'test-user',
  sessionType: 'control',
  prepSeconds: 300,
  targetMs: 240_000,
  sleeveTargetMs: 120_000,
}

function setup(overrides: Partial<UseGuidedSessionV2Options> = {}) {
  const options = { ...BASE_OPTIONS, ...overrides }
  const rendered = renderHook(() => useGuidedSessionV2(options))

  return rendered
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** Drive a Control session from scratch into an open continuous block. */
function startControlBlock(rendered: ReturnType<typeof setup>) {
  act(() => rendered.result.current.startSession())
  advance(300_000)
  act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
}

describe('useGuidedSessionV2 control block', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in breathing prep and requires prep before the block', () => {
    const rendered = setup()

    act(() => rendered.result.current.startSession())
    expect(rendered.result.current.stage).toBe('prep')
    expect(rendered.result.current.prepRemainingMs).toBe(300_000)

    advance(300_000)
    expect(rendered.result.current.prepRemainingMs).toBe(0)
  })

  it('marks prep incomplete when the user continues early', () => {
    const rendered = setup()

    act(() => rendered.result.current.startSession())
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: false }))

    expect(rendered.result.current.stage).toBe('main')
    expect(rendered.result.current.prepCompleted).toBe(false)
  })

  it('does not break the continuous block when the user slows down', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(60_000)

    act(() => rendered.result.current.markAccelerating())
    expect(rendered.result.current.stage).toBe('accelerating')

    advance(30_000)
    act(() => rendered.result.current.backInRange())

    expect(rendered.result.current.stage).toBe('main')
    expect(rendered.result.current.completedBlocksMs).toHaveLength(0)
    expect(rendered.result.current.currentBlockMs).toBeGreaterThanOrEqual(90_000)
    expect(rendered.result.current.longestContinuousBlockMs).toBe(0)
  })

  it('breaks the continuous block and records it when a rescue starts', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(95_000)

    act(() => rendered.result.current.requestReset())

    expect(rendered.result.current.stage).toBe('rescue')
    expect(rendered.result.current.completedBlocksMs).toHaveLength(1)
    expect(rendered.result.current.completedBlocksMs[0]).toBeGreaterThanOrEqual(95_000)
    expect(rendered.result.current.longestContinuousBlockMs).toBeGreaterThanOrEqual(95_000)
    expect(rendered.result.current.rescueStopCount).toBe(1)
    expect(rendered.result.current.currentBlockMs).toBe(0)
  })

  it('keeps the rescue open-ended and never auto-resumes on a countdown', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(40_000)
    act(() => rendered.result.current.requestReset())

    advance(600_000)

    expect(rendered.result.current.stage).toBe('rescue')
    expect(rendered.result.current.rescueElapsedMs).toBeGreaterThanOrEqual(600_000)
    expect(rendered.result.current.rescueEvents[0]?.endedOffsetMs).toBeFalsy()
  })

  it('stays in the rescue while the user is still above 4', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(40_000)
    act(() => rendered.result.current.requestReset())

    act(() => rendered.result.current.stillAboveFour())

    expect(rendered.result.current.stage).toBe('rescue')
    expect(rendered.result.current.currentArousal).toBeGreaterThanOrEqual(5)
  })

  it('closes the rescue only on a genuine 3 or 4 and starts a new block', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(50_000)
    act(() => rendered.result.current.requestReset())
    advance(20_000)

    act(() => rendered.result.current.confirmReset(3))

    expect(rendered.result.current.stage).toBe('main')
    expect(rendered.result.current.rescueStopCount).toBe(1)
    expect(rendered.result.current.totalRescueMs).toBeGreaterThanOrEqual(20_000)
    expect(rendered.result.current.rescueEvents[0]?.durationMs).toBeGreaterThanOrEqual(20_000)
    expect(rendered.result.current.rescueEvents[0]?.arousalAfter).toBe(3)

    advance(15_000)
    expect(rendered.result.current.currentBlockMs).toBeGreaterThanOrEqual(15_000)
    expect(rendered.result.current.completedBlocksMs).toHaveLength(1)
  })

  it('terminates the structured block when two rapid rescues form a rescue loop', () => {
    const rendered = setup()
    startControlBlock(rendered)

    advance(10_000)
    act(() => rendered.result.current.requestReset())
    expect(rendered.result.current.stage).toBe('rescue')
    act(() => rendered.result.current.confirmReset(3))

    advance(10_000)
    act(() => rendered.result.current.requestReset())

    expect(rendered.result.current.stage).toBe('block_ended')
    expect(rendered.result.current.antiLoopTerminated).toBe(true)
    expect(rendered.result.current.terminationReason).toBe('rescue_loop')
    expect(rendered.result.current.rescueStopCount).toBe(2)
  })

  it('does not flag a rescue loop when earlier blocks were long enough', () => {
    const rendered = setup()
    startControlBlock(rendered)

    advance(180_000)
    act(() => rendered.result.current.requestReset())
    act(() => rendered.result.current.confirmReset(3))

    advance(180_000)
    act(() => rendered.result.current.requestReset())

    expect(rendered.result.current.stage).toBe('rescue')
    expect(rendered.result.current.antiLoopTerminated).toBe(false)
  })

  it('enforces the three-rescue maximum on a Control session', () => {
    const rendered = setup()
    startControlBlock(rendered)

    for (let index = 0; index < 3; index += 1) {
      advance(180_000)
      act(() => rendered.result.current.requestReset())
      expect(rendered.result.current.stage).toBe('rescue')
      act(() => rendered.result.current.confirmReset(4))
    }

    expect(rendered.result.current.rescueStopCount).toBe(3)

    advance(180_000)
    act(() => rendered.result.current.requestReset())

    expect(rendered.result.current.stage).toBe('block_ended')
    expect(rendered.result.current.terminationReason).toBe('max_rescues')
    expect(rendered.result.current.antiLoopTerminated).toBe(false)
  })

  it('reports a completed Control session as a progression submission', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(700_000)

    act(() => rendered.result.current.completeControl())

    const submission = rendered.result.current.buildSubmission()
    expect(rendered.result.current.stage).toBe('summary')
    expect(submission.completedProtocol).toBe(true)
    expect(submission.antiLoopTerminated).toBe(false)
    expect(submission.longestContinuousBlockMs).toBeGreaterThanOrEqual(700_000)
    expect(submission.rescueEvents).toHaveLength(0)
  })

  it('reports a rescue-loop termination as not progression eligible', () => {
    const rendered = setup()
    startControlBlock(rendered)
    advance(10_000)
    act(() => rendered.result.current.requestReset())
    act(() => rendered.result.current.confirmReset(3))
    advance(10_000)
    act(() => rendered.result.current.requestReset())

    act(() => rendered.result.current.concludeTerminatedSession())

    const submission = rendered.result.current.buildSubmission()
    expect(submission.completedProtocol).toBe(false)
    expect(submission.antiLoopTerminated).toBe(true)
  })
})

describe('useGuidedSessionV2 endurance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-23T12:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('records the real attempt duration when a full stop ends the measured attempt', () => {
    const rendered = setup({ sessionType: 'endurance', targetMs: 210_000 })

    act(() => rendered.result.current.startSession())
    advance(300_000)
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
    advance(167_000)

    expect(rendered.result.current.attemptMs).toBeGreaterThanOrEqual(167_000)
    expect(rendered.result.current.attemptPassedTarget).toBe(false)

    act(() => rendered.result.current.endAttemptByFullStop())

    expect(rendered.result.current.stage).toBe('summary')
    expect(rendered.result.current.attemptEndReason).toBe('full_stop')

    const submission = rendered.result.current.buildSubmission()
    expect(submission.continuousAttemptMs).toBeGreaterThanOrEqual(167_000)
    expect(submission.continuousAttemptMs).toBeLessThan(170_000)
    expect(submission.completedProtocol).toBe(true)
  })

  it('does not offer a restart after the measured attempt ends', () => {
    const rendered = setup({ sessionType: 'endurance', targetMs: 210_000 })

    act(() => rendered.result.current.startSession())
    advance(300_000)
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
    advance(167_000)
    act(() => rendered.result.current.endAttemptByFullStop())

    const attemptAfterStop = rendered.result.current.attemptMs
    advance(120_000)
    act(() => rendered.result.current.endAttemptByFullStop())

    expect(rendered.result.current.stage).toBe('summary')
    expect(rendered.result.current.remainderMode).toBe(false)
    expect(rendered.result.current.attemptMs).toBe(attemptAfterStop)
  })

  it('flags a reached target and keeps the attempt duration at conclusion', () => {
    const rendered = setup({ sessionType: 'endurance', targetMs: 120_000 })

    act(() => rendered.result.current.startSession())
    advance(300_000)
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
    advance(150_000)

    expect(rendered.result.current.attemptPassedTarget).toBe(true)

    act(() => rendered.result.current.endAttemptAtTarget())

    expect(rendered.result.current.attemptEndReason).toBe('target_reached')
    expect(rendered.result.current.buildSubmission().continuousAttemptMs).toBeGreaterThanOrEqual(
      150_000
    )
  })

  it('allows a Control-style remainder that is not a second progression test', () => {
    const rendered = setup({ sessionType: 'endurance', targetMs: 210_000 })

    act(() => rendered.result.current.startSession())
    advance(300_000)
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
    advance(60_000)
    act(() => rendered.result.current.endAttemptByFullStop())
    const measuredAttempt = rendered.result.current.buildSubmission().continuousAttemptMs

    act(() => rendered.result.current.enterRemainderMode())
    advance(90_000)
    act(() => rendered.result.current.endRemainder())

    const submission = rendered.result.current.buildSubmission()
    expect(rendered.result.current.remainderMode).toBe(true)
    expect(submission.continuousAttemptMs).toBe(measuredAttempt)
    expect(submission.longestContinuousBlockMs).toBeGreaterThanOrEqual(90_000)
  })
})

describe('useGuidedSessionV2 baseline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requires the standardized setup before it records a valid measurement', () => {
    const rendered = setup({ sessionType: 'baseline', prepSeconds: 0 })

    act(() => rendered.result.current.startSession())
    expect(rendered.result.current.stage).toBe('not_started')

    act(() => rendered.result.current.startBaseline())
    advance(90_000)
    act(() => rendered.result.current.endBaseline('full_stop'))

    const submission = rendered.result.current.buildSubmission()
    expect(submission.standardized).toBe(false)
    expect(submission.continuousAttemptMs).toBeGreaterThanOrEqual(90_000)
  })

  it('records a standardized hand measurement that ends at ejaculation', () => {
    const rendered = setup({ sessionType: 'baseline', prepSeconds: 0 })

    act(() => rendered.result.current.startSession())
    act(() => {
      rendered.result.current.setPrecheck({
        noPorn: true,
        lubeUsed: true,
        normalTechnique: true,
        handStimulus: true,
      })
    })
    act(() => rendered.result.current.startBaseline())
    advance(240_000)
    act(() => rendered.result.current.endBaseline('ejaculation'))

    const submission = rendered.result.current.buildSubmission()
    expect(rendered.result.current.stage).toBe('summary')
    expect(rendered.result.current.baselineEndReason).toBe('ejaculation')
    expect(submission.standardized).toBe(true)
    expect(submission.lubeUsed).toBe(true)
    expect(submission.pornUsed).toBe(false)
    expect(submission.ejaculationOutcome).toBe('during_training')
    expect(submission.continuousAttemptMs).toBeGreaterThanOrEqual(240_000)
  })

  it('marks a non-hand baseline as not standardized', () => {
    const rendered = setup({ sessionType: 'baseline', prepSeconds: 0 })

    act(() => rendered.result.current.startSession())
    act(() => {
      rendered.result.current.setPrecheck({ noPorn: true, lubeUsed: true, normalTechnique: true })
      rendered.result.current.setPrecheck({ handStimulus: false })
    })
    act(() => rendered.result.current.startBaseline())
    advance(60_000)
    act(() => rendered.result.current.endBaseline('full_stop'))

    expect(rendered.result.current.buildSubmission().standardized).toBe(false)
  })
})

describe('useGuidedSessionV2 non-progression session types', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T12:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs a Reset session as a six minute breathing block that is not a training session', () => {
    const rendered = setup({ sessionType: 'reset', prepSeconds: 0 })

    act(() => rendered.result.current.startSession())
    expect(rendered.result.current.stage).toBe('main')

    advance(360_000)
    act(() => rendered.result.current.completeSimpleSession())

    const submission = rendered.result.current.buildSubmission()
    expect(rendered.result.current.stage).toBe('summary')
    expect(submission.completedProtocol).toBe(false)
    expect(submission.longestContinuousBlockMs).toBeNull()
  })

  it('keeps a Transfer session on the device track', () => {
    const rendered = setup({ sessionType: 'transfer', prepSeconds: 120 })

    act(() => rendered.result.current.startSession())
    expect(rendered.result.current.stage).toBe('prep')

    advance(120_000)
    act(() => rendered.result.current.beginMainBlock({ prepCompleted: true }))
    advance(150_000)
    act(() => rendered.result.current.completeControl())

    const submission = rendered.result.current.buildSubmission()
    expect(submission.sessionType).toBe('transfer')
    expect(submission.stimulusType).toBe('sleeve')
    expect(submission.continuousAttemptMs).toBeNull()
    expect(submission.longestContinuousBlockMs).toBeGreaterThanOrEqual(150_000)
  })
})
