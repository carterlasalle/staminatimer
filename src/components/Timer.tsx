'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

export function Timer() {
  const [state, setState] = useState<TimerState>('idle')
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)

  const startSession = useCallback(() => {
    const now = new Date()
    setSessionStart(now)
    setLastActiveStart(now)
    setState('active')
  }, [])

  const startEdge = useCallback(() => {
    const now = new Date()
    if (lastActiveStart) {
      setActiveTime(prev => prev + (now.getTime() - lastActiveStart.getTime()))
    }
    setCurrentEdgeStart(now)
    setState('edging')
  }, [lastActiveStart])

  const endEdge = useCallback(() => {
    const now = new Date()
    if (currentEdgeStart) {
      setEdgeTime(prev => prev + (now.getTime() - currentEdgeStart.getTime()))
    }
    setLastActiveStart(now)
    setCurrentEdgeStart(null)
    setState('active')
  }, [currentEdgeStart])

  const finishSession = useCallback(() => {
    const now = new Date()
    if (state === 'active' && lastActiveStart) {
      setActiveTime(prev => prev + (now.getTime() - lastActiveStart.getTime()))
    } else if (state === 'edging' && currentEdgeStart) {
      setEdgeTime(prev => prev + (now.getTime() - currentEdgeStart.getTime()))
    }
    setState('finished')
  }, [state, lastActiveStart, currentEdgeStart])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-bold">
        {state === 'idle' && 'Ready to Start'}
        {state === 'active' && 'Active'}
        {state === 'edging' && 'Edging'}
        {state === 'finished' && 'Session Complete'}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>Active Time: {Math.floor(activeTime / 1000)}s</div>
        <div>Edge Time: {Math.floor(edgeTime / 1000)}s</div>
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