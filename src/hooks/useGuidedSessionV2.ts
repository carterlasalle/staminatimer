'use client'

import {
  CONTROL_MAX_RESCUE_STOPS,
  countRapidRescues,
  getLocalDateKey,
  TARGET_AROUSAL_RANGE,
  type GuidedSessionType,
} from '@/lib/program/protocol-v2'
import type { ProgramV2SessionInput, RescueEventInput } from '@/hooks/useProgramV2Progress'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from '@/lib/zod'

export type BlockClose = {
  longestContinuousBlockMs: number
  completedBlocksMs: number[]
}

export type GuidedStage =
  | 'not_started'
  | 'prep'
  | 'main'
  | 'accelerating'
  | 'rescue'
  | 'block_ended'
  | 'summary'

export type EnduranceEndReason = 'full_stop' | 'ejaculation' | 'target_reached' | null

export type BaselineEndReason = 'full_stop' | 'ejaculation' | null

export type ControlTerminationReason = 'rescue_loop' | 'max_rescues' | null

export type BaselinePrecheck = {
  noPorn: boolean
  lubeUsed: boolean
  normalTechnique: boolean
  handStimulus: boolean
}

type SessionSnapshot = {
  version: 2
  userId: string
  sessionType: GuidedSessionType
  localDate: string
  startedAt: string
  stage: GuidedStage
  stageStartedAtMs: number
  prepSeconds: number
  prepCompleted: boolean
  controlStyle: boolean
  blockStartMs: number | null
  completedBlocksMs: number[]
  rescuedBlockDurationsMs: number[]
  rescueEvents: RescueEventInput[]
  rescueStartedAtMs: number | null
  rescueArousalBefore: number | null
  rescueStopCount: number
  totalRescueMs: number
  mainActiveMs: number
  longestContinuousBlockMs: number
  timeInTargetRangeMs: number
  currentArousal: number
  highestArousal: number
  antiLoopTerminated: boolean
  terminationReason: ControlTerminationReason
  completedProtocol: boolean
  attemptStartedAtMs: number | null
  attemptEndedAtMs: number | null
  attemptEndReason: EnduranceEndReason
  baselineEndReason: BaselineEndReason
  remainderMode: boolean
  precheck: BaselinePrecheck
}

const STORAGE_KEY = 'program_v2_active_session'

const MAX_RESTORE_AGE_MS = 12 * 60 * 60 * 1000

const defaultPrecheck: BaselinePrecheck = {
  noPorn: false,
  lubeUsed: false,
  normalTechnique: false,
  handStimulus: true,
}

const rescueEventSchema = z.object({
  startedOffsetMs: z.number(),
  endedOffsetMs: z.number().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  arousalBefore: z.number().nullable().optional(),
  arousalAfter: z.number().nullable().optional(),
})

const baselinePrecheckSchema = z.object({
  noPorn: z.boolean(),
  lubeUsed: z.boolean(),
  normalTechnique: z.boolean(),
  handStimulus: z.boolean(),
})

const guidedStageSchema = z.enum([
  'not_started',
  'prep',
  'main',
  'accelerating',
  'rescue',
  'block_ended',
  'summary',
])

const guidedSessionTypeSchema = z.enum([
  'control',
  'reset',
  'endurance',
  'easy',
  'baseline',
  'transfer',
])

/**
 * The persisted snapshot is restored from localStorage, so it is parsed at that
 * boundary rather than asserted. A snapshot that does not match is discarded,
 * and elapsed time is still recomputed from real timestamps.
 */
const sessionSnapshotSchema = z.object({
  version: z.literal(2),
  userId: z.string(),
  sessionType: guidedSessionTypeSchema,
  localDate: z.string(),
  startedAt: z.string(),
  stage: guidedStageSchema,
  stageStartedAtMs: z.number(),
  prepSeconds: z.number(),
  prepCompleted: z.boolean(),
  controlStyle: z.boolean(),
  blockStartMs: z.number().nullable(),
  completedBlocksMs: z.array(z.number()),
  rescuedBlockDurationsMs: z.array(z.number()),
  rescueEvents: z.array(rescueEventSchema),
  rescueStartedAtMs: z.number().nullable(),
  rescueArousalBefore: z.number().nullable(),
  rescueStopCount: z.number(),
  totalRescueMs: z.number(),
  mainActiveMs: z.number(),
  longestContinuousBlockMs: z.number(),
  timeInTargetRangeMs: z.number(),
  currentArousal: z.number(),
  highestArousal: z.number(),
  antiLoopTerminated: z.boolean(),
  terminationReason: z.enum(['rescue_loop', 'max_rescues']).nullable(),
  completedProtocol: z.boolean(),
  attemptStartedAtMs: z.number().nullable(),
  attemptEndedAtMs: z.number().nullable(),
  attemptEndReason: z.enum(['full_stop', 'ejaculation', 'target_reached']).nullable(),
  baselineEndReason: z.enum(['full_stop', 'ejaculation']).nullable(),
  remainderMode: z.boolean(),
  precheck: baselinePrecheckSchema,
})

function readSnapshot(): SessionSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = sessionSnapshotSchema.safeParse(JSON.parse(raw))

    if (!parsed.success) {
      return null
    }

    const snapshot = parsed.data

    if (Date.now() - new Date(snapshot.startedAt).getTime() > MAX_RESTORE_AGE_MS) {
      return null
    }

    return snapshot
  } catch {
    return null
  }
}

function writeSnapshot(snapshot: SessionSnapshot | null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (snapshot === null) {
      window.localStorage.removeItem(STORAGE_KEY)

      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage is best-effort; losing it must never fabricate time.
  }
}

function createInitialSnapshot(
  userId: string,
  sessionType: GuidedSessionType,
  prepSeconds: number
): SessionSnapshot {
  const now = Date.now()

  return {
    version: 2,
    userId,
    sessionType,
    localDate: getLocalDateKey(new Date(now)),
    startedAt: new Date(now).toISOString(),
    stage: prepSeconds > 0 ? 'prep' : 'not_started',
    stageStartedAtMs: now,
    prepSeconds,
    prepCompleted: prepSeconds <= 0,
    controlStyle: sessionType === 'control' || sessionType === 'easy' || sessionType === 'transfer',
    blockStartMs: null,
    completedBlocksMs: [],
    rescuedBlockDurationsMs: [],
    rescueEvents: [],
    rescueStartedAtMs: null,
    rescueArousalBefore: null,
    rescueStopCount: 0,
    totalRescueMs: 0,
    mainActiveMs: 0,
    longestContinuousBlockMs: 0,
    timeInTargetRangeMs: 0,
    currentArousal: 1,
    highestArousal: 1,
    antiLoopTerminated: false,
    terminationReason: null,
    completedProtocol: false,
    attemptStartedAtMs: null,
    attemptEndedAtMs: null,
    attemptEndReason: null,
    baselineEndReason: null,
    remainderMode: false,
    precheck: defaultPrecheck,
  }
}

/**
 * The contract a guided-session view renders against. Declared explicitly so
 * consumers depend on a named interface rather than the hook's internals.
 */
export type GuidedSessionController = {
  stage: GuidedStage
  nowMs: number
  prepRemainingMs: number
  elapsedMainMs: number
  currentBlockMs: number
  attemptMs: number
  attemptPassedTarget: boolean
  rescueElapsedMs: number
  activeTargetMs: number
  completedBlocksMs: number[]
  longestContinuousBlockMs: number
  rescuedBlockDurationsMs: number[]
  rescueEvents: RescueEventInput[]
  rescueStopCount: number
  totalRescueMs: number
  timeInTargetRangeMs: number
  mainActiveMs: number
  highestArousal: number
  currentArousal: number
  precheck: BaselinePrecheck
  remainderMode: boolean
  terminationReason: ControlTerminationReason
  antiLoopTerminated: boolean
  attemptEndReason: EnduranceEndReason
  baselineEndReason: BaselineEndReason
  prepCompleted: boolean
  summaryRatings: SummaryRatings
  setSummaryRatings: (value: SummaryRatings | ((prev: SummaryRatings) => SummaryRatings)) => void
  startSession: () => void
  startPrep: () => void
  markPrepComplete: () => void
  beginMainBlock: (options: { prepCompleted: boolean }) => void
  setArousal: (rating: number) => void
  markSteady: () => void
  markAccelerating: () => void
  backInRange: () => void
  requestReset: () => void
  confirmReset: (arousal: 3 | 4) => void
  stillAboveFour: () => void
  completeControl: () => void
  concludeTerminatedSession: () => void
  endAttemptByFullStop: () => void
  endAttemptByEjaculation: () => void
  endAttemptAtTarget: () => void
  enterRemainderMode: () => void
  endRemainder: () => void
  setPrecheck: (patch: Partial<BaselinePrecheck>) => void
  startBaseline: () => void
  endBaseline: (reason: 'full_stop' | 'ejaculation') => void
  completeSimpleSession: () => void
  abandon: () => void
  buildSubmission: () => ProgramV2SessionInput
}

export type SummaryRatings = {
  controlRating: number
  breathingMaintained: 'yes' | 'mostly' | 'no'
  ejaculationOutcome: 'none' | 'during_training' | 'intentional_after'
  notes: string
}

export type UseGuidedSessionV2Options = {
  userId: string
  sessionType: GuidedSessionType
  prepSeconds: number
  /** Continuous target for Control / Endurance, in milliseconds. */
  targetMs: number
  /** Non-zero when a sleeve/transfer block is being trained. */
  sleeveTargetMs: number
}

export function useGuidedSessionV2({
  userId,
  sessionType,
  prepSeconds,
  targetMs,
  sleeveTargetMs,
}: UseGuidedSessionV2Options) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(() => {
    const stored = readSnapshot()

    if (stored && stored.userId === userId && stored.sessionType === sessionType) {
      return stored
    }

    return null
  })

  const [nowMs, setNowMs] = useState(() => Date.now())
  const lastAccrualRef = useRef<number>(Date.now())

  const [summaryRatings, setSummaryRatings] = useState<{
    controlRating: number
    breathingMaintained: 'yes' | 'mostly' | 'no'
    ejaculationOutcome: 'none' | 'during_training' | 'intentional_after'
    notes: string
  }>({
    controlRating: 3,
    breathingMaintained: 'mostly',
    ejaculationOutcome: 'none',
    notes: '',
  })

  const persistedRef = useRef<SessionSnapshot | null>(snapshot)
  persistedRef.current = snapshot

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 500)

    return () => window.clearInterval(intervalId)
  }, [])

  // Accrue wall-clock-derived durations and persist. Never invents time: every
  // value comes from a real elapsed interval or a restored accumulation.
  useEffect(() => {
    const last = lastAccrualRef.current
    const delta = nowMs - last
    lastAccrualRef.current = nowMs

    if (delta <= 0 || delta > 60_000) {
      return
    }

    setSnapshot((prev) => {
      if (!prev) {
        return prev
      }

      const inControlBlock =
        prev.controlStyle && (prev.stage === 'main' || prev.stage === 'accelerating')

      const tracking =
        (sessionType === 'reset' || sessionType === 'easy') &&
        (prev.stage === 'main' || prev.stage === 'accelerating')

      if (!inControlBlock && !tracking) {
        return prev
      }

      const inTargetRange =
        prev.currentArousal >= TARGET_AROUSAL_RANGE.min &&
        prev.currentArousal <= TARGET_AROUSAL_RANGE.max

      return {
        ...prev,
        mainActiveMs: prev.mainActiveMs + delta,
        timeInTargetRangeMs:
          inControlBlock && inTargetRange
            ? prev.timeInTargetRangeMs + delta
            : prev.timeInTargetRangeMs,
      }
    })
  }, [nowMs, sessionType])

  useEffect(() => {
    if (!snapshot) {
      writeSnapshot(null)

      return
    }

    writeSnapshot(snapshot)
  }, [snapshot])

  const update = useCallback((patch: Partial<SessionSnapshot>) => {
    setSnapshot((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const startSession = useCallback(() => {
    const fresh = createInitialSnapshot(userId, sessionType, prepSeconds)

    if (fresh.stage === 'prep') {
      setSnapshot(fresh)

      return
    }

    if (sessionType === 'baseline') {
      setSnapshot({ ...fresh, stage: 'not_started' })

      return
    }

    // Reset / easy / transfer begin their main block directly.
    const startedAtMs = Date.now()

    const controlStyle =
      sessionType === 'control' || sessionType === 'easy' || sessionType === 'transfer'

    setSnapshot({
      ...fresh,
      stage: 'main',
      stageStartedAtMs: startedAtMs,
      controlStyle,
      blockStartMs: controlStyle ? startedAtMs : null,
    })
  }, [prepSeconds, sessionType, userId])

  const startPrep = useCallback(() => {
    const startedAtMs = Date.now()
    setSnapshot({
      ...createInitialSnapshot(userId, sessionType, prepSeconds),
      stage: 'prep',
      stageStartedAtMs: startedAtMs,
    })
  }, [prepSeconds, sessionType, userId])

  const beginMainBlock = useCallback(
    ({ prepCompleted }: { prepCompleted: boolean }) => {
      setSnapshot((prev) => {
        const base = prev ?? createInitialSnapshot(userId, sessionType, prepSeconds)
        const startedAtMs = Date.now()

        const controlStyle =
          sessionType === 'control' ||
          sessionType === 'easy' ||
          sessionType === 'transfer' ||
          base.remainderMode

        return {
          ...base,
          stage: 'main',
          stageStartedAtMs: startedAtMs,
          prepCompleted: base.prepCompleted || prepCompleted,
          controlStyle,
          blockStartMs: controlStyle ? startedAtMs : null,
          attemptStartedAtMs:
            sessionType === 'endurance' && !base.remainderMode
              ? startedAtMs
              : base.attemptStartedAtMs,
          attemptEndedAtMs: null,
          attemptEndReason: null,
        }
      })
    },
    [prepSeconds, sessionType, userId]
  )

  const markPrepComplete = useCallback(() => {
    update({ prepCompleted: true })
  }, [update])

  const setArousal = useCallback((rating: number) => {
    const safe = Math.max(1, Math.min(10, Math.round(rating)))
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            currentArousal: safe,
            highestArousal: Math.max(prev.highestArousal, safe),
          }
        : prev
    )
  }, [])

  const markSteady = useCallback(() => {
    setSnapshot((prev) => (prev ? { ...prev, stage: 'main', stageStartedAtMs: Date.now() } : prev))
  }, [])

  const markAccelerating = useCallback(() => {
    setSnapshot((prev) =>
      prev && prev.stage === 'main'
        ? { ...prev, stage: 'accelerating', stageStartedAtMs: Date.now() }
        : prev
    )
  }, [])

  /** Slowing never breaks the continuous block. */
  const backInRange = useCallback(() => {
    setSnapshot((prev) =>
      prev && prev.stage === 'accelerating'
        ? { ...prev, stage: 'main', stageStartedAtMs: Date.now() }
        : prev
    )
  }, [])

  const finishBlock = useCallback((endMs: number): BlockClose => {
    const current = persistedRef.current

    if (!current?.blockStartMs) {
      return {
        longestContinuousBlockMs: current?.longestContinuousBlockMs ?? 0,
        completedBlocksMs: current?.completedBlocksMs ?? [],
      }
    }

    const duration = Math.max(0, endMs - current.blockStartMs)
    const completedBlocksMs = [...current.completedBlocksMs, duration]

    return {
      longestContinuousBlockMs: Math.max(current.longestContinuousBlockMs, duration),
      completedBlocksMs,
    }
  }, [])

  /** A rescue is a full stop: the continuous block ends and is recorded. */
  const requestReset = useCallback(() => {
    const current = persistedRef.current

    if (!current || current.stage === 'rescue') {
      return
    }

    const now = Date.now()

    if (current.rescueStopCount >= CONTROL_MAX_RESCUE_STOPS) {
      const { longestContinuousBlockMs, completedBlocksMs } = finishBlock(now)
      setSnapshot({
        ...current,
        stage: 'block_ended',
        stageStartedAtMs: now,
        blockStartMs: null,
        completedBlocksMs,
        longestContinuousBlockMs,
        terminationReason: 'max_rescues',
        completedProtocol: false,
      })

      return
    }

    const { longestContinuousBlockMs, completedBlocksMs } = finishBlock(now)
    const blockDuration = current.blockStartMs ? Math.max(0, now - current.blockStartMs) : 0
    const rescuedBlockDurationsMs = [...current.rescuedBlockDurationsMs, blockDuration]

    const loopDetected =
      countRapidRescues(rescuedBlockDurationsMs) >= 2 && !current.antiLoopTerminated

    const rescueEvent: RescueEventInput = {
      startedOffsetMs: Math.max(0, now - new Date(current.startedAt).getTime()),
      endedOffsetMs: null,
      durationMs: null,
      arousalBefore: current.currentArousal,
      arousalAfter: null,
    }

    if (loopDetected) {
      setSnapshot({
        ...current,
        stage: 'block_ended',
        stageStartedAtMs: now,
        blockStartMs: null,
        completedBlocksMs,
        rescuedBlockDurationsMs,
        longestContinuousBlockMs,
        rescueEvents: [...current.rescueEvents, rescueEvent],
        rescueStopCount: current.rescueStopCount + 1,
        rescueStartedAtMs: now,
        antiLoopTerminated: true,
        terminationReason: 'rescue_loop',
        completedProtocol: false,
      })

      return
    }

    setSnapshot({
      ...current,
      stage: 'rescue',
      stageStartedAtMs: now,
      blockStartMs: null,
      completedBlocksMs,
      rescuedBlockDurationsMs,
      longestContinuousBlockMs,
      rescueEvents: [...current.rescueEvents, rescueEvent],
      rescueStopCount: current.rescueStopCount + 1,
      rescueStartedAtMs: now,
      rescueArousalBefore: current.currentArousal,
    })
  }, [finishBlock])

  /** Only 3 or 4 closes the rescue; anything higher keeps the user in reset. */
  const confirmReset = useCallback((arousal: 3 | 4) => {
    const now = Date.now()
    setSnapshot((prev) => {
      if (!prev || prev.stage !== 'rescue' || prev.rescueStartedAtMs === null) {
        return prev
      }

      const duration = Math.max(0, now - prev.rescueStartedAtMs)

      const rescueEvents = prev.rescueEvents.map((event, index) =>
        index === prev.rescueEvents.length - 1
          ? {
              ...event,
              endedOffsetMs: Math.max(0, now - new Date(prev.startedAt).getTime()),
              durationMs: duration,
              arousalAfter: arousal,
            }
          : event
      )

      return {
        ...prev,
        stage: 'main',
        stageStartedAtMs: now,
        blockStartMs: now,
        rescueEvents,
        rescueStartedAtMs: null,
        rescueArousalBefore: null,
        totalRescueMs: prev.totalRescueMs + duration,
        currentArousal: arousal,
      }
    })
  }, [])

  const stillAboveFour = useCallback(() => {
    setSnapshot((prev) =>
      prev ? { ...prev, currentArousal: Math.max(5, prev.currentArousal) } : prev
    )
  }, [])

  /** End a session whose structured block was terminated; data is preserved as-is. */
  const concludeTerminatedSession = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            completedProtocol: false,
          }
        : prev
    )
  }, [])

  /** Control-style normal completion. */
  const completeControl = useCallback(() => {
    const now = Date.now()
    const { longestContinuousBlockMs, completedBlocksMs } = finishBlock(now)
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            completedBlocksMs,
            longestContinuousBlockMs,
            completedProtocol: prev.prepCompleted && !prev.antiLoopTerminated,
            terminationReason: prev.antiLoopTerminated ? prev.terminationReason : null,
          }
        : prev
    )
  }, [finishBlock])

  /** Endurance: a full stop terminates the measured attempt immediately. */
  const endAttemptByFullStop = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            attemptEndedAtMs: prev.attemptEndedAtMs ?? now,
            attemptEndReason: prev.attemptEndReason ?? 'full_stop',
            completedProtocol: prev.prepCompleted && prev.attemptStartedAtMs !== null,
          }
        : prev
    )
  }, [])

  const endAttemptByEjaculation = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            attemptEndedAtMs: prev.attemptEndedAtMs ?? now,
            attemptEndReason: prev.attemptEndReason ?? 'ejaculation',
            completedProtocol: prev.prepCompleted && prev.attemptStartedAtMs !== null,
          }
        : prev
    )
    setSummaryRatings((prev) => ({ ...prev, ejaculationOutcome: 'during_training' }))
  }, [])

  const endAttemptAtTarget = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            attemptEndedAtMs: prev.attemptEndedAtMs ?? now,
            attemptEndReason: prev.attemptEndReason ?? 'target_reached',
            completedProtocol: prev.prepCompleted && prev.attemptStartedAtMs !== null,
          }
        : prev
    )
  }, [])

  /** Optional Control-style remainder after a measured attempt ends. */
  const enterRemainderMode = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'main',
            stageStartedAtMs: now,
            remainderMode: true,
            controlStyle: true,
            blockStartMs: now,
            attemptEndedAtMs: prev.attemptEndedAtMs ?? now,
          }
        : prev
    )
  }, [])

  const endRemainder = useCallback(() => {
    const now = Date.now()
    const { longestContinuousBlockMs, completedBlocksMs } = finishBlock(now)
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            blockStartMs: null,
            completedBlocksMs,
            longestContinuousBlockMs,
          }
        : prev
    )
  }, [finishBlock])

  const setPrecheck = useCallback((patch: Partial<BaselinePrecheck>) => {
    setSnapshot((prev) => (prev ? { ...prev, precheck: { ...prev.precheck, ...patch } } : prev))
  }, [])

  const startBaseline = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) => {
      const base = prev ?? createInitialSnapshot(userId, sessionType, 0)

      return {
        ...base,
        stage: 'main',
        stageStartedAtMs: now,
        attemptStartedAtMs: now,
        attemptEndedAtMs: null,
        attemptEndReason: null,
        baselineEndReason: null,
        completedProtocol: true,
      }
    })
  }, [sessionType, userId])

  const endBaseline = useCallback((reason: 'full_stop' | 'ejaculation') => {
    const now = Date.now()
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            stage: 'summary',
            stageStartedAtMs: now,
            attemptEndedAtMs: prev.attemptEndedAtMs ?? now,
            baselineEndReason: prev.baselineEndReason ?? reason,
            attemptEndReason: reason === 'ejaculation' ? 'ejaculation' : 'full_stop',
          }
        : prev
    )

    if (reason === 'ejaculation') {
      setSummaryRatings((prev) => ({ ...prev, ejaculationOutcome: 'during_training' }))
    }
  }, [])

  const completeSimpleSession = useCallback(() => {
    const now = Date.now()
    setSnapshot((prev) => (prev ? { ...prev, stage: 'summary', stageStartedAtMs: now } : prev))
  }, [])

  const abandon = useCallback(() => {
    setSnapshot(null)
    writeSnapshot(null)
  }, [])

  const elapsedMainMs = useMemo(() => {
    if (!snapshot) {
      return 0
    }

    if (snapshot.stage === 'main' || snapshot.stage === 'accelerating') {
      return Math.max(0, nowMs - snapshot.stageStartedAtMs)
    }

    return 0
  }, [nowMs, snapshot])

  const attemptMs = useMemo(() => {
    if (!snapshot?.attemptStartedAtMs) {
      return 0
    }

    const end = snapshot.attemptEndedAtMs ?? nowMs

    return Math.max(0, end - snapshot.attemptStartedAtMs)
  }, [nowMs, snapshot])

  const attemptPassedTarget = attemptMs >= targetMs && targetMs > 0

  const prepRemainingMs = useMemo(() => {
    if (!snapshot || snapshot.stage !== 'prep') {
      return 0
    }

    return Math.max(0, snapshot.prepSeconds * 1000 - (nowMs - snapshot.stageStartedAtMs))
  }, [nowMs, snapshot])

  const rescueElapsedMs = useMemo(() => {
    if (!snapshot?.rescueStartedAtMs || snapshot.stage !== 'rescue') {
      return 0
    }

    return Math.max(0, nowMs - snapshot.rescueStartedAtMs)
  }, [nowMs, snapshot])

  const currentBlockMs = useMemo(() => {
    if (!snapshot?.blockStartMs) {
      return 0
    }

    if (snapshot.stage !== 'main' && snapshot.stage !== 'accelerating') {
      return 0
    }

    return Math.max(0, nowMs - snapshot.blockStartMs)
  }, [nowMs, snapshot])

  const activeTargetMs = sessionType === 'transfer' ? sleeveTargetMs : targetMs

  const buildSubmission = useCallback((): ProgramV2SessionInput => {
    const current = persistedRef.current

    if (!current) {
      throw new Error('No active session to save.')
    }

    const completedAt = new Date().toISOString()
    const controlStyleObservation = Math.round(current.longestContinuousBlockMs)

    const isControlAttempt =
      sessionType === 'control' ||
      sessionType === 'easy' ||
      sessionType === 'transfer' ||
      current.remainderMode

    const continuousAttemptMs =
      sessionType === 'endurance' || sessionType === 'baseline'
        ? Math.round(
            current.attemptStartedAtMs
              ? (current.attemptEndedAtMs ?? Date.now()) - current.attemptStartedAtMs
              : 0
          )
        : null

    return {
      sessionType,
      scheduledLocalDate: current.localDate,
      startedAt: current.startedAt,
      completedAt,
      mainTrainingDurationMs: Math.round(current.mainActiveMs),
      continuousAttemptMs,
      longestContinuousBlockMs: isControlAttempt ? controlStyleObservation : null,
      rescueStopTotalMs: Math.round(current.totalRescueMs),
      timeInTargetRangeMs: isControlAttempt ? Math.round(current.timeInTargetRangeMs) : null,
      highestArousalReached: current.highestArousal,
      standardized:
        sessionType === 'baseline' &&
        current.precheck.noPorn &&
        current.precheck.lubeUsed &&
        current.precheck.normalTechnique &&
        current.precheck.handStimulus,
      completedProtocol: current.completedProtocol,
      antiLoopTerminated: current.antiLoopTerminated,
      stimulusType: sessionType === 'transfer' ? 'sleeve' : 'hand',
      lubeUsed: sessionType === 'baseline' ? current.precheck.lubeUsed : null,
      pornUsed: sessionType === 'baseline' ? !current.precheck.noPorn : null,
      ejaculationOutcome:
        current.attemptEndReason === 'ejaculation' || current.baselineEndReason === 'ejaculation'
          ? 'during_training'
          : summaryRatings.ejaculationOutcome,
      controlRating: summaryRatings.controlRating,
      breathingMaintained: summaryRatings.breathingMaintained,
      notes: summaryRatings.notes.trim() === '' ? null : summaryRatings.notes.trim(),
      rescueEvents: current.rescueEvents,
    }
  }, [sessionType, summaryRatings])

  return {
    stage: snapshot?.stage ?? 'not_started',
    snapshot,
    nowMs,
    prepRemainingMs,
    elapsedMainMs,
    currentBlockMs,
    attemptMs,
    attemptPassedTarget,
    rescueElapsedMs,
    activeTargetMs,
    completedBlocksMs: snapshot?.completedBlocksMs ?? [],
    longestContinuousBlockMs: snapshot?.longestContinuousBlockMs ?? 0,
    rescuedBlockDurationsMs: snapshot?.rescuedBlockDurationsMs ?? [],
    rescueEvents: snapshot?.rescueEvents ?? [],
    rescueStopCount: snapshot?.rescueStopCount ?? 0,
    totalRescueMs: snapshot?.totalRescueMs ?? 0,
    timeInTargetRangeMs: snapshot?.timeInTargetRangeMs ?? 0,
    mainActiveMs: snapshot?.mainActiveMs ?? 0,
    highestArousal: snapshot?.highestArousal ?? 1,
    currentArousal: snapshot?.currentArousal ?? 1,
    precheck: snapshot?.precheck ?? defaultPrecheck,
    remainderMode: snapshot?.remainderMode ?? false,
    terminationReason: snapshot?.terminationReason ?? null,
    antiLoopTerminated: snapshot?.antiLoopTerminated ?? false,
    attemptEndReason: snapshot?.attemptEndReason ?? null,
    baselineEndReason: snapshot?.baselineEndReason ?? null,
    prepCompleted: snapshot?.prepCompleted ?? false,
    summaryRatings,
    setSummaryRatings,
    startSession,
    startPrep,
    markPrepComplete,
    beginMainBlock,
    setArousal,
    markSteady,
    markAccelerating,
    backInRange,
    requestReset,
    confirmReset,
    stillAboveFour,
    completeControl,
    concludeTerminatedSession,
    endAttemptByFullStop,
    endAttemptByEjaculation,
    endAttemptAtTarget,
    enterRemainderMode,
    endRemainder,
    setPrecheck,
    startBaseline,
    endBaseline,
    completeSimpleSession,
    abandon,
    buildSubmission,
  }
}
