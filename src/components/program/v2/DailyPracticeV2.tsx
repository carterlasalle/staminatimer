'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { formatTarget } from '@/lib/program/protocol-v2'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const PRACTICE_STORAGE_KEY = 'program_v2_daily_practice'

const PRACTICE_SECONDS = 6 * 60

function todayKey(): string {
  const date = new Date()

  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

/**
 * The core daily practice: six minutes of breathing and lower-body relaxation.
 * No hard contractions, no forced reverse kegels, and no claim that every user
 * has a tight pelvic floor.
 */
export function DailyPracticeV2() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [completedOn, setCompletedOn] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY)
      setCompletedOn(raw)
    } catch {
      setCompletedOn(null)
    }
  }, [])

  useEffect(() => {
    if (!running) {
      return
    }

    const startedAt = Date.now() - elapsedMs

    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 250)

    return () => window.clearInterval(intervalId)
    // `elapsedMs` is only a snapshot at start time; depending on it would restart the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const complete = () => {
    const key = todayKey()

    try {
      window.localStorage.setItem(PRACTICE_STORAGE_KEY, key)
    } catch {
      // Best effort only.
    }

    setCompletedOn(key)
    setRunning(false)
    setElapsedMs(0)
  }

  const doneToday = completedOn === todayKey()
  const remainingMs = Math.max(0, PRACTICE_SECONDS * 1000 - elapsedMs)

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Daily Practice: 6-Minute Reset</CardTitle>
        <p className="text-sm text-muted-foreground">
          Roughly 4 second inhale, 6 second exhale. Let the lower abdomen, glutes, inner thighs and
          pelvic floor soften. Do not strain or push, and do not hold hard contractions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {doneToday ? (
          <div className="flex items-center gap-2 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Completed today. Repeating it is fine but not required.
          </div>
        ) : null}

        {running ? (
          <>
            <BreathingPacer />
            <p className="text-center text-sm text-muted-foreground">
              {formatTarget(elapsedMs)} elapsed · {formatTarget(remainingMs)} remaining
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setRunning(false)}>
                Pause
              </Button>
              <Button onClick={complete}>Complete practice</Button>
            </div>
          </>
        ) : (
          <Button onClick={() => setRunning(true)}>Start 6-minute reset</Button>
        )}

        <p className="text-xs text-muted-foreground">
          General mobility such as deep squats may be a useful addition for some people, but it is
          optional, is not required for progression, and is not presented as a treatment for
          premature ejaculation.
        </p>
      </CardContent>
    </Card>
  )
}
