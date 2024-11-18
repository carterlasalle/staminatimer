import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type TimerState = 'idle' | 'active' | 'edging' | 'finished'

export type EdgeLap = {
  startTime: Date
  endTime?: Date
  duration?: number
}

export function useTimer() {
  const [state, setState] = useState<TimerState>('idle')
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [finishedDuringEdge, setFinishedDuringEdge] = useState(false)
  const [displayActiveTime, setDisplayActiveTime] = useState(0)
  const [displayEdgeTime, setDisplayEdgeTime] = useState(0)
  const [edgeLaps, setEdgeLaps] = useState<EdgeLap[]>([])
  
  const animationFrameRef = useRef<number>()
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Prevent screen from sleeping during active sessions
  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator && state !== 'idle') {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.error('Wake Lock error:', err)
        }
      }
    }

    requestWakeLock()
    return () => {
      wakeLockRef.current?.release().catch(console.error)
    }
  }, [state])

  // Timer update using requestAnimationFrame
  useEffect(() => {
    function updateTimer() {
      const now = new Date()
      
      if (state === 'active' && lastActiveStart) {
        setDisplayActiveTime(activeTime + (now.getTime() - lastActiveStart.getTime()))
      } else if (state === 'edging' && currentEdgeStart) {
        setDisplayEdgeTime(edgeTime + (now.getTime() - currentEdgeStart.getTime()))
      }

      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }

    if (state === 'active' || state === 'edging') {
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [state, lastActiveStart, currentEdgeStart, activeTime, edgeTime])

  const startSession = useCallback(async () => {
    const now = new Date()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        start_time: now.toISOString(),
        active_duration: 0,
        edge_duration: 0,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to start session')
      console.error('Error starting session:', error)
      return
    }

    setSessionId(data.id)
    setSessionStart(now)
    setLastActiveStart(now)
    setState('active')
  }, [])

  const startEdge = useCallback(async () => {
    const now = new Date()
    if (lastActiveStart && sessionId) {
      const newActiveTime = activeTime + (now.getTime() - lastActiveStart.getTime())
      setActiveTime(newActiveTime)

      const { error } = await supabase
        .from('edge_events')
        .insert({
          session_id: sessionId,
          start_time: now.toISOString(),
        })

      if (error) {
        toast.error('Failed to record edge event')
        console.error('Error recording edge event:', error)
      }

      setEdgeLaps(prev => [...prev, { startTime: now }])
    }
    setCurrentEdgeStart(now)
    setState('edging')
  }, [lastActiveStart, sessionId, activeTime])

  const endEdge = useCallback(async () => {
    const now = new Date()
    if (currentEdgeStart && sessionId) {
      const newEdgeTime = edgeTime + (now.getTime() - currentEdgeStart.getTime())
      setEdgeTime(newEdgeTime)

      const { error } = await supabase
        .from('edge_events')
        .update({
          end_time: now.toISOString(),
          duration: now.getTime() - currentEdgeStart.getTime(),
        })
        .eq('session_id', sessionId)
        .is('end_time', null)

      if (error) {
        toast.error('Failed to update edge event')
        console.error('Error updating edge event:', error)
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
    }
    setLastActiveStart(now)
    setCurrentEdgeStart(null)
    setState('active')
  }, [currentEdgeStart, sessionId, edgeTime])

  const finishSession = useCallback(async () => {
    const now = new Date()
    let finalActiveTime = activeTime
    let finalEdgeTime = edgeTime
    
    if (state === 'active' && lastActiveStart) {
      finalActiveTime += (now.getTime() - lastActiveStart.getTime())
    } else if (state === 'edging' && currentEdgeStart) {
      finalEdgeTime += (now.getTime() - currentEdgeStart.getTime())
      setFinishedDuringEdge(true)
    }

    if (sessionId) {
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: now.toISOString(),
          active_duration: finalActiveTime,
          edge_duration: finalEdgeTime,
          finished_during_edge: finishedDuringEdge,
          total_duration: finalActiveTime + finalEdgeTime,
        })
        .eq('id', sessionId)

      if (error) {
        toast.error('Failed to finish session')
        console.error('Error finishing session:', error)
      }
    }

    setActiveTime(finalActiveTime)
    setEdgeTime(finalEdgeTime)
    setState('finished')
  }, [state, lastActiveStart, currentEdgeStart, sessionId, activeTime, edgeTime, finishedDuringEdge])

  const resetTimer = useCallback(() => {
    setState('idle')
    setSessionStart(null)
    setActiveTime(0)
    setEdgeTime(0)
    setCurrentEdgeStart(null)
    setLastActiveStart(null)
    setSessionId(null)
    setFinishedDuringEdge(false)
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