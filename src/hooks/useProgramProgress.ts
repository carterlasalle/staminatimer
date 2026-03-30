'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { useCallback, useEffect, useState } from 'react'

type ProgramSessionRow = Database['public']['Tables']['program_sessions']['Row']
type ProgramSessionInsert = Database['public']['Tables']['program_sessions']['Insert']
type ProgramProgressRow = Database['public']['Tables']['program_progress']['Row']

export type EjaculationOutcome = 'no' | 'accidental' | 'intentional_after'
export type BreathingMaintained = 'yes' | 'mostly' | 'no'

export type ProgramSessionInput = {
  startedAt: string
  completedAt: string
  durationMs: number
  cyclesCompleted: number
  completeStops: number
  timeInZoneMs: number
  highestArousalReached: number
  accidentallyFinished: boolean
  endedEarly: boolean
  selfRating: number
  breathingMaintained?: BreathingMaintained
  imageryRating?: number
  positionsUsed?: string[]
  notes?: string
  lubeUsed: boolean
  toyUsed: boolean
  ejaculationOutcome: EjaculationOutcome
}

const QUALIFYING_TARGET_PER_PHASE = 5

function isQualifyingSession(phase: number, input: ProgramSessionInput): boolean {
  if (input.accidentallyFinished || input.endedEarly) {
    return false
  }

  if (phase === 1) {
    return input.cyclesCompleted >= 3
  }

  return true
}

function makeDefaultProgress(userId: string): Database['public']['Tables']['program_progress']['Insert'] {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    current_phase: 1,
    sessions_in_current_phase: 0,
    qualifying_sessions_in_phase: 0,
    total_sessions: 0,
    sessions_since_ejaculation: 0,
    phase_started_at: now,
    program_started_at: now,
    updated_at: now,
    daily_squat_streak: 0,
  }
}

export function useProgramProgress() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgramProgressRow | null>(null)
  const [sessions, setSessions] = useState<ProgramSessionRow[]>([])

  const ensureProgressRow = useCallback(
    async (userId: string) => {
      const { data: existing, error: fetchError } = await supabase
        .from('program_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (existing) {
        return existing
      }

      const { data: inserted, error: insertError } = await supabase
        .from('program_progress')
        .insert(makeDefaultProgress(userId))
        .select('*')
        .single()

      if (insertError) {
        throw insertError
      }

      return inserted
    },
    []
  )

  const refresh = useCallback(async () => {
    if (!user) {
      setProgress(null)
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ensuredProgress = await ensureProgressRow(user.id)
      setProgress(ensuredProgress)

      const { data: sessionRows, error: sessionsError } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(200)

      if (sessionsError) {
        throw sessionsError
      }

      setSessions(sessionRows ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load program progress'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [ensureProgressRow, user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateDailySquat = useCallback(
    async (streak: number, lastSquatDate: string) => {
      if (!user) {
        return
      }

      await supabase
        .from('program_progress')
        .update({
          daily_squat_streak: streak,
          last_squat_date: lastSquatDate,
        })
        .eq('user_id', user.id)
    },
    [user]
  )

  const recordSession = useCallback(
    async (input: ProgramSessionInput) => {
      if (!user) {
        throw new Error('You must be signed in to save program sessions.')
      }

      setSaving(true)
      setError(null)

      try {
        const currentProgress = progress ?? (await ensureProgressRow(user.id))

        const currentPhase = currentProgress.current_phase ?? 1
        const nextSessionInPhase = (currentProgress.sessions_in_current_phase ?? 0) + 1
        const nextTotalSessions = (currentProgress.total_sessions ?? 0) + 1

        const didEjaculate =
          input.ejaculationOutcome === 'accidental' || input.ejaculationOutcome === 'intentional_after'
        const accidentallyFinished = input.accidentallyFinished || input.ejaculationOutcome === 'accidental'

        const insertPayload: ProgramSessionInsert = {
          user_id: user.id,
          phase: currentPhase,
          session_number_in_phase: nextSessionInPhase,
          started_at: input.startedAt,
          completed_at: input.completedAt,
          duration_ms: input.durationMs,
          cycles_completed: input.cyclesCompleted,
          complete_stops: input.completeStops,
          time_in_zone_ms: input.timeInZoneMs,
          highest_arousal_reached: input.highestArousalReached,
          accidentally_finished: accidentallyFinished,
          ended_early: input.endedEarly,
          self_rating: input.selfRating,
          breathing_maintained: input.breathingMaintained ?? null,
          imagery_rating: input.imageryRating ?? null,
          positions_used: input.positionsUsed ?? null,
          notes: input.notes ?? null,
          lube_used: input.lubeUsed,
          toy_used: input.toyUsed,
        }

        const { error: insertError } = await supabase.from('program_sessions').insert(insertPayload)
        if (insertError) {
          throw insertError
        }

        const qualifies = isQualifyingSession(currentPhase, {
          ...input,
          accidentallyFinished,
        })

        let nextPhase = currentPhase
        let nextSessionsInCurrentPhase = nextSessionInPhase
        let nextQualifyingInPhase = (currentProgress.qualifying_sessions_in_phase ?? 0) + (qualifies ? 1 : 0)
        let nextPhaseStartedAt = currentProgress.phase_started_at ?? new Date().toISOString()
        let nextPhase8EnteredAt = currentProgress.phase_8_entered_at ?? null

        if (
          currentPhase < 8 &&
          nextQualifyingInPhase >= QUALIFYING_TARGET_PER_PHASE
        ) {
          nextPhase = currentPhase + 1
          nextSessionsInCurrentPhase = 0
          nextQualifyingInPhase = 0
          nextPhaseStartedAt = new Date().toISOString()
          if (nextPhase === 8 && !nextPhase8EnteredAt) {
            nextPhase8EnteredAt = new Date().toISOString()
          }
        }

        let nextSessionsSinceEjaculation = (currentProgress.sessions_since_ejaculation ?? 0) + 1
        let nextLastEjaculationSession = currentProgress.last_ejaculation_session ?? null

        if (didEjaculate) {
          nextSessionsSinceEjaculation = 0
          nextLastEjaculationSession = nextTotalSessions
        }

        const { error: progressError } = await supabase
          .from('program_progress')
          .update({
            current_phase: nextPhase,
            sessions_in_current_phase: nextSessionsInCurrentPhase,
            qualifying_sessions_in_phase: nextQualifyingInPhase,
            total_sessions: nextTotalSessions,
            sessions_since_ejaculation: nextSessionsSinceEjaculation,
            last_ejaculation_session: nextLastEjaculationSession,
            last_session_at: input.completedAt,
            phase_started_at: nextPhaseStartedAt,
            phase_8_entered_at: nextPhase8EnteredAt,
          })
          .eq('user_id', user.id)

        if (progressError) {
          throw progressError
        }

        await refresh()

        return {
          advancedToPhase: nextPhase > currentPhase ? nextPhase : null,
          previousPhase: currentPhase,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save session'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [ensureProgressRow, progress, refresh, user]
  )

  return {
    loading,
    saving,
    error,
    progress,
    sessions,
    refresh,
    recordSession,
    updateDailySquat,
  }
}
