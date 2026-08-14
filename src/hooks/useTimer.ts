'use client'

import { useAchievements } from '@/hooks/useAchievements'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import { useCallback, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

type EdgeLap = {
  startTime: Date
  endTime?: Date
  duration?: number
}

export function useTimer() {
  const [state, setState] = useState<TimerState>('idle')
  const [isPaused, setIsPaused] = useState(false)
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [edgeLaps, setEdgeLaps] = useState<EdgeLap[]>([])
  const [displayActiveTime, setDisplayActiveTime] = useState(0)
  const [displayEdgeTime, setDisplayEdgeTime] = useState(0)
  const { checkAchievements } = useAchievements()

  const operationLockRef = useRef(false)

  const syncDisplayTimes = useCallback(() => {
    const now = Date.now()
    if (state === 'active' && !isPaused && lastActiveStart) {
      setDisplayActiveTime(activeTime + (now - lastActiveStart.getTime()))
    } else {
      setDisplayActiveTime(activeTime)
    }

    if (state === 'edging' && currentEdgeStart) {
      setDisplayEdgeTime(edgeTime + (now - currentEdgeStart.getTime()))
    } else {
      setDisplayEdgeTime(edgeTime)
    }
  }, [state, isPaused, activeTime, edgeTime, lastActiveStart, currentEdgeStart])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    syncDisplayTimes()
    if ((state === 'active' && !isPaused) || state === 'edging') {
      intervalId = setInterval(syncDisplayTimes, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [state, isPaused, syncDisplayTimes])

  useEffect(() => {
    const onVisibilityChange = () => syncDisplayTimes()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [syncDisplayTimes])

  const startSession = useCallback(async () => {
    if (operationLockRef.current) return
    operationLockRef.current = true

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

      if (error || !data?.id) {
        console.error('Error creating session:', error)
        toast.error('Failed to start session')
        return
      }

      setSessionId(data.id)
      setLastActiveStart(now)
      setIsPaused(false)
      setState('active')
    } catch (err) {
      console.error('Session start error:', err)
      toast.error('Failed to start session')
    } finally {
      operationLockRef.current = false
    }
  }, [])

  const pauseSession = useCallback(async () => {
    if (!sessionId || state !== 'active' || isPaused || !lastActiveStart || operationLockRef.current) return
    operationLockRef.current = true

    try {
      const now = new Date()
      const newActiveTime = activeTime + (now.getTime() - lastActiveStart.getTime())
      const { error } = await supabase
        .from('sessions')
        .update({ active_duration: newActiveTime })
        .eq('id', sessionId)

      if (error) throw error

      setActiveTime(newActiveTime)
      setDisplayActiveTime(newActiveTime)
      setLastActiveStart(null)
      setIsPaused(true)
    } catch (err) {
      console.error('Error pausing session:', err)
      toast.error('Failed to pause session')
    } finally {
      operationLockRef.current = false
    }
  }, [sessionId, state, isPaused, lastActiveStart, activeTime])

  const resumeSession = useCallback(() => {
    if (!sessionId || state !== 'active' || !isPaused || operationLockRef.current) return
    setLastActiveStart(new Date())
    setIsPaused(false)
  }, [sessionId, state, isPaused])

  const startEdge = useCallback(async () => {
    if (!sessionId || state !== 'active' || isPaused) {
      toast.error('No active session')
      return
    }
    if (operationLockRef.current) return
    operationLockRef.current = true
    const now = new Date()

    try {
      if (lastActiveStart) {
        const newActiveTime = activeTime + (now.getTime() - lastActiveStart.getTime())
        setActiveTime(newActiveTime)
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ active_duration: newActiveTime })
          .eq('id', sessionId)
        if (updateError) throw updateError
      }

      const { error: edgeError } = await supabase
        .from('edge_events')
        .insert({ session_id: sessionId, start_time: now.toISOString() })
      if (edgeError) throw edgeError

      setEdgeLaps(prev => [...prev, { startTime: now }])
      setCurrentEdgeStart(now)
      setLastActiveStart(null)
      setState('edging')
    } catch (err) {
      console.error('Error recording edge:', err)
      toast.error('Failed to record edge event')
    } finally {
      operationLockRef.current = false
    }
  }, [sessionId, state, isPaused, lastActiveStart, activeTime])

  const endEdge = useCallback(async () => {
    if (!sessionId || !currentEdgeStart || state !== 'edging') return
    if (operationLockRef.current) return
    operationLockRef.current = true
    const now = new Date()

    try {
      const lapDuration = now.getTime() - currentEdgeStart.getTime()
      const newEdgeTime = edgeTime + lapDuration
      const { error } = await supabase
        .from('edge_events')
        .update({ end_time: now.toISOString(), duration: lapDuration })
        .eq('session_id', sessionId)
        .is('end_time', null)
      if (error) throw error

      setEdgeTime(newEdgeTime)
      setEdgeLaps(prev => {
        const newLaps = [...prev]
        const currentLap = newLaps[newLaps.length - 1]
        if (currentLap) newLaps[newLaps.length - 1] = { ...currentLap, endTime: now, duration: lapDuration }
        return newLaps
      })
      setLastActiveStart(now)
      setCurrentEdgeStart(null)
      setState('active')
    } catch (err) {
      console.error('Error ending edge:', err)
      toast.error('Failed to update edge event')
    } finally {
      operationLockRef.current = false
    }
  }, [currentEdgeStart, sessionId, state, edgeTime])

  const finishSession = useCallback(async () => {
    if (!sessionId) {
      toast.error('No active session to finish')
      return
    }
    if (operationLockRef.current) return
    operationLockRef.current = true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not found, cannot save session.')
        return
      }

      const now = new Date()
      let finalActiveTime = activeTime
      let finalEdgeTime = edgeTime
      let finalFinishedDuringEdge = false

      if (state === 'active' && !isPaused && lastActiveStart) {
        finalActiveTime += now.getTime() - lastActiveStart.getTime()
      } else if (state === 'edging' && currentEdgeStart) {
        finalEdgeTime += now.getTime() - currentEdgeStart.getTime()
        finalFinishedDuringEdge = true
      }
      const finalTotalDuration = finalActiveTime + finalEdgeTime

      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: now.toISOString(),
          active_duration: finalActiveTime,
          edge_duration: finalEdgeTime,
          total_duration: finalTotalDuration,
          finished_during_edge: finalFinishedDuringEdge
        })
        .eq('id', sessionId)
      if (error) throw error

      setActiveTime(finalActiveTime)
      setEdgeTime(finalEdgeTime)
      setLastActiveStart(null)
      setCurrentEdgeStart(null)
      setIsPaused(false)
      setState('finished')
      toast.success('Session finished and saved!')

      try {
        const { data: sessionRow, error: fetchError } = await supabase
          .from('sessions')
          .select('*, edge_events!fk_session (*)')
          .eq('id', sessionId)
          .single()
        if (!fetchError && sessionRow) await checkAchievements(sessionRow as DBSession)
      } catch (achErr) {
        console.error('Achievement check error:', achErr)
      }
    } catch (err) {
      console.error('Error finishing session:', err)
      toast.error('Failed to finish session')
    } finally {
      operationLockRef.current = false
    }
  }, [sessionId, state, isPaused, lastActiveStart, currentEdgeStart, activeTime, edgeTime, checkAchievements])

  const resetTimer = useCallback(() => {
    setState('idle')
    setIsPaused(false)
    setActiveTime(0)
    setEdgeTime(0)
    setDisplayActiveTime(0)
    setDisplayEdgeTime(0)
    setCurrentEdgeStart(null)
    setLastActiveStart(null)
    setSessionId(null)
    setEdgeLaps([])
  }, [])

  return {
    state,
    isPaused,
    activeTime: displayActiveTime,
    edgeTime: displayEdgeTime,
    edgeLaps,
    startSession,
    pauseSession,
    resumeSession,
    startEdge,
    endEdge,
    finishSession,
    resetTimer
  }
}
