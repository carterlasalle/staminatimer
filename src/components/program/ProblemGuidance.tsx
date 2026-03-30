'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/lib/supabase/types'

type ProgramSessionRow = Database['public']['Tables']['program_sessions']['Row']

type GuidanceItem = {
  id: string
  title: string
  body: string
}

type ProblemGuidanceProps = {
  sessions: ProgramSessionRow[]
}

export function ProblemGuidance({ sessions }: ProblemGuidanceProps) {
  const guidance = buildGuidance(sessions)

  if (guidance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Context-Aware Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No friction pattern detected right now. Keep logging sessions and this panel will surface targeted guidance automatically.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Context-Aware Guidance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {guidance.map((item) => (
          <div key={item.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function buildGuidance(sessions: ProgramSessionRow[]): GuidanceItem[] {
  const items: GuidanceItem[] = []

  const earlyPhaseSessions = sessions.filter((s) => (s.phase ?? 0) <= 2).slice(0, 6)
  const fastSpikeCount = earlyPhaseSessions.filter(
    (s) => (s.highest_arousal_reached ?? 0) >= 9 && (s.duration_ms ?? 0) < 5 * 60 * 1000
  ).length
  if (fastSpikeCount >= 2) {
    items.push({
      id: 'fast-spike-early',
      title: 'Fast arousal spike detected in early phase',
      body:
        'Your arousal is climbing faster than average. Next session: extend the 5-minute warm-up, keep the first 3 minutes of Stage 2 intentionally slow, and treat any breath-holding as an immediate STOP cue.',
    })
  }

  const lowArousalPatternCount = earlyPhaseSessions.filter(
    (s) => (s.highest_arousal_reached ?? 0) <= 5 && (s.cycles_completed ?? 0) <= 1
  ).length
  if (lowArousalPatternCount >= 2) {
    items.push({
      id: 'erection-maintenance',
      title: 'Potential erection maintenance adaptation pattern',
      body:
        'If erections dip without intense stimulation, pause and take 3 slow breaths, then restart lightly. Avoid chasing erection with harder/faster stimulation. The threshold usually normalizes in 2-3 weeks.',
    })
  }

  const jawProxySessions = sessions.filter((s) => (s.phase ?? 0) >= 2).slice(0, 5)
  const breathNoCount = jawProxySessions.filter((s) => s.breathing_maintained === 'no').length
  if (breathNoCount >= 2) {
    items.push({
      id: 'jaw-tension-proxy',
      title: 'Breath interruption pattern suggests full-body tension',
      body:
        'Before next session, spend 60 seconds on exaggerated jaw drops (open, hold, release). During Stage 2, relax your jaw whenever arousal rises. Jaw release often reduces pelvic floor tension.',
    })
  }

  const accidentalPhase45 = sessions.find(
    (s) => (s.phase === 4 || s.phase === 5) && Boolean(s.accidentally_finished)
  )
  const successfulEarly = sessions.filter(
    (s) => (s.phase ?? 0) <= 3 && !s.accidentally_finished && !s.ended_early
  ).length
  if (accidentalPhase45 && successfulEarly >= 4) {
    items.push({
      id: 'phase45-accidental',
      title: 'Phase 4/5 accident detected after early-phase success',
      body:
        'This is common during cliffhanger transition. Next session, enter 7-8 for short 30-second windows first, then drop to 5-6 before rebuilding. Expand zone time gradually instead of forcing long intervals.',
    })
  }

  const phase7Recent = sessions.filter((s) => s.phase === 7).slice(0, 3)
  const repeatedSinglePosition =
    phase7Recent.length === 3 &&
    phase7Recent.every((s) => (s.positions_used ?? []).length === 1) &&
    new Set(phase7Recent.map((s) => s.positions_used?.[0] ?? '')).size === 1

  if (repeatedSinglePosition) {
    items.push({
      id: 'position-repeat',
      title: 'Same Phase 7 position repeated',
      body:
        "You've used one position repeatedly. Rotate to a less familiar position next session to force control generalization across different muscle activation patterns.",
    })
  }

  const phase3Recent = sessions.filter((s) => s.phase === 3).slice(0, 3)
  const lowImageryThreeInRow =
    phase3Recent.length === 3 &&
    phase3Recent.every((s) => (s.imagery_rating ?? 5) <= 2)
  if (lowImageryThreeInRow) {
    items.push({
      id: 'low-imagery-streak',
      title: 'Imagery quality has stayed low for three sessions',
      body:
        'Weak imagery is common after long porn conditioning. Before your next session, run a 2-minute sensory preview of your scenario (visual, touch, sound, emotional tone) before any stimulation.',
    })
  }

  return items
}
