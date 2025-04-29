'use client'

import { useTimer } from '@/hooks/useTimer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Timer as TimerIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export function Timer() {
  const {
    state,
    activeTime,
    edgeTime,
    edgeLaps,
    startSession,
    startEdge,
    endEdge,
    finishSession,
    resetTimer
  } = useTimer()

  return (
    <Card className="w-full max-w-md mx-auto lg:max-w-lg xl:max-w-xl">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
        <CardTitle className="text-xl sm:text-2xl mb-4 sm:mb-0 flex items-center">
          <TimerIcon className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />
          <span>
            {state === 'idle' && 'Ready to Start'}
            {state === 'active' && 'Active'}
            {state === 'edging' && 'Edging'}
            {state === 'finished' && 'Session Complete'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Active Time</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {formatDuration(activeTime)}
            </p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Edge Time</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {formatDuration(edgeTime)}
            </p>
          </div>
        </div>

        {edgeLaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Edge Laps</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {edgeLaps.map((lap, index) => (
                <div key={index} className="flex justify-between items-center bg-secondary p-2 rounded">
                  <span>Edge {index + 1}</span>
                  <span>
                    {lap.duration ? formatDuration(lap.duration) : 'In Progress'}
                  </span>
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