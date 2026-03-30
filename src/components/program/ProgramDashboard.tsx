'use client'

import { DailyHabits } from '@/components/program/DailyHabits'
import { EjaculationTracker } from '@/components/program/EjaculationTracker'
import { EncounterLog } from '@/components/program/EncounterLog'
import { PhaseCard } from '@/components/program/PhaseCard'
import { ProblemGuidance } from '@/components/program/ProblemGuidance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDailyHabits } from '@/hooks/useDailyHabits'
import { useProgramProgress } from '@/hooks/useProgramProgress'
import { ArrowRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type PhaseMeta = {
  phase: number
  title: string
  summary: string
  goal: string
  briefing: string
}

const phases: PhaseMeta[] = [
  {
    phase: 1,
    title: 'Awareness Foundation',
    summary: 'Learn your arousal scale and break the rush reflex.',
    goal: '5 qualifying sessions, at least 3 cycles each, no accidental finish.',
    briefing:
      'Phase 1 is awareness, not intensity. You are training the nervous system to experience arousal without urgency.',
  },
  {
    phase: 2,
    title: 'Breathwork Integration',
    summary: 'Automate continuous breathing with long exhales.',
    goal: '5 qualifying sessions with deliberate breath continuity.',
    briefing:
      'Breath-holding spikes arousal. Long, uninterrupted exhales act as your primary braking system.',
  },
  {
    phase: 3,
    title: 'Mental Imagery Without Porn',
    summary: 'Shift arousal generation toward imagination and sensation.',
    goal: '5 qualifying sessions with imagery practice.',
    briefing:
      'This phase rebuilds arousal pathways that transfer better to real encounters by reducing reliance on novelty feeds.',
  },
  {
    phase: 4,
    title: 'Cliffhanger Entry',
    summary: 'Move from avoiding peaks to surfing 7-8.',
    goal: '5 qualifying sessions with reduced complete stops over time.',
    briefing:
      'Phase 4 introduces controlled exposure to high arousal. The target is regulation inside 7-8, not panic at 9.',
  },
  {
    phase: 5,
    title: 'Extended Cliffhanger With Contact',
    summary: 'Regulate while maintaining contact instead of full removal.',
    goal: '5 qualifying sessions with freeze skill at 9.',
    briefing:
      'At 9, freeze with hand in place and breathe down. This is closer to real-world regulation demands.',
  },
  {
    phase: 6,
    title: 'Toy Integration',
    summary: 'Recalibrate using stimulation closer to penetration.',
    goal: '5 qualifying sessions using sleeve/Fleshlight-style stimulus.',
    briefing:
      'Toy sensation can feel like starting over at first. Use pressure modulation, freeze, and breath to re-expand the ceiling.',
  },
  {
    phase: 7,
    title: 'Simulated Thrusting',
    summary: 'Transfer control from hand motion to hip-driven thrusting.',
    goal: '5 qualifying sessions with position rotation and sprint bursts.',
    briefing:
      'Different positions recruit different muscle patterns. Rotation is required for control generalization.',
  },
  {
    phase: 8,
    title: 'Maintenance and Mastery',
    summary: 'Freeform practice with optional real encounter logging.',
    goal: 'Sustain skills, keep practice consistent, and track real-world transfer.',
    briefing:
      'Phase 8 is maintenance: structured enough to preserve gains, flexible enough to fit real life.',
  },
]

const TOY_PREF_KEY = 'program_has_toy'
const phase7Positions = [
  'On your back (upward thrust)',
  'On your knees (missionary simulation)',
  'On your side (spooning simulation)',
  'Kneeling over toy',
]

export function ProgramDashboard() {
  const { loading, error, progress, sessions } = useProgramProgress()
  const {
    squatDoneToday,
    squatStreak,
    kegelComboDoneToday,
    markSquatDone,
    markKegelComboDone,
  } = useDailyHabits()
  const [hasToy, setHasToy] = useState<boolean>(false)
  const [showEncounterLog, setShowEncounterLog] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TOY_PREF_KEY)
      setHasToy(raw === 'true')
    } catch {
      setHasToy(false)
    }
  }, [])

  const saveToyPreference = (value: boolean) => {
    setHasToy(value)
    try {
      localStorage.setItem(TOY_PREF_KEY, value ? 'true' : 'false')
    } catch {
      // Ignore localStorage write errors
    }
  }

  const currentPhase = progress?.current_phase ?? 1
  const currentMeta = phases.find((item) => item.phase === currentPhase) ?? phases[0]
  const sessionsInPhase = progress?.sessions_in_current_phase ?? 0
  const qualifyingSessions = progress?.qualifying_sessions_in_phase ?? 0
  const totalSessions = progress?.total_sessions ?? 0
  const sessionsSinceLastEjaculation = progress?.sessions_since_ejaculation ?? 0

  const phaseProgressPct = useMemo(() => {
    if (currentPhase === 8) {
      return 100
    }
    return Math.min(100, Math.round((qualifyingSessions / 5) * 100))
  }, [currentPhase, qualifyingSessions])

  const phase7PositionSuggestion = useMemo(() => {
    const recentPhase7 = sessions.filter((item) => item.phase === 7).slice(0, 2)
    if (recentPhase7.length < 2) {
      return null
    }
    const missingIndex = phase7Positions.findIndex((position) =>
      recentPhase7.every((item) => !(item.positions_used ?? []).includes(position))
    )
    if (missingIndex === -1) {
      return null
    }
    return `You haven't used position ${missingIndex + 1} in 2 sessions. Try it today.`
  }, [sessions])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded bg-muted" />
          <div className="h-44 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="inline-flex items-center text-xs font-medium uppercase tracking-wider text-primary">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                Guided Program
              </p>
              <CardTitle className="text-2xl">Phase {currentMeta.phase}: {currentMeta.title}</CardTitle>
            </div>
            <Link href="/program/session">
              <Button>
                Start Guided Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{currentMeta.briefing}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Metric label="Total Sessions" value={`${totalSessions}`} />
          <Metric label="Sessions In Phase" value={`${sessionsInPhase}`} />
          <Metric label="Qualifying In Phase" value={`${qualifyingSessions} / 5`} />
          <Metric label="Phase Progress" value={`${phaseProgressPct}%`} />
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-red-400">{error}</CardContent>
        </Card>
      )}

      <EjaculationTracker sessionsSinceLastEjaculation={sessionsSinceLastEjaculation} />

      {currentPhase >= 6 && !hasToy && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-base">Phase 6 Gear Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Phase 6 requires a quality masturbation sleeve/Fleshlight-style toy. You can keep completing Phase 5 sessions until ready.
            </p>
            <Button size="sm" onClick={() => saveToyPreference(true)}>
              I have a toy and I&apos;m ready
            </Button>
          </CardContent>
        </Card>
      )}

      <DailyHabits
        squatDoneToday={squatDoneToday}
        squatStreak={squatStreak}
        kegelComboDoneToday={kegelComboDoneToday}
        onMarkSquatDone={markSquatDone}
        onMarkKegelComboDone={markKegelComboDone}
      />

      <ProblemGuidance sessions={sessions} />

      {phase7PositionSuggestion && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-base">Phase 7 Position Rotation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{phase7PositionSuggestion}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {phases.map((phaseItem) => (
          <PhaseCard
            key={phaseItem.phase}
            phase={phaseItem.phase}
            title={phaseItem.title}
            summary={phaseItem.summary}
            goal={phaseItem.goal}
            isCurrent={phaseItem.phase === currentPhase}
            isCompleted={phaseItem.phase < currentPhase}
          />
        ))}
      </div>

      {currentPhase === 8 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Real Encounter Reflection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Did you apply these skills in a real encounter since your last session?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowEncounterLog(true)}>
                Yes, log it
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowEncounterLog(false)}>
                No
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentPhase === 8 && showEncounterLog && <EncounterLog />}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
