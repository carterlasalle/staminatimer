"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

type GlobalStats = {
  active_users_count: number
  total_sessions_count: number
  last_updated: string
}

export function useGlobalStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribeAllowed, setSubscribeAllowed] = useState(false)

  const disabled = process.env.NEXT_PUBLIC_USE_GLOBAL_STATS === 'false'

  useEffect(() => {
    if (disabled) {
      setLoading(false)
      setSubscribeAllowed(false)
      return
    }

    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('global_stats')
          .select('*')
          .single()

        if (error) throw error
        setStats(data)
        setSubscribeAllowed(true)
      } catch (error) {
        // Reduce console noise in local dev if Supabase is unreachable
        console.warn('Global stats unavailable; hiding dynamic stats.')
        setSubscribeAllowed(false)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

  }, [disabled])

  useEffect(() => {
    if (disabled || !subscribeAllowed) return

    const channel = supabase
      .channel('global_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_stats',
        },
        (payload: any) => {
          setStats(payload.new as GlobalStats)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [disabled, subscribeAllowed])

  return { stats, loading }
} 
