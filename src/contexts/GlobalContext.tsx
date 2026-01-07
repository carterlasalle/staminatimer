'use client'

import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'

type GlobalState = {
  currentSession: DBSession | null
  recentSessions: DBSession[]
  loading: boolean
  error: Error | null
  fetchSessions: () => Promise<void>
}

const GlobalContext = createContext<GlobalState | undefined>(undefined)

export function GlobalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentSession] = useState<DBSession | null>(null)
  const [recentSessions, setRecentSessions] = useState<DBSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setRecentSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`*, edge_events!fk_session (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError

      setRecentSessions(data as DBSession[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'))
      toast.error('Could not load session data.')
      console.error("Error fetching sessions:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSessions()

    const channel = supabase
      .channel('public:sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${user?.id}` },
        (payload: RealtimePostgresChangesPayload<DBSession>) => {
          console.log('Realtime session change received!', payload)
          fetchSessions()
        })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchSessions])

  const state: GlobalState = {
    currentSession,
    recentSessions,
    loading,
    error,
    fetchSessions
  }

  return (
    <GlobalContext.Provider value={state}>
      {children}
    </GlobalContext.Provider>
  )
}

export function useGlobal() {
  const context = useContext(GlobalContext)
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider')
  }
  return context
}