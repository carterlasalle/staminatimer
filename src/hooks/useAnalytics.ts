import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { calculateDetailedAnalytics } from '@/lib/analytics'
import type { DetailedAnalytics } from '@/lib/analytics'
import type { DBSession } from '@/lib/types'

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select(`
            *,
            edge_events!fk_session (*)
          `)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        const stats = calculateDetailedAnalytics(sessions as DBSession[])
        setAnalytics(stats)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return { analytics, loading, error }
} 