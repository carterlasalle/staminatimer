import { describe, expect, it } from 'vitest'
import {
  CONTROL_MAX_RESCUE_STOPS,
  FIVE_MINUTE_CHECKPOINT_MS,
  MAX_TARGET_MS,
  RESCUE_LOOP_ACTIVE_MS,
  TARGET_LADDER_MS,
  countRapidRescues,
  evaluateProgressionGate,
  getCurrentTarget,
  getEjaculationContextBucket,
  getInitialTargetForBucket,
  getLocalDateKey,
  getNextTarget,
  getObservationDurationMs,
  getProgressionRequirement,
  getRollingTrend,
  getScheduledSessionType,
  getSessionPrescription,
  getSuggestedSleeveTargetMs,
  getTransferUnlockState,
  isProgressionEligible,
  isRescueLoop,
  type GuidedSessionType,
  type ProgressionObservation,
} from './protocol-v2'

/** Build a local-noon Date so the local calendar day is unambiguous. */
function localDate(isoDay: string): Date {
  const [year, month, day] = isoDay.split('-').map((part) => Number.parseInt(part, 10))

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function observations(entries: Array<[GuidedSessionType, number]>): ProgressionObservation[] {
  return entries.map(([sessionType, durationMs]) => ({ sessionType, durationMs }))
}

describe('scheduling', () => {
  it('prescribes Control on Monday', () => {
    // 2026-09-21 is a Monday.
    expect(getScheduledSessionType(localDate('2026-09-21'))).toBe('control')
  })

  it('prescribes Reset on Tuesday', () => {
    expect(getScheduledSessionType(localDate('2026-09-22'))).toBe('reset')
  })

  it('prescribes Endurance on Wednesday', () => {
    expect(getScheduledSessionType(localDate('2026-09-23'))).toBe('endurance')
  })

  it('prescribes Reset on Thursday', () => {
    expect(getScheduledSessionType(localDate('2026-09-24'))).toBe('reset')
  })

  it('prescribes Control on Friday', () => {
    expect(getScheduledSessionType(localDate('2026-09-25'))).toBe('control')
  })

  it('prescribes Easy on Saturday', () => {
    expect(getScheduledSessionType(localDate('2026-09-26'))).toBe('easy')
  })

  it('prescribes Baseline on Sunday', () => {
    expect(getScheduledSessionType(localDate('2026-09-27'))).toBe('baseline')
  })

  it('uses the browser-local calendar day, not UTC', () => {
    // 23:30 local on a Monday stays Monday even where UTC has rolled over.
    const mondayLate = new Date(2026, 8, 21, 23, 30, 0, 0)
    expect(getScheduledSessionType(mondayLate)).toBe('control')
    expect(getLocalDateKey(mondayLate)).toBe('2026-09-21')
  })
})

describe('target ladder', () => {
  it('walks the full ladder one step at a time', () => {
    expect(getNextTarget(120_000)).toBe(150_000)
    expect(getNextTarget(150_000)).toBe(180_000)
    expect(getNextTarget(180_000)).toBe(210_000)
    expect(getNextTarget(210_000)).toBe(240_000)
    expect(getNextTarget(240_000)).toBe(270_000)
    expect(getNextTarget(270_000)).toBe(FIVE_MINUTE_CHECKPOINT_MS)
    expect(getNextTarget(FIVE_MINUTE_CHECKPOINT_MS)).toBe(360_000)
    expect(getNextTarget(360_000)).toBe(420_000)
    expect(getNextTarget(420_000)).toBe(480_000)
    expect(getNextTarget(480_000)).toBe(540_000)
    expect(getNextTarget(540_000)).toBe(MAX_TARGET_MS)
  })

  it('has no target above 10:00', () => {
    expect(getNextTarget(MAX_TARGET_MS)).toBeNull()
    expect(Math.max(...TARGET_LADDER_MS)).toBe(MAX_TARGET_MS)
  })

  it('places new users conservatively and never above the 5:00 checkpoint on self-report', () => {
    expect(getInitialTargetForBucket('under_2')).toBe(120_000)
    expect(getInitialTargetForBucket('2_3')).toBe(150_000)
    expect(getInitialTargetForBucket('3_5')).toBe(210_000)
    expect(getInitialTargetForBucket('5_plus')).toBe(FIVE_MINUTE_CHECKPOINT_MS)
    expect(getInitialTargetForBucket('unknown')).toBe(120_000)
  })

  it('reads the stored current target when it is on the ladder', () => {
    expect(getCurrentTarget({ currentTargetMs: 240_000 })).toBe(240_000)
    expect(getCurrentTarget({ currentTargetMs: MAX_TARGET_MS })).toBe(MAX_TARGET_MS)
  })

  it('normalizes an off-ladder stored target down to the nearest legal rung', () => {
    expect(getCurrentTarget({ currentTargetMs: 260_000 })).toBe(240_000)
    expect(getCurrentTarget({ currentTargetMs: 121_000 })).toBe(120_000)
    expect(getCurrentTarget({ currentTargetMs: 900_000 })).toBe(MAX_TARGET_MS)
  })

  it('falls back to the bottom rung when no target is stored', () => {
    expect(getCurrentTarget({ currentTargetMs: null })).toBe(120_000)
    expect(getCurrentTarget({ currentTargetMs: undefined })).toBe(120_000)
  })
})

describe('progression requirement', () => {
  it('uses 3-of-4 below the 5:00 checkpoint', () => {
    expect(getProgressionRequirement(240_000)).toEqual({
      requiredObservations: 4,
      requiredPasses: 3,
      requiredStrictPasses: 1,
    })
  })

  it('uses the stricter 4-of-5 rule at the 5:00 checkpoint', () => {
    expect(getProgressionRequirement(FIVE_MINUTE_CHECKPOINT_MS)).toEqual({
      requiredObservations: 5,
      requiredPasses: 4,
      requiredStrictPasses: 2,
    })
  })

  it('uses 3-of-4 above the 5:00 checkpoint', () => {
    expect(getProgressionRequirement(420_000)).toEqual({
      requiredObservations: 4,
      requiredPasses: 3,
      requiredStrictPasses: 1,
    })
  })
})

describe('gate below 5:00', () => {
  const target = 240_000

  it('advances on 3 of 4 passes with one strict pass', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['control', 253_000],
        ['endurance', 248_000],
        ['control', 221_000],
        ['control', 262_000],
      ]),
    })

    expect(gate.passCount).toBe(3)
    expect(gate.strictPassCount).toBe(1)
    expect(gate.shouldAdvance).toBe(true)
    expect(gate.advanceToTargetMs).toBe(270_000)
  })

  it('does not advance on 2 of 4 passes', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['baseline', 253_000],
        ['control', 248_000],
        ['control', 221_000],
        ['control', 200_000],
      ]),
    })

    expect(gate.passCount).toBe(2)
    expect(gate.shouldAdvance).toBe(false)
  })

  it('does not advance on 3 of 4 passes with no strict pass', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['control', 253_000],
        ['control', 248_000],
        ['control', 262_000],
        ['control', 200_000],
      ]),
    })

    expect(gate.passCount).toBe(3)
    expect(gate.strictPassCount).toBe(0)
    expect(gate.shouldAdvance).toBe(false)
  })

  it('does not advance with fewer than 4 observations', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['endurance', 253_000],
        ['control', 248_000],
        ['control', 262_000],
      ]),
    })

    expect(gate.hasEnoughObservations).toBe(false)
    expect(gate.shouldAdvance).toBe(false)
  })

  it('only counts the newest four observations', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['control', 200_000],
        ['control', 200_000],
        ['control', 262_000],
        ['endurance', 262_000],
        ['control', 262_000],
      ]),
    })

    expect(gate.observationCount).toBe(4)
    expect(gate.passCount).toBe(2)
    expect(gate.shouldAdvance).toBe(false)
  })
})

describe('5:00 checkpoint lock', () => {
  const target = FIVE_MINUTE_CHECKPOINT_MS

  it('advances on 4 of 5 passes with two strict passes', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['baseline', 305_000],
        ['endurance', 312_000],
        ['control', 306_000],
        ['control', 301_000],
        ['control', 260_000],
      ]),
    })

    expect(gate.passCount).toBe(4)
    expect(gate.strictPassCount).toBe(2)
    expect(gate.shouldAdvance).toBe(true)
    expect(gate.advanceToTargetMs).toBe(360_000)
  })

  it('does not advance on 3 of 5 passes', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['baseline', 305_000],
        ['endurance', 312_000],
        ['control', 306_000],
        ['control', 260_000],
        ['control', 250_000],
      ]),
    })

    expect(gate.passCount).toBe(3)
    expect(gate.shouldAdvance).toBe(false)
  })

  it('does not advance on 4 of 5 passes with only one strict pass', () => {
    const gate = evaluateProgressionGate({
      targetMs: target,
      observations: observations([
        ['endurance', 305_000],
        ['control', 312_000],
        ['control', 306_000],
        ['control', 301_000],
        ['control', 260_000],
      ]),
    })

    expect(gate.passCount).toBe(4)
    expect(gate.strictPassCount).toBe(1)
    expect(gate.shouldAdvance).toBe(false)
  })
})

describe('gate above 5:00', () => {
  it('advances exactly one target on 3 of 4 with a strict pass', () => {
    const gate = evaluateProgressionGate({
      targetMs: 480_000,
      observations: observations([
        ['baseline', 481_000],
        ['control', 500_000],
        ['control', 490_000],
        ['control', 400_000],
      ]),
    })

    expect(gate.shouldAdvance).toBe(true)
    expect(gate.advanceToTargetMs).toBe(540_000)
  })

  it('never skips multiple targets on one exceptional session', () => {
    const gate = evaluateProgressionGate({
      targetMs: 420_000,
      observations: observations([
        ['endurance', 900_000],
        ['control', 900_000],
        ['baseline', 900_000],
        ['control', 900_000],
      ]),
    })

    expect(gate.shouldAdvance).toBe(true)
    expect(gate.advanceToTargetMs).toBe(480_000)
  })

  it('reports maintenance at the top of the ladder instead of an 11th target', () => {
    const gate = evaluateProgressionGate({
      targetMs: MAX_TARGET_MS,
      observations: observations([
        ['baseline', 620_000],
        ['control', 640_000],
        ['endurance', 700_000],
        ['control', 300_000],
      ]),
    })

    expect(gate.shouldAdvance).toBe(true)
    expect(gate.advanceToTargetMs).toBeNull()
    expect(gate.maintenanceReached).toBe(true)
  })
})

describe('observation duration selection', () => {
  it('uses the longest continuous block for Control', () => {
    expect(
      getObservationDurationMs({
        sessionType: 'control',
        longestContinuousBlockMs: 222_000,
        continuousAttemptMs: 999_000,
      })
    ).toBe(222_000)
  })

  it('uses the uninterrupted attempt for Endurance and Baseline', () => {
    expect(
      getObservationDurationMs({ sessionType: 'endurance', continuousAttemptMs: 200_000 })
    ).toBe(200_000)
    expect(
      getObservationDurationMs({ sessionType: 'baseline', continuousAttemptMs: 250_000 })
    ).toBe(250_000)
  })

  it('never counts Reset, Easy, or Transfer', () => {
    expect(
      getObservationDurationMs({ sessionType: 'reset', continuousAttemptMs: 600_000 })
    ).toBeNull()
    expect(
      getObservationDurationMs({ sessionType: 'easy', continuousAttemptMs: 600_000 })
    ).toBeNull()
    expect(
      getObservationDurationMs({ sessionType: 'transfer', continuousAttemptMs: 600_000 })
    ).toBeNull()
  })
})

describe('progression eligibility', () => {
  it('accepts a normally completed Control block within the rescue cap', () => {
    expect(
      isProgressionEligible({
        sessionType: 'control',
        completedProtocol: true,
        antiLoopTerminated: false,
        rescueStopCount: 2,
        observationDurationMs: 210_000,
      })
    ).toBe(true)
  })

  it('rejects a Control block ended by a rescue loop', () => {
    expect(
      isProgressionEligible({
        sessionType: 'control',
        completedProtocol: true,
        antiLoopTerminated: true,
        rescueStopCount: 2,
        observationDurationMs: 260_000,
      })
    ).toBe(false)
  })

  it('rejects Control when the rescue cap was exceeded', () => {
    expect(
      isProgressionEligible({
        sessionType: 'control',
        completedProtocol: true,
        antiLoopTerminated: false,
        rescueStopCount: CONTROL_MAX_RESCUE_STOPS + 1,
        observationDurationMs: 260_000,
      })
    ).toBe(false)
  })

  it('accepts an Endurance attempt', () => {
    expect(
      isProgressionEligible({
        sessionType: 'endurance',
        completedProtocol: true,
        observationDurationMs: 250_000,
      })
    ).toBe(true)
  })

  it('rejects a Baseline that did not confirm the standardized setup', () => {
    expect(
      isProgressionEligible({
        sessionType: 'baseline',
        standardized: false,
        stimulusType: 'hand',
        lubeUsed: true,
        pornUsed: false,
        observationDurationMs: 250_000,
      })
    ).toBe(false)
    expect(
      isProgressionEligible({
        sessionType: 'baseline',
        standardized: true,
        stimulusType: 'hand',
        lubeUsed: true,
        pornUsed: true,
        observationDurationMs: 250_000,
      })
    ).toBe(false)
    expect(
      isProgressionEligible({
        sessionType: 'baseline',
        standardized: true,
        stimulusType: 'sleeve',
        lubeUsed: true,
        pornUsed: false,
        observationDurationMs: 250_000,
      })
    ).toBe(false)
  })

  it('accepts a properly standardized hand Baseline', () => {
    expect(
      isProgressionEligible({
        sessionType: 'baseline',
        standardized: true,
        stimulusType: 'hand',
        lubeUsed: true,
        pornUsed: false,
        observationDurationMs: 250_000,
      })
    ).toBe(true)
  })

  it('never counts Reset, Easy, or Transfer', () => {
    for (const sessionType of ['reset', 'easy', 'transfer'] as const) {
      expect(
        isProgressionEligible({
          sessionType,
          completedProtocol: true,
          observationDurationMs: 600_000,
        })
      ).toBe(false)
    }
  })

  it('allows only one progression-eligible observation per local day', () => {
    expect(
      isProgressionEligible({
        sessionType: 'control',
        completedProtocol: true,
        rescueStopCount: 0,
        observationDurationMs: 260_000,
        alreadyCountedToday: true,
      })
    ).toBe(false)
  })

  it('rejects a missing or negative observation duration', () => {
    expect(
      isProgressionEligible({
        sessionType: 'endurance',
        completedProtocol: true,
        observationDurationMs: null,
      })
    ).toBe(false)
    expect(
      isProgressionEligible({
        sessionType: 'endurance',
        completedProtocol: true,
        observationDurationMs: -1,
      })
    ).toBe(false)
  })
})

describe('rescue rules', () => {
  it('does not detect a loop from a single rapid rescue', () => {
    expect(countRapidRescues([45_000])).toBe(1)
    expect(isRescueLoop([45_000])).toBe(false)
  })

  it('detects a loop from two rapid rescues', () => {
    expect(isRescueLoop([45_000, RESCUE_LOOP_ACTIVE_MS - 1])).toBe(true)
  })

  it('does not detect a loop when a block was long', () => {
    expect(isRescueLoop([300_000, 45_000])).toBe(false)
  })

  it('treats a block at exactly the threshold as not rapid', () => {
    expect(isRescueLoop([RESCUE_LOOP_ACTIVE_MS, RESCUE_LOOP_ACTIVE_MS])).toBe(false)
  })

  it('caps Control rescue stops at three', () => {
    expect(CONTROL_MAX_RESCUE_STOPS).toBe(3)
  })
})

describe('session prescriptions', () => {
  it('marks only Easy and Transfer as optional and only Control/Endurance/Baseline as progression', () => {
    const progression = (
      ['control', 'reset', 'endurance', 'easy', 'baseline', 'transfer'] as const
    ).filter((type) => getSessionPrescription(type).countsTowardProgression)

    expect(progression).toEqual(['control', 'endurance', 'baseline'])

    const optional = (
      ['control', 'reset', 'endurance', 'easy', 'baseline', 'transfer'] as const
    ).filter((type) => getSessionPrescription(type).optional)

    expect(optional).toEqual(['easy', 'transfer'])
  })

  it('gives Control a 5 minute prep and a 12-15 minute main block', () => {
    const control = getSessionPrescription('control')
    expect(control.prepSeconds).toBe(300)
    expect(control.mainMinSeconds).toBe(720)
    expect(control.mainMaxSeconds).toBe(900)
  })

  it('gives Reset a six minute breathing block that is not training', () => {
    const reset = getSessionPrescription('reset')
    expect(reset.mainMinSeconds).toBe(360)
    expect(reset.countsTowardProgression).toBe(false)
  })
})

describe('transfer track', () => {
  it('stays locked until the user has advanced past the 5:00 checkpoint', () => {
    expect(getTransferUnlockState({ currentTargetMs: 120_000, status: 'active' }).unlocked).toBe(
      false
    )
    expect(
      getTransferUnlockState({ currentTargetMs: FIVE_MINUTE_CHECKPOINT_MS, status: 'active' })
        .unlocked
    ).toBe(false)
    expect(getTransferUnlockState({ currentTargetMs: 360_000, status: 'active' }).unlocked).toBe(
      true
    )
    expect(
      getTransferUnlockState({ currentTargetMs: MAX_TARGET_MS, status: 'maintenance' }).unlocked
    ).toBe(true)
  })

  it('suggests roughly half the hand target, rounded down to 30s with a 1:00 floor', () => {
    expect(getSuggestedSleeveTargetMs(300_000)).toBe(150_000)
    expect(getSuggestedSleeveTargetMs(360_000)).toBe(180_000)
    expect(getSuggestedSleeveTargetMs(240_000)).toBe(120_000)
    expect(getSuggestedSleeveTargetMs(120_000)).toBe(60_000)
  })
})

describe('trends and context', () => {
  it('reports an upward rolling trend', () => {
    expect(getRollingTrend([120_000, 130_000, 150_000, 160_000]).direction).toBe('up')
  })

  it('reports a downward rolling trend', () => {
    expect(getRollingTrend([160_000, 150_000, 130_000, 120_000]).direction).toBe('down')
  })

  it('reports a flat trend for a single observation', () => {
    expect(getRollingTrend([150_000])).toEqual({ direction: 'flat', deltaMs: 0 })
  })

  it('buckets days-since-ejaculation as neutral context only', () => {
    expect(getEjaculationContextBucket(0)).toBe('0-2')
    expect(getEjaculationContextBucket(2)).toBe('0-2')
    expect(getEjaculationContextBucket(4)).toBe('3-5')
    expect(getEjaculationContextBucket(11)).toBe('6+')
    expect(getEjaculationContextBucket(null)).toBeNull()
  })
})
