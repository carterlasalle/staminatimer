'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface GlobalStats {
  active_users_count: number
  total_sessions_count: number
  last_updated: string
}

export function useGlobalStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('global_stats')
          .select('*')
          .single()

        if (error) throw error
        setStats(data)
      } catch (error) {
        console.error('Error fetching global stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('global_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_stats'
        },
        (payload) => {
          setStats(payload.new as GlobalStats)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { stats, loading }
} 