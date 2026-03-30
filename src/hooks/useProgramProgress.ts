'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { useCallback, useEffect, useState } from 'react'

type ProgramSessionRow = Database['public']['Tables']['program_sessions']['Row']
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
        // Another tab/request may have inserted this row first.
        if ((insertError as { code?: string }).code === '23505') {
          const { data: retry, error: retryError } = await supabase
            .from('program_progress')
            .select('*')
            .eq('user_id', userId)
            .single()
          if (retryError) {
            throw retryError
          }
          return retry
        }
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
        const { data: rpcResult, error: rpcError } = await supabase.rpc('record_program_session', {
          p_started_at: input.startedAt,
          p_completed_at: input.completedAt,
          p_duration_ms: input.durationMs,
          p_cycles_completed: input.cyclesCompleted,
          p_complete_stops: input.completeStops,
          p_time_in_zone_ms: input.timeInZoneMs,
          p_highest_arousal_reached: input.highestArousalReached,
          p_accidentally_finished: input.accidentallyFinished,
          p_ended_early: input.endedEarly,
          p_self_rating: input.selfRating,
          p_breathing_maintained: input.breathingMaintained ?? null,
          p_imagery_rating: input.imageryRating ?? null,
          p_positions_used: input.positionsUsed ?? null,
          p_notes: input.notes ?? null,
          p_lube_used: input.lubeUsed,
          p_toy_used: input.toyUsed,
          p_ejaculation_outcome: input.ejaculationOutcome,
        })

        if (rpcError) {
          throw rpcError
        }

        const resultRow = Array.isArray(rpcResult) ? rpcResult[0] : null

        await refresh()

        return {
          advancedToPhase: resultRow?.advanced_to_phase ?? null,
          previousPhase: resultRow?.previous_phase ?? (progress?.current_phase ?? 1),
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save session'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [progress?.current_phase, refresh, user]
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
