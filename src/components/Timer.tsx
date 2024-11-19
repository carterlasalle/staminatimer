'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Timer as TimerIcon } from 'lucide-react'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

type EdgeLap = {
  startTime: Date
  endTime?: Date
  duration?: number
}

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
  const [displayActiveTime, setDisplayActiveTime] = useState(0)
  const [displayEdgeTime, setDisplayEdgeTime] = useState(0)
  const [edgeLaps, setEdgeLaps] = useState<EdgeLap[]>([])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (state === 'active' && lastActiveStart) {
      interval = setInterval(() => {
        const now = new Date()
        setDisplayActiveTime(activeTime + (now.getTime() - lastActiveStart.getTime()))
      }, 1000)
    } else if (state === 'edging' && currentEdgeStart) {
      interval = setInterval(() => {
        const now = new Date()
        setDisplayEdgeTime(edgeTime + (now.getTime() - currentEdgeStart.getTime()))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state, lastActiveStart, currentEdgeStart, activeTime, edgeTime])

  const startSession = useCallback(async () => {
    const now = new Date()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        start_time: now.toISOString(),
        active_duration: 0,
        edge_duration: 0,
        user_id: user?.id
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-2xl">
          <TimerIcon className="mr-2" />
          {state === 'idle' && 'Ready to Start'}
          {state === 'active' && 'Active'}
          {state === 'edging' && 'Edging'}
          {state === 'finished' && 'Session Complete'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Active Time</p>
            <p className="text-2xl font-bold">{formatDuration(state === 'active' ? displayActiveTime : activeTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Edge Time</p>
            <p className="text-2xl font-bold">{formatDuration(state === 'edging' ? displayEdgeTime : edgeTime)}</p>
          </div>
        </div>

        {edgeLaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Edge Laps</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {edgeLaps.map((lap, index) => (
                <div key={index} className="flex justify-between items-center bg-secondary p-2 rounded">
                  <span>Edge {index + 1}</span>
                  <span>{lap.duration ? formatDuration(lap.duration) : 'In Progress'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
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
          {state === 'finished' && (
            <Button onClick={resetTimer} variant="outline">
              Start New Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 