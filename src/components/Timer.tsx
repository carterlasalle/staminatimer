'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function Timer() {
  const [state, setState] = useState<TimerState>('idle')
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [finishedDuringEdge, setFinishedDuringEdge] = useState(false)

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
        console.error('Error recording edge event:', error)
      }
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
        console.error('Error updating edge event:', error)
      }
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
        console.error('Error finishing session:', error)
      }
    }

    setActiveTime(finalActiveTime)
    setEdgeTime(finalEdgeTime)
    setState('finished')
  }, [state, lastActiveStart, currentEdgeStart, sessionId, activeTime, edgeTime, finishedDuringEdge])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-bold">
        {state === 'idle' && 'Ready to Start'}
        {state === 'active' && 'Active'}
        {state === 'edging' && 'Edging'}
        {state === 'finished' && 'Session Complete'}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>Active Time: {formatDuration(activeTime)}</div>
        <div>Edge Time: {formatDuration(edgeTime)}</div>
      </div>

      <div className="flex gap-4">
        {state === 'idle' && (
          <Button onClick={startSession}>Start</Button>
        )}
        {state === 'active' && (
          <Button onClick={startEdge}>Edge</Button>
        )}
        {state === 'edging' && (
          <Button onClick={endEdge}>End Edge</Button>
        )}
        {(state === 'active' || state === 'edging') && (
          <Button onClick={finishSession} variant="destructive">
            Finish
          </Button>
        )}
      </div>
    </div>
  )
} 