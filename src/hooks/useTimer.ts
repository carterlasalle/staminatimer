'use client'

import { supabase } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'
import { useAchievements } from '@/hooks/useAchievements'
import type { DBSession } from '@/lib/types'
import { toast } from 'sonner'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

type EdgeLap = {
  startTime: Date
  endTime?: Date
  duration?: number
}

export function useTimer() {
  const [state, setState] = useState<TimerState>('idle')
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [edgeLaps, setEdgeLaps] = useState<EdgeLap[]>([])
  const [displayActiveTime, setDisplayActiveTime] = useState(0)
  const [displayEdgeTime, setDisplayEdgeTime] = useState(0)
  const { checkAchievements } = useAchievements()

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (state === 'active' || state === 'edging') {
      intervalId = setInterval(() => {
        const now = new Date().getTime()

        if (state === 'active' && lastActiveStart) {
          const currentActiveTime = activeTime + (now - lastActiveStart.getTime())
          setDisplayActiveTime(currentActiveTime)
        }

        if (state === 'edging' && currentEdgeStart) {
          const currentEdgeTime = edgeTime + (now - currentEdgeStart.getTime())
          setDisplayEdgeTime(currentEdgeTime)
        }
      }, 1000)
    } else {
      setDisplayActiveTime(activeTime)
      setDisplayEdgeTime(edgeTime)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [state, activeTime, edgeTime, lastActiveStart, currentEdgeStart])

  const startSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      const now = new Date()
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          total_duration: 0,
          active_duration: 0,
          edge_duration: 0,
          finished_during_edge: false,
          created_at: now.toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating session:', error)
        toast.error('Failed to start session')
        return
      }

      if (!data?.id) {
        toast.error('Failed to create session')
        return
      }

      setSessionId(data.id)
      setLastActiveStart(now)
      setState('active')

    } catch (err) {
      console.error('Session start error:', err)
      toast.error('Failed to start session')
    }
  }, [])

  const startEdge = useCallback(async () => {
    if (!sessionId) {
      toast.error('No active session')
      return
    }

    const now = new Date()

    try {
      if (lastActiveStart) {
        const newActiveTime = activeTime + (now.getTime() - lastActiveStart.getTime())
        setActiveTime(newActiveTime)

        const { error: updateError } = await supabase
          .from('sessions')
          .update({ active_duration: newActiveTime })
          .eq('id', sessionId)

        if (updateError) {
          throw updateError
        }
      }

      const { error: edgeError } = await supabase
        .from('edge_events')
        .insert({
          session_id: sessionId,
          start_time: now.toISOString()
        })

      if (edgeError) {
        throw edgeError
      }

      setEdgeLaps(prev => [...prev, { startTime: now }])
      setCurrentEdgeStart(now)
      setState('edging')

    } catch (err) {
      console.error('Error recording edge:', err)
      toast.error('Failed to record edge event')
    }
  }, [sessionId, lastActiveStart, activeTime])

  const endEdge = useCallback(async () => {
    if (!sessionId || !currentEdgeStart) {
      return
    }

    const now = new Date()

    try {
      const newEdgeTime = edgeTime + (now.getTime() - currentEdgeStart.getTime())
      setEdgeTime(newEdgeTime)

      const { error } = await supabase
        .from('edge_events')
        .update({
          end_time: now.toISOString(),
          duration: now.getTime() - currentEdgeStart.getTime()
        })
        .eq('session_id', sessionId)
        .is('end_time', null)

      if (error) {
        throw error
      }

      setEdgeLaps(prev => {
        const newLaps = [...prev]
        const currentLap = newLaps[newLaps.length - 1]
        if (currentLap) {
          currentLap.endTime = now
          currentLap.duration = now.getTime() - currentLap.startTime.getTime()
        }
        return newLaps
      })

      setLastActiveStart(now)
      setCurrentEdgeStart(null)
      setState('active')

    } catch (err) {
      console.error('Error ending edge:', err)
      toast.error('Failed to update edge event')
    }
  }, [currentEdgeStart, sessionId, edgeTime])

  const finishSession = useCallback(async () => {
    if (!sessionId) {
      toast.error('No active session to finish')
      return
    }

    const now = new Date()
    let finalActiveTime = activeTime
    let finalEdgeTime = edgeTime

    try {
      if (state === 'active' && lastActiveStart) {
        finalActiveTime += (now.getTime() - lastActiveStart.getTime())
      } else if (state === 'edging' && currentEdgeStart) {
        finalEdgeTime += (now.getTime() - currentEdgeStart.getTime())
      }

      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: now.toISOString(),
          active_duration: finalActiveTime,
          edge_duration: finalEdgeTime,
          total_duration: finalActiveTime + finalEdgeTime,
          finished_during_edge: state === 'edging'
        })
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      setActiveTime(finalActiveTime)
      setEdgeTime(finalEdgeTime)
      setState('finished')

      const { data: completedSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*, edge_events!fk_session (*)')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        console.error('Error fetching completed session for achievements:', fetchError)
        toast.error("Couldn't check achievements for the session.")
      } else if (completedSession) {
        await checkAchievements(completedSession as DBSession)
      }

    } catch (err) {
      console.error('Error finishing session:', err)
      toast.error('Failed to finish session')
    }
  }, [sessionId, state, lastActiveStart, currentEdgeStart, activeTime, edgeTime, checkAchievements])

  const resetTimer = useCallback(() => {
    setState('idle')
    setActiveTime(0)
    setEdgeTime(0)
    setCurrentEdgeStart(null)
    setLastActiveStart(null)
    setSessionId(null)
    setEdgeLaps([])
  }, [])

  return {
    state,
    activeTime: displayActiveTime,
    edgeTime: displayEdgeTime,
    edgeLaps,
    startSession,
    startEdge,
    endEdge,
    finishSession,
    resetTimer
  }
}