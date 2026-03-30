'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Play, Timer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type DailyHabitsProps = {
  squatDoneToday: boolean
  squatStreak: number
  kegelComboDoneToday: boolean
  onMarkSquatDone: () => void | Promise<void>
  onMarkKegelComboDone: () => void | Promise<void>
}

type ComboStep = {
  label: string
  seconds: number
}

const comboSteps: ComboStep[] = [
  { label: 'Kegel contraction', seconds: 6 },
  { label: 'Reverse kegel hold', seconds: 10 },
  { label: 'Kegel contraction', seconds: 6 },
  { label: 'Reverse kegel hold', seconds: 10 },
]

export function DailyHabits({
  squatDoneToday,
  squatStreak,
  kegelComboDoneToday,
  onMarkSquatDone,
  onMarkKegelComboDone,
}: DailyHabitsProps) {
  const [comboRunning, setComboRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepRemainingSec, setStepRemainingSec] = useState(comboSteps[0].seconds)

  const currentStep = useMemo(() => comboSteps[currentStepIndex], [currentStepIndex])

  useEffect(() => {
    if (!comboRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      setStepRemainingSec((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [comboRunning])

  useEffect(() => {
    if (!comboRunning || stepRemainingSec > 0) {
      return
    }

    if (currentStepIndex >= comboSteps.length - 1) {
      setComboRunning(false)
      setCurrentStepIndex(0)
      setStepRemainingSec(comboSteps[0].seconds)
      void onMarkKegelComboDone()
      return
    }

    const nextIndex = currentStepIndex + 1
    setCurrentStepIndex(nextIndex)
    setStepRemainingSec(comboSteps[nextIndex].seconds)
  }, [comboRunning, currentStepIndex, onMarkKegelComboDone, stepRemainingSec])

  const startCombo = () => {
    setComboRunning(true)
    setCurrentStepIndex(0)
    setStepRemainingSec(comboSteps[0].seconds)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deep Squat (2 min daily)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <svg viewBox="0 0 160 120" className="h-24 w-full rounded-md border border-border/50 bg-muted/30 p-2">
            <circle cx="80" cy="20" r="10" fill="currentColor" className="text-muted-foreground" />
            <line x1="80" y1="30" x2="80" y2="58" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="80" y1="58" x2="52" y2="80" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="80" y1="58" x2="108" y2="80" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="52" y1="80" x2="44" y2="105" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="108" y1="80" x2="116" y2="105" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="80" y1="42" x2="54" y2="54" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
            <line x1="80" y1="42" x2="106" y2="54" stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Knees wide, heels flat, elbows inside knees with a gentle outward push.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Streak: {squatStreak} day(s)</span>
            <Button
              size="sm"
              variant={squatDoneToday ? 'secondary' : 'default'}
              onClick={() => void onMarkSquatDone()}
              disabled={squatDoneToday}
            >
              {squatDoneToday ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done Today
                </>
              ) : (
                'Mark Done'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kegel-RK Combo (2 sets)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            6s contraction, then immediate 10s reverse kegel. Repeat twice.
          </p>
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Current step</p>
            <p className="text-sm font-medium">{currentStep.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Step {currentStepIndex + 1} / {comboSteps.length}
            </p>
            <p className="mt-2 text-lg font-semibold">{stepRemainingSec}s</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={startCombo}
              disabled={comboRunning}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Guided Timer
            </Button>
            {kegelComboDoneToday && (
              <span className="inline-flex items-center text-xs text-emerald-500">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Done
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">No-Flex After Urinating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Skip the squeeze reflex after urinating. Shake gently or wait instead.
          </p>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-400">
              This habit matters because repeated post-urination flexing reinforces involuntary pelvic floor contraction.
            </p>
          </div>
          <div className="inline-flex items-center text-xs text-muted-foreground">
            <Timer className="mr-1.5 h-3.5 w-3.5" />
            Gentle reminder only, not intrusive
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
