'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/types'
import {
  evaluateProgressionGate,
  getCurrentTarget,
  getNextTarget,
  getObservationDurationMs,
  getProgressionRequirement,
  getTransferUnlockState,
  type GuidedSessionType,
  type InitialBaselineBucket,
  type ProgressionGateState,
  type ProgressionObservation,
  type ProgramStatus,
} from '@/lib/program/protocol-v2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

export type ProgramV2ProgressRow = Database['public']['Tables']['program_v2_progress']['Row']

export type ProgramV2SessionRow = Database['public']['Tables']['program_v2_sessions']['Row']

export type ProgramV2RescueEventRow =
  Database['public']['Tables']['program_v2_rescue_events']['Row']

export type RescueEventInput = {
  startedOffsetMs: number
  endedOffsetMs?: number | null
  durationMs?: number | null
  arousalBefore?: number | null
  arousalAfter?: number | null
}

export type ProgramV2SessionInput = {
  sessionType: GuidedSessionType
  scheduledLocalDate: string
  startedAt: string
  completedAt: string
  mainTrainingDurationMs?: number | null
  continuousAttemptMs?: number | null
  longestContinuousBlockMs?: number | null
  rescueStopTotalMs?: number
  timeInTargetRangeMs?: number | null
  highestArousalReached?: number | null
  standardized?: boolean
  completedProtocol?: boolean
  antiLoopTerminated?: boolean
  stimulusType?: 'hand' | 'sleeve'
  lubeUsed?: boolean | null
  pornUsed?: boolean | null
  ejaculationOutcome?: 'none' | 'during_training' | 'intentional_after' | null
  controlRating?: number | null
  breathingMaintained?: 'yes' | 'mostly' | 'no' | null
  notes?: string | null
  rescueEvents?: RescueEventInput[]
}

export type RecordingResult = {
  sessionId: string | null
  priorTargetMs: number
  currentTargetMs: number
  counted: boolean
  targetPassed: boolean
  advanced: boolean
  status: ProgramStatus
  gate: ProgressionGateState
}

export type ProgressionObservationRow = {
  sessionType: GuidedSessionType
  durationMs: number
  at: string
  passed: boolean
  targetMs: number
}

const recordingResultSchema = z.object({
  session_id: z.string().nullable().optional(),
  prior_target_ms: z.number().optional(),
  current_target_ms: z.number(),
  counted: z.boolean().optional(),
  target_passed: z.boolean().optional(),
  advanced: z.boolean().optional(),
  status: z.enum(['active', 'maintenance']).optional(),
  gate: z
    .object({
      observation_count: z.number().optional(),
      pass_count: z.number().optional(),
      strict_pass_count: z.number().optional(),
      should_advance: z.boolean().optional(),
    })
    .optional(),
})

/**
 * The recording RPC returns a JSONB envelope. This is the I/O boundary where it
 * becomes a domain value, so it is parsed rather than asserted.
 */
function parseRecordingResult(raw: Json | null): RecordingResult | null {
  const parsed = recordingResultSchema.safeParse(raw)

  if (!parsed.success) {
    return null
  }

  const value = parsed.data
  const targetMs = value.current_target_ms
  const requirement = getProgressionRequirement(targetMs)
  const observationCount = value.gate?.observation_count ?? 0
  const passCount = value.gate?.pass_count ?? 0
  const strictPassCount = value.gate?.strict_pass_count ?? 0
  const shouldAdvance = value.gate?.should_advance ?? false
  const status = value.status ?? 'active'
  const advanced = value.advanced ?? false

  return {
    sessionId: value.session_id ?? null,
    priorTargetMs: value.prior_target_ms ?? targetMs,
    currentTargetMs: targetMs,
    counted: value.counted ?? false,
    targetPassed: value.target_passed ?? false,
    advanced,
    status,
    gate: {
      requirement,
      observationCount,
      passCount,
      strictPassCount,
      hasEnoughObservations: observationCount >= requirement.requiredObservations,
      shouldAdvance,
      passesRemaining: Math.max(0, requirement.requiredPasses - passCount),
      strictPassesRemaining: Math.max(0, requirement.requiredStrictPasses - strictPassCount),
      advanceToTargetMs: advanced ? targetMs : null,
      maintenanceReached: status === 'maintenance' && shouldAdvance,
    },
  }
}

export function useProgramV2Progress() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgramV2ProgressRow | null>(null)
  const [sessions, setSessions] = useState<ProgramV2SessionRow[]>([])
  const [rescueEvents, setRescueEvents] = useState<ProgramV2RescueEventRow[]>([])
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setProgress(null)
      setSessions([])
      setRescueEvents([])
      setNeedsOnboarding(false)
      setLoading(false)

      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: progressRow, error: progressError } = await supabase
        .from('program_v2_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (progressError) {
        throw progressError
      }

      const { data: sessionRows, error: sessionsError } = await supabase
        .from('program_v2_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300)

      if (sessionsError) {
        throw sessionsError
      }

      const { data: rescueRows, error: rescueError } = await supabase
        .from('program_v2_rescue_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(600)

      if (rescueError) {
        throw rescueError
      }

      setProgress(progressRow ?? null)
      setNeedsOnboarding(!progressRow)
      setSessions(sessionRows ?? [])
      setRescueEvents(rescueRows ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Guided Program progress')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const initialize = useCallback(
    async (bucket: InitialBaselineBucket) => {
      if (!user) {
        throw new Error('You must be signed in to start the Guided Program.')
      }

      setSaving(true)
      setError(null)

      try {
        const { error: rpcError } = await supabase.rpc('initialize_program_v2', {
          p_bucket: bucket,
        })

        if (rpcError) {
          throw rpcError
        }

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize the program'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [refresh, user]
  )

  const recordSession = useCallback(
    async (input: ProgramV2SessionInput): Promise<RecordingResult | null> => {
      if (!user) {
        throw new Error('You must be signed in to save sessions.')
      }

      setSaving(true)
      setError(null)

      try {
        const payload = {
          session_type: input.sessionType,
          scheduled_local_date: input.scheduledLocalDate,
          started_at: input.startedAt,
          completed_at: input.completedAt,
          main_training_duration_ms: input.mainTrainingDurationMs ?? null,
          continuous_attempt_ms: input.continuousAttemptMs ?? null,
          longest_continuous_block_ms: input.longestContinuousBlockMs ?? null,
          rescue_stop_total_ms: input.rescueStopTotalMs ?? 0,
          time_in_target_range_ms: input.timeInTargetRangeMs ?? null,
          highest_arousal_reached: input.highestArousalReached ?? null,
          standardized: input.standardized ?? false,
          completed_protocol: input.completedProtocol ?? false,
          anti_loop_terminated: input.antiLoopTerminated ?? false,
          stimulus_type: input.stimulusType ?? 'hand',
          lube_used: input.lubeUsed ?? null,
          porn_used: input.pornUsed ?? null,
          ejaculation_outcome: input.ejaculationOutcome ?? null,
          control_rating: input.controlRating ?? null,
          breathing_maintained: input.breathingMaintained ?? null,
          notes: input.notes ?? null,
          rescue_events: (input.rescueEvents ?? []).map((event) => ({
            started_offset_ms: event.startedOffsetMs,
            ended_offset_ms: event.endedOffsetMs ?? null,
            duration_ms: event.durationMs ?? null,
            arousal_before: event.arousalBefore ?? null,
            arousal_after: event.arousalAfter ?? null,
          })),
        }

        const { data, error: rpcError } = await supabase.rpc('record_program_v2_session', {
          p_payload: payload,
        })

        if (rpcError) {
          throw rpcError
        }

        const result = parseRecordingResult(data)
        await refresh()

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save the session'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [refresh, user]
  )

  const currentTargetMs = getCurrentTarget({ currentTargetMs: progress?.current_target_ms })
  const status: ProgramStatus = progress?.status ?? 'active'

  /** Progression-eligible observations at the current target, newest first. */
  const observations = useMemo<ProgressionObservationRow[]>(() => {
    if (!progress) {
      return []
    }

    return sessions
      .filter(
        (session) => session.progression_eligible && session.target_duration_ms === currentTargetMs
      )
      .flatMap((session) => {
        const sessionType = session.session_type

        const durationMs = getObservationDurationMs({
          sessionType,
          longestContinuousBlockMs: session.longest_continuous_block_ms,
          continuousAttemptMs: session.continuous_attempt_ms,
        })

        if (durationMs === null) {
          return []
        }

        return [
          {
            sessionType,
            durationMs,
            at: session.created_at,
            passed: durationMs >= currentTargetMs,
            targetMs: session.target_duration_ms ?? currentTargetMs,
          },
        ]
      })
  }, [currentTargetMs, progress, sessions])

  const gate = useMemo<ProgressionGateState | null>(() => {
    if (!progress) {
      return null
    }

    const window = observations.slice(
      0,
      getProgressionRequirement(currentTargetMs).requiredObservations
    )

    return evaluateProgressionGate({
      targetMs: currentTargetMs,
      observations: window.map<ProgressionObservation>((item) => ({
        sessionType: item.sessionType,
        durationMs: item.durationMs,
      })),
    })
  }, [currentTargetMs, observations, progress])

  const baselines = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.session_type === 'baseline' &&
          session.standardized &&
          session.stimulus_type === 'hand' &&
          session.continuous_attempt_ms !== null
      ),
    [sessions]
  )

  const controlSessions = useMemo(
    () => sessions.filter((session) => session.session_type === 'control'),
    [sessions]
  )

  const transferSessions = useMemo(
    () => sessions.filter((session) => session.session_type === 'transfer'),
    [sessions]
  )

  const transfer = useMemo(
    () => getTransferUnlockState({ currentTargetMs, status }),
    [currentTargetMs, status]
  )

  const daysSinceLastEjaculation = useMemo(() => {
    if (!progress?.last_ejaculation_at) {
      return null
    }

    const elapsed = Date.now() - new Date(progress.last_ejaculation_at).getTime()

    return Math.max(0, Math.floor(elapsed / 86_400_000))
  }, [progress?.last_ejaculation_at])

  return {
    loading,
    saving,
    error,
    progress,
    sessions,
    rescueEvents,
    needsOnboarding,
    currentTargetMs,
    status,
    nextTargetMs: getNextTarget(currentTargetMs),
    observations,
    gate,
    baselines,
    controlSessions,
    transferSessions,
    transfer,
    daysSinceLastEjaculation,
    initialize,
    recordSession,
    refresh,
  }
}
