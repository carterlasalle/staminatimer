/**
 * Guided Program V2 protocol.
 *
 * This module is the single source of truth for Guided Program V2 rules:
 * scheduling, the continuous target ladder, progression gates, session
 * prescriptions, transfer (device) tracks, and rescue/anti-edging rules.
 *
 * It is pure TypeScript with no React, no Supabase, and no UI concerns so the
 * same rules can be unit tested directly and mirrored by the database
 * `record_program_v2_session` function. The UI must render protocol state
 * rather than re-implement it.
 */

export const PROTOCOL_VERSION = 2

export type GuidedSessionType = 'control' | 'reset' | 'endurance' | 'easy' | 'baseline' | 'transfer'

/** Session types that may produce a progression observation for the hand target. */
export type ProgressionSessionType = Extract<
  GuidedSessionType,
  'control' | 'endurance' | 'baseline'
>

export type ProgramStatus = 'active' | 'maintenance'

export type StimulusType = 'hand' | 'sleeve'

export type EjaculationOutcome = 'none' | 'during_training' | 'intentional_after'

export type BreathingMaintained = 'yes' | 'mostly' | 'no'

/** Rough self-reported baseline, used only to place a brand-new user conservatively. */
export type InitialBaselineBucket = 'under_2' | '2_3' | '3_5' | '5_plus' | 'unknown'

/* ------------------------------------------------------------------------- */
/* Scheduling                                                                 */
/* ------------------------------------------------------------------------- */

/** Ordered weekly plan used by the dashboard. Index 0 = Monday. */
export const WEEKLY_PLAN = [
  { day: 'Monday', sessionType: 'control', optional: false },
  { day: 'Tuesday', sessionType: 'reset', optional: false },
  { day: 'Wednesday', sessionType: 'endurance', optional: false },
  { day: 'Thursday', sessionType: 'reset', optional: false },
  { day: 'Friday', sessionType: 'control', optional: false },
  { day: 'Saturday', sessionType: 'easy', optional: true },
  { day: 'Sunday', sessionType: 'baseline', optional: false },
] as const satisfies ReadonlyArray<{
  day: string
  sessionType: GuidedSessionType
  optional: boolean
}>

/**
 * Resolve the prescribed session for a local calendar day.
 *
 * Calendar dates never force advancement or backlog: if a day is missed the
 * user simply continues with the next scheduled day.
 */
export function getScheduledSessionType(date: Date = new Date()): GuidedSessionType {
  const mondayFirstIndex = (date.getDay() + 6) % 7

  return WEEKLY_PLAN[mondayFirstIndex].sessionType
}

/** UTC-midnight-safe key for the browser's local calendar day (`YYYY-MM-DD`). */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Monday-first index (0 = Monday) for the local calendar day. */
export function getMondayFirstDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7
}

/* ------------------------------------------------------------------------- */
/* Target ladder                                                              */
/* ------------------------------------------------------------------------- */

/** Continuous-target ladder in milliseconds. 10:00 is the top of the ladder. */
export const TARGET_LADDER_MS: ReadonlyArray<number> = [
  120_000, // 2:00
  150_000, // 2:30
  180_000, // 3:00
  210_000, // 3:30
  240_000, // 4:00
  270_000, // 4:30
  300_000, // 5:00
  360_000, // 6:00
  420_000, // 7:00
  480_000, // 8:00
  540_000, // 9:00
  600_000, // 10:00
]

export const FIVE_MINUTE_CHECKPOINT_MS = 300_000

export const MAX_TARGET_MS = 600_000

/** Range the user should spend most training time in during a Control block. */
export const TARGET_AROUSAL_RANGE = { min: 4, max: 6 } as const

/** Arousal band a rescue must genuinely fall back to before resuming. */
export const RESCUE_RESET_AROUSAL_RANGE = { min: 3, max: 4 } as const

/** Maximum rescue stops permitted inside a single Control session. */
export const CONTROL_MAX_RESCUE_STOPS = 3

/** A block shorter than this, ended by a rescue, counts as a "rapid" rescue. */
export const RESCUE_LOOP_ACTIVE_MS = 120_000

export const RESCUE_LOOP_RAPID_RESCUES = 2

export function getNextTarget(currentTargetMs: number): number | null {
  for (const target of TARGET_LADDER_MS) {
    if (target > currentTargetMs) {
      return target
    }
  }

  return null
}

/**
 * The continuous target currently being trained.
 *
 * The stored value is authoritative (the database constrains it to the ladder).
 * This normalizes anything off-ladder down to the nearest legal rung so the
 * protocol module never exposes a target the ladder does not contain.
 */
export function getCurrentTarget(progress: { currentTargetMs: number | null | undefined }): number {
  const stored = progress.currentTargetMs ?? 0

  if (TARGET_LADDER_MS.includes(stored)) {
    return stored
  }

  const lowerRungs = TARGET_LADDER_MS.filter((target) => target <= stored)

  return lowerRungs.length > 0 ? lowerRungs[lowerRungs.length - 1] : TARGET_LADDER_MS[0]
}

/** Conservative initial placement from a self-reported baseline bucket. */
export function getInitialTargetForBucket(bucket: InitialBaselineBucket): number {
  switch (bucket) {
    case 'under_2':
      return 120_000
    case '2_3':
      return 150_000
    case '3_5':
      return 210_000
    case '5_plus':
      // Never jump above the 5:00 checkpoint on self-report alone.
      return FIVE_MINUTE_CHECKPOINT_MS
    case 'unknown':
    default:
      return 120_000
  }
}

export function formatTarget(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) {
    return '--:--'
  }

  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/* ------------------------------------------------------------------------- */
/* Progression gate                                                           */
/* ------------------------------------------------------------------------- */

export type ProgressionRequirement = {
  /** How many of the most recent valid observations are examined. */
  requiredObservations: number
  /** How many of those must meet or exceed the current target. */
  requiredPasses: number
  /** How many passing observations must be Endurance and/or Baseline. */
  requiredStrictPasses: number
}

export type ProgressionObservation = {
  sessionType: GuidedSessionType
  durationMs: number
}

export type ProgressionGateState = {
  requirement: ProgressionRequirement
  observationCount: number
  passCount: number
  strictPassCount: number
  hasEnoughObservations: boolean
  shouldAdvance: boolean
  passesRemaining: number
  strictPassesRemaining: number
  /** Target advanced to when the gate is satisfied, otherwise null. */
  advanceToTargetMs: number | null
  /** True when the gate is satisfied at the 10:00 top of the ladder. */
  maintenanceReached: boolean
}

const STANDARD_REQUIREMENT: ProgressionRequirement = {
  requiredObservations: 4,
  requiredPasses: 3,
  requiredStrictPasses: 1,
}

const FIVE_MINUTE_REQUIREMENT: ProgressionRequirement = {
  requiredObservations: 5,
  requiredPasses: 4,
  requiredStrictPasses: 2,
}

/**
 * The 5:00 checkpoint deliberately demands more evidence than the rest of the
 * ladder: five-minute control must be genuinely repeatable before moving on.
 */
export function getProgressionRequirement(targetMs: number): ProgressionRequirement {
  if (targetMs === FIVE_MINUTE_CHECKPOINT_MS) {
    return FIVE_MINUTE_REQUIREMENT
  }

  return STANDARD_REQUIREMENT
}

/**
 * Evaluate the rolling progression gate for a target.
 *
 * `observations` must already be limited to progression-eligible observations
 * for this target, newest first.
 */
export function evaluateProgressionGate({
  targetMs,
  observations,
}: {
  targetMs: number
  observations: ReadonlyArray<ProgressionObservation>
}): ProgressionGateState {
  const requirement = getProgressionRequirement(targetMs)
  const window = observations.slice(0, requirement.requiredObservations)

  let passCount = 0
  let strictPassCount = 0

  for (const observation of window) {
    if (observation.durationMs >= targetMs) {
      passCount += 1

      if (observation.sessionType === 'endurance' || observation.sessionType === 'baseline') {
        strictPassCount += 1
      }
    }
  }

  const hasEnoughObservations = window.length >= requirement.requiredObservations

  const shouldAdvance =
    hasEnoughObservations &&
    passCount >= requirement.requiredPasses &&
    strictPassCount >= requirement.requiredStrictPasses

  const nextTarget = getNextTarget(targetMs)

  return {
    requirement,
    observationCount: window.length,
    passCount,
    strictPassCount,
    hasEnoughObservations,
    shouldAdvance,
    passesRemaining: Math.max(0, requirement.requiredPasses - passCount),
    strictPassesRemaining: Math.max(0, requirement.requiredStrictPasses - strictPassCount),
    advanceToTargetMs: shouldAdvance ? nextTarget : null,
    maintenanceReached: shouldAdvance && nextTarget === null,
  }
}

/** The duration a session contributes as its progression observation. */
export function getObservationDurationMs(input: {
  sessionType: GuidedSessionType
  longestContinuousBlockMs?: number | null
  continuousAttemptMs?: number | null
}): number | null {
  if (input.sessionType === 'control') {
    return input.longestContinuousBlockMs ?? null
  }

  if (input.sessionType === 'endurance' || input.sessionType === 'baseline') {
    return input.continuousAttemptMs ?? null
  }

  return null
}

export type ProgressionEligibilityInput = {
  sessionType: GuidedSessionType
  completedProtocol?: boolean
  antiLoopTerminated?: boolean
  rescueStopCount?: number
  standardized?: boolean
  stimulusType?: StimulusType
  lubeUsed?: boolean
  pornUsed?: boolean
  observationDurationMs?: number | null
  /** True when an eligible observation already counted on this local date. */
  alreadyCountedToday?: boolean
}

/**
 * Server-side eligibility rules, mirrored by the database RPC. The client may
 * not assert eligibility itself.
 */
export function isProgressionEligible(input: ProgressionEligibilityInput): boolean {
  if (input.alreadyCountedToday) {
    return false
  }

  if (
    input.sessionType === 'reset' ||
    input.sessionType === 'easy' ||
    input.sessionType === 'transfer'
  ) {
    return false
  }

  const duration = input.observationDurationMs ?? null

  if (duration === null || !Number.isFinite(duration) || duration < 0) {
    return false
  }

  if (input.sessionType === 'control') {
    return (
      input.completedProtocol === true &&
      input.antiLoopTerminated !== true &&
      (input.rescueStopCount ?? 0) <= CONTROL_MAX_RESCUE_STOPS
    )
  }

  if (input.sessionType === 'endurance') {
    return input.completedProtocol === true
  }

  if (input.sessionType === 'baseline') {
    return (
      input.standardized === true &&
      input.stimulusType === 'hand' &&
      input.lubeUsed === true &&
      input.pornUsed !== true
    )
  }

  return false
}

/* ------------------------------------------------------------------------- */
/* Rescue / anti-edging rules                                                 */
/* ------------------------------------------------------------------------- */

/**
 * A "rapid" rescue is one that ends a continuous block shorter than
 * `RESCUE_LOOP_ACTIVE_MS` of active stimulation. Two of those in a row mean the
 * session is turning into repeated edge/recovery cycles rather than training.
 */
export function countRapidRescues(
  blockDurationsMs: ReadonlyArray<number>,
  thresholdMs: number = RESCUE_LOOP_ACTIVE_MS
): number {
  return blockDurationsMs.filter((duration) => duration < thresholdMs).length
}

export function isRescueLoop(
  blockDurationsMs: ReadonlyArray<number>,
  thresholdMs: number = RESCUE_LOOP_ACTIVE_MS
): boolean {
  return countRapidRescues(blockDurationsMs, thresholdMs) >= RESCUE_LOOP_RAPID_RESCUES
}

/* ------------------------------------------------------------------------- */
/* Session prescriptions                                                      */
/* ------------------------------------------------------------------------- */

export type SessionPrescription = {
  type: GuidedSessionType
  label: string
  /** One-line framing shown on the dashboard card. */
  summary: string
  /** Concise instruction shown when the session starts. */
  instruction: string
  /** Breathing / relaxation preparation length, seconds. 0 = none. */
  prepSeconds: number
  /** Structured main block minimum / maximum, seconds. */
  mainMinSeconds: number
  mainMaxSeconds: number
  countsTowardProgression: boolean
  optional: boolean
}

const PRESCRIPTIONS: Record<GuidedSessionType, Omit<SessionPrescription, 'type'>> = {
  control: {
    label: 'Control',
    summary: 'Build continuous control around moderate arousal.',
    instruction:
      '5 min slow breathing. Then 12-15 min. Stay around 4-6/10. Acceleration -> slow and continue. If slowing is not enough -> full stop until genuinely back around 3-4/10. Track longest continuous block and rescue stops.',
    prepSeconds: 5 * 60,
    mainMinSeconds: 12 * 60,
    mainMaxSeconds: 15 * 60,
    countsTowardProgression: true,
    optional: false,
  },
  reset: {
    label: 'Reset',
    summary: 'Six minutes of breathing and lower-body relaxation. Not a training session.',
    instruction:
      'Six minutes. Roughly 4 second inhale, 6 second exhale. Let the lower abdomen, glutes, inner thighs and pelvic floor soften. Do not strain, push, or hold hard contractions.',
    prepSeconds: 0,
    mainMinSeconds: 6 * 60,
    mainMaxSeconds: 6 * 60,
    countsTowardProgression: false,
    optional: false,
  },
  endurance: {
    label: 'Endurance',
    summary: 'One serious continuous attempt at your current target.',
    instruction:
      '5 min breathing prep, then one continuous attempt. Slowing while continuing is allowed. A full stop ends the measured attempt.',
    prepSeconds: 5 * 60,
    mainMinSeconds: 0,
    mainMaxSeconds: 0,
    countsTowardProgression: true,
    optional: false,
  },
  easy: {
    label: 'Easy / Optional',
    summary: 'Low-pressure practice. Skipping is completely fine.',
    instruction:
      '10-15 minutes, no target and no score. Moderate arousal. Slowing is preferred over stopping. If it becomes repeated rescue cycling, conclude normally.',
    prepSeconds: 0,
    mainMinSeconds: 10 * 60,
    mainMaxSeconds: 15 * 60,
    countsTowardProgression: false,
    optional: true,
  },
  baseline: {
    label: 'Baseline',
    summary: 'Standardized continuous measurement with no full stops.',
    instruction:
      'Standardized measurement. No porn or erotic imagery, lube used, normal comfortable technique, hand stimulus. Keep stimulation continuous until the natural endpoint. Full stops and long artificial pauses end the measurement.',
    prepSeconds: 0,
    mainMinSeconds: 0,
    mainMaxSeconds: 0,
    countsTowardProgression: true,
    optional: false,
  },
  transfer: {
    label: 'Transfer',
    summary: 'Device / sleeve practice on a separate track from the hand target.',
    instruction:
      'Separate transfer track. A harder, more realistic stimulus may temporarily shorten duration; that is expected and is not regression. Sleeve results never advance the hand target.',
    prepSeconds: 2 * 60,
    mainMinSeconds: 0,
    mainMaxSeconds: 0,
    countsTowardProgression: false,
    optional: true,
  },
}

export function getSessionPrescription(sessionType: GuidedSessionType): SessionPrescription {
  const base = PRESCRIPTIONS[sessionType]

  return { type: sessionType, ...base }
}

/* ------------------------------------------------------------------------- */
/* Transfer track                                                             */
/* ------------------------------------------------------------------------- */

export type TransferUnlockState = {
  unlocked: boolean
  reason: string
  handTargetMs: number
  suggestedSleeveTargetMs: number
}

/** Conservative initial device target: ~50% of the hand target, min 1:00. */
export function getSuggestedSleeveTargetMs(handTargetMs: number): number {
  const half = Math.floor(handTargetMs / 2)
  const rounded = Math.floor(half / 30_000) * 30_000

  return Math.max(60_000, rounded)
}

/**
 * Transfer unlocks once the 5:00 hand checkpoint has been established, i.e.
 * the user has advanced past it (or reached maintenance). Self-report alone can
 * never unlock transfer.
 */
export function getTransferUnlockState(progress: {
  currentTargetMs: number
  status: ProgramStatus
}): TransferUnlockState {
  const handTargetMs = progress.currentTargetMs
  const unlocked = progress.status === 'maintenance' || handTargetMs > FIVE_MINUTE_CHECKPOINT_MS

  return {
    unlocked,
    reason: unlocked
      ? 'The 5:00 hand checkpoint is established, so transfer practice is available on its own track.'
      : 'Transfer unlocks after the 5:00 hand checkpoint is established. It is never required for hand progression.',
    handTargetMs,
    suggestedSleeveTargetMs: getSuggestedSleeveTargetMs(handTargetMs),
  }
}

/* ------------------------------------------------------------------------- */
/* Dashboard trend helpers                                                    */
/* ------------------------------------------------------------------------- */

export type TrendPoint = {
  at: string
  durationMs: number
  label?: string
}

export type RollingTrend = {
  direction: 'up' | 'down' | 'flat'
  deltaMs: number
}

/** Least-squares-free rolling trend: compare recent average to prior average. */
export function getRollingTrend(valuesMs: ReadonlyArray<number>): RollingTrend {
  if (valuesMs.length < 2) {
    return { direction: 'flat', deltaMs: 0 }
  }

  const half = Math.floor(valuesMs.length / 2)
  const older = valuesMs.slice(0, half)
  const recent = valuesMs.slice(valuesMs.length - half)

  const average = (values: number[]) =>
    values.reduce((total, value) => total + value, 0) / Math.max(1, values.length)

  const deltaMs = Math.round(average(recent) - average(older))
  const threshold = 5_000

  return {
    direction: deltaMs > threshold ? 'up' : deltaMs < -threshold ? 'down' : 'flat',
    deltaMs,
  }
}

/** Buckets used for the "days since last ejaculation" context, never a rule. */
export const EJACULATION_CONTEXT_BUCKETS: ReadonlyArray<{
  key: string
  label: string
  min: number
  max: number | null
}> = [
  { key: '0-2', label: '0-2 days since', min: 0, max: 2 },
  { key: '3-5', label: '3-5 days since', min: 3, max: 5 },
  { key: '6+', label: '6+ days since', min: 6, max: null },
]

export function getEjaculationContextBucket(daysSince: number | null | undefined): string | null {
  if (daysSince === null || daysSince === undefined || !Number.isFinite(daysSince)) {
    return null
  }

  const bucket = EJACULATION_CONTEXT_BUCKETS.find(
    (candidate) =>
      daysSince >= candidate.min && (candidate.max === null || daysSince <= candidate.max)
  )

  return bucket?.key ?? null
}
