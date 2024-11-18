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

  // Save session data to localStorage as backup
  useEffect(() => {
    if (state !== 'idle') {
      const sessionData = {
        state,
        sessionStart,
        activeTime,
        edgeTime,
        currentEdgeStart,
        lastActiveStart,
        sessionId,
        finishedDuringEdge,
        edgeLaps
      }
      localStorage.setItem('current-session', JSON.stringify(sessionData))
    } else {
      localStorage.removeItem('current-session')
    }
  }, [state, sessionStart, activeTime, edgeTime, currentEdgeStart, lastActiveStart, sessionId, finishedDuringEdge, edgeLaps])

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

  // ... rest of the timer logic ...

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