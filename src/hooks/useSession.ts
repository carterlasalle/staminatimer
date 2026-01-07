import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { storage } from '@/lib/storage'
import { Validator } from '@/lib/security/validation'
import type { DBSession } from '@/lib/types'

export function useSession() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const saveSession = useCallback(async (sessionData: Partial<DBSession>) => {
    setLoading(true)
    setError(null)

    try {
      if (!sessionData.id) {
        throw new Error('Session ID is required')
      }

      // Validate session data
      Validator.validate(sessionData, {
        total_duration: { required: true, min: 0 },
        active_duration: { required: true, min: 0 },
        edge_duration: { required: true, min: 0 },
      })

      // Save to Supabase
      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', sessionData.id)

      if (error) throw error

      // Save to local storage as backup
      storage.saveSession({
        state: 'finished',
        sessionStart: sessionData.start_time ?? null,
        activeTime: sessionData.active_duration ?? 0,
        edgeTime: sessionData.edge_duration ?? 0,
        currentEdgeStart: null,
        lastActiveStart: null,
        sessionId: sessionData.id ?? null,
        finishedDuringEdge: sessionData.finished_during_edge ?? false,
        edgeLaps: []
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save session'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete session'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    saveSession,
    deleteSession
  }
} 