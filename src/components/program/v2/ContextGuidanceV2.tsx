'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTarget, type ProgressionGateState } from '@/lib/program/protocol-v2'
import type { ProgramV2RescueEventRow, ProgramV2SessionRow } from '@/hooks/useProgramV2Progress'

type ContextGuidanceV2Props = {
  sessions: ProgramV2SessionRow[]
  rescueEvents: ProgramV2RescueEventRow[]
  gate: ProgressionGateState | null
  currentTargetMs: number
}

type GuidanceItem = {
  id: string
  title: string
  body: string
}

const EARLY_RESCUE_THRESHOLD_MS = 3 * 60 * 1000

/**
 * Context-aware guidance derived from the user's own recent sessions.
 *
 * Every item describes an observed pattern and a concrete, optional adjustment.
 * It never diagnoses a cause and never claims a guaranteed timeline.
 */
export function ContextGuidanceV2({
  sessions,
  rescueEvents,
  gate,
  currentTargetMs,
}: ContextGuidanceV2Props) {
  const controlSessions = sessions.filter((session) => session.session_type === 'control')
  const items: GuidanceItem[] = []

  const loopSession = controlSessions.find((session) => session.anti_loop_terminated)

  if (loopSession) {
    const events = rescueEvents
      .filter((event) => event.session_id === loopSession.id)
      .sort((a, b) => a.started_offset_ms - b.started_offset_ms)

    let shortestGap: number | null = null

    for (let index = 1; index < events.length; index += 1) {
      const previousEnd = events[index - 1].ended_offset_ms
      const nextStart = events[index].started_offset_ms

      if (previousEnd === null) {
        continue
      }

      const gap = nextStart - previousEnd

      if (gap >= 0 && (shortestGap === null || gap < shortestGap)) {
        shortestGap = gap
      }
    }

    items.push({
      id: 'rescue-loop',
      title: 'Repeated rescue cycling',
      body:
        shortestGap === null
          ? 'Two rescue stops happened close together. Next session, begin at a lower intensity and react earlier to acceleration instead of waiting for urgency to build.'
          : `Two rescue stops occurred within ${formatTarget(shortestGap)} of active stimulation. Next session, begin at a lower intensity and react earlier to acceleration.`,
    })
  }

  const recentControl = controlSessions.slice(0, 4)

  if (recentControl.length >= 3) {
    const earlyFirstRescue = recentControl.filter((session) => {
      const events = rescueEvents
        .filter((event) => event.session_id === session.id)
        .sort((a, b) => a.started_offset_ms - b.started_offset_ms)

      const first = events[0]

      return first !== undefined && first.started_offset_ms <= EARLY_RESCUE_THRESHOLD_MS
    }).length

    if (earlyFirstRescue >= 3) {
      items.push({
        id: 'early-acceleration',
        title: 'Early acceleration',
        body: `Your first rescue occurred very early in ${earlyFirstRescue} of your last ${recentControl.length} Control sessions. Start the first few minutes more conservatively.`,
      })
    }

    const rescueCounts = recentControl.map((session) => session.rescue_stop_count)

    const improving =
      rescueCounts.length >= 3 &&
      rescueCounts[0] <= rescueCounts[rescueCounts.length - 1] &&
      rescueCounts[0] < rescueCounts[rescueCounts.length - 1]

    if (improving) {
      items.push({
        id: 'rescue-trend',
        title: 'Fewer rescue stops',
        body: 'Your recent Control sessions used fewer rescue stops than earlier ones. That is the direction the program is looking for.',
      })
    }
  }

  if (gate && gate.hasEnoughObservations && !gate.shouldAdvance) {
    const passesNeeded = gate.requirement.requiredPasses - gate.passCount

    if (passesNeeded === 1 && gate.strictPassCount >= gate.requirement.requiredStrictPasses) {
      items.push({
        id: 'progression-near',
        title: 'Progression near',
        body: `You have passed ${formatTarget(currentTargetMs)} in ${gate.passCount} of your latest ${gate.observationCount} valid observations. The next qualifying pass can establish this target.`,
      })
    } else if (passesNeeded <= 0 && gate.strictPassCount < gate.requirement.requiredStrictPasses) {
      items.push({
        id: 'strict-pass-needed',
        title: 'Strict observation needed',
        body: 'You have enough passing sessions, but at least one more passing result must come from an Endurance or Baseline session.',
      })
    }
  }

  const withGap = sessions
    .filter((session) => session.created_at && session.session_type !== 'reset')
    .map((session, index, all) => {
      const previous = all[index + 1]

      if (!previous) {
        return null
      }

      const gapDays =
        (new Date(session.created_at).getTime() - new Date(previous.created_at).getTime()) /
        86_400_000

      const duration =
        session.session_type === 'control'
          ? session.longest_continuous_block_ms
          : session.continuous_attempt_ms

      return duration === null || duration === undefined ? null : { gapDays, duration }
    })
    .filter((item): item is { gapDays: number; duration: number } => item !== null)

  if (withGap.length >= 6) {
    const longGap = withGap.filter((item) => item.gapDays >= 5)
    const shortGap = withGap.filter((item) => item.gapDays < 5)

    if (longGap.length >= 2 && shortGap.length >= 2) {
      const average = (values: number[]) =>
        values.reduce((total, value) => total + value, 0) / values.length

      const longAverage = average(longGap.map((item) => item.duration))
      const shortAverage = average(shortGap.map((item) => item.duration))

      if (shortAverage - longAverage > 30_000) {
        items.push({
          id: 'gap-context',
          title: 'Gap context',
          body: 'Sessions after longer gaps have recently been shorter. Treat this as context, not as loss of progress.',
        })
      }
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Guidance from your sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
