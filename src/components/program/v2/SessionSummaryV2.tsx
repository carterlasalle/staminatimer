'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  formatTarget,
  getSessionPrescription,
  type GuidedSessionType,
} from '@/lib/program/protocol-v2'
import type { GuidedSessionController, SummaryRatings } from '@/hooks/useGuidedSessionV2'
import type { RecordingResult } from '@/hooks/useProgramV2Progress'
import Link from 'next/link'

type SessionSummaryV2Props = {
  sessionType: GuidedSessionType
  session: GuidedSessionController
  targetMs: number
  previousBaselineMs: number | null
  saving: boolean
  result: RecordingResult | null
  onSubmit: () => void
  onDiscard: () => void
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg tabular-nums">{value}</dd>
    </div>
  )
}

function heroFor(
  sessionType: GuidedSessionType,
  session: GuidedSessionController,
  targetMs: number
) {
  switch (sessionType) {
    case 'control':
      return {
        label: 'Longest continuous block',
        value: formatTarget(session.longestContinuousBlockMs),
      }
    case 'endurance':
      return {
        label: `Attempt against ${formatTarget(targetMs)}`,
        value: formatTarget(session.attemptMs),
      }
    case 'baseline':
      return { label: 'Standardized result', value: formatTarget(session.attemptMs) }
    case 'reset':
      return { label: 'Reset completed', value: formatTarget(session.elapsedMainMs) }
    case 'transfer':
      return {
        label: `Against device target ${formatTarget(targetMs)}`,
        value: formatTarget(session.longestContinuousBlockMs),
      }
    default:
      return { label: 'Practice time', value: formatTarget(session.mainActiveMs) }
  }
}

const breathingOptions: Array<{ value: SummaryRatings['breathingMaintained']; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No' },
]

/** Neutral, session-type-specific summary. Nothing here is framed as failure or shame. */
export function SessionSummaryV2({
  sessionType,
  session,
  targetMs,
  previousBaselineMs,
  saving,
  result,
  onSubmit,
  onDiscard,
}: SessionSummaryV2Props) {
  const prescription = getSessionPrescription(sessionType)
  const ratings = session.summaryRatings

  const deltaMs =
    sessionType === 'baseline' && previousBaselineMs !== null
      ? session.attemptMs - previousBaselineMs
      : null

  const hero = heroFor(sessionType, session, targetMs)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {prescription.label} summary
          </p>
          <p className="text-sm text-muted-foreground">{hero.label}</p>
          <CardTitle className="font-display text-5xl leading-none tracking-tight tabular-nums">
            {hero.value}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {sessionType === 'control' && (
              <>
                <Stat label="Main training time" value={formatTarget(session.mainActiveMs)} />
                <Stat label="Rescue stops" value={`${session.rescueStopCount}`} />
                <Stat label="Total rescue time" value={formatTarget(session.totalRescueMs)} />
                <Stat label="Highest arousal reported" value={`${session.highestArousal}/10`} />
                <Stat
                  label="Approx. time near 4-6/10"
                  value={formatTarget(session.timeInTargetRangeMs)}
                />
                <Stat
                  label="Rescue durations"
                  value={
                    session.rescueEvents.length === 0
                      ? 'none'
                      : session.rescueEvents
                          .map((event) => formatTarget(event.durationMs ?? 0))
                          .join(' · ')
                  }
                />
                <Stat
                  label="Block durations"
                  value={
                    session.completedBlocksMs.length === 0
                      ? 'none'
                      : session.completedBlocksMs.map((block) => formatTarget(block)).join(' · ')
                  }
                />
              </>
            )}
            {sessionType === 'endurance' && (
              <>
                <Stat label="Target" value={formatTarget(targetMs)} />
                <Stat
                  label="Result"
                  value={
                    session.attemptMs >= targetMs
                      ? `Passed by ${formatTarget(session.attemptMs - targetMs)}`
                      : `Short by ${formatTarget(targetMs - session.attemptMs)}`
                  }
                />
                {session.remainderMode && (
                  <Stat
                    label="Remainder longest block"
                    value={formatTarget(session.longestContinuousBlockMs)}
                  />
                )}
              </>
            )}
            {sessionType === 'baseline' && (
              <>
                <Stat
                  label="Previous baseline"
                  value={
                    previousBaselineMs === null ? 'none yet' : formatTarget(previousBaselineMs)
                  }
                />
                <Stat
                  label="Delta"
                  value={
                    deltaMs === null
                      ? 'n/a'
                      : `${deltaMs >= 0 ? '+' : '-'}${formatTarget(Math.abs(deltaMs))}`
                  }
                />
                <Stat label="Current target" value={formatTarget(targetMs)} />
                <Stat
                  label="Ended by"
                  value={
                    session.baselineEndReason === 'ejaculation'
                      ? 'natural endpoint'
                      : session.baselineEndReason === 'full_stop'
                        ? 'full stop'
                        : 'not recorded'
                  }
                />
              </>
            )}
            {sessionType === 'reset' && (
              <Stat
                label="Relaxation"
                value={
                  session.summaryRatings.controlRating
                    ? `${session.summaryRatings.controlRating}/5`
                    : 'not rated'
                }
              />
            )}
            {sessionType === 'easy' && (
              <Stat label="Rescue stops" value={`${session.rescueStopCount}`} />
            )}
            {sessionType === 'transfer' && (
              <Stat label="Suggested device target" value={formatTarget(targetMs)} />
            )}
          </dl>
        </CardContent>
      </Card>

      {result === null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How did it feel?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">Control rating</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={ratings.controlRating === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      session.setSummaryRatings((prev) => ({ ...prev, controlRating: rating }))
                    }
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">Did you keep breathing through it?</p>
              <div className="flex flex-wrap gap-2">
                {breathingOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={ratings.breathingMaintained === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      session.setSummaryRatings((prev) => ({
                        ...prev,
                        breathingMaintained: option.value,
                      }))
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">Ejaculation</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['none', 'None'],
                    ['during_training', 'During the session'],
                    ['intentional_after', 'Finished normally afterward'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={ratings.ejaculationOutcome === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      session.setSummaryRatings((prev) => ({ ...prev, ejaculationOutcome: value }))
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Training complete. Finishing normally afterward is allowed; there is no progression
                bonus either way.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm" htmlFor="program-v2-notes">
                Notes (optional)
              </label>
              <Input
                id="program-v2-notes"
                value={ratings.notes}
                onChange={(event) =>
                  session.setSummaryRatings((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Anything worth remembering about today"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={onSubmit}>
                {saving ? 'Saving…' : 'Save session'}
              </Button>
              <Button variant="outline" onClick={onDiscard}>
                Discard session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            result.advanced || result.gate.maintenanceReached || result.targetPassed
              ? 'border-primary/40'
              : undefined
          )}
        >
          <CardHeader>
            <CardTitle className="text-base">
              {result.gate.maintenanceReached
                ? '10:00 baseline established'
                : result.advanced
                  ? `Target advanced to ${formatTarget(result.currentTargetMs)}`
                  : result.counted
                    ? 'Session recorded'
                    : 'Session recorded (not counted)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {prescription.countsTowardProgression ? (
              <>
                <p className="text-muted-foreground">
                  {result.counted
                    ? result.targetPassed
                      ? `Counted as a progression observation and passed the ${formatTarget(result.priorTargetMs)} target.`
                      : `Counted as a progression observation. ${formatTarget(sessionType === 'baseline' ? session.attemptMs : session.longestContinuousBlockMs)} against a ${formatTarget(result.priorTargetMs)} target.`
                    : 'This session did not count as a progression observation. Only one progression-eligible session per local day counts, and a session ended early, by a rescue cap, or by a rescue loop is not progression-eligible.'}
                </p>
                <p className="text-muted-foreground">
                  Gate: {result.gate.passCount} / {result.gate.requirement.requiredObservations}{' '}
                  passes · strict Endurance/Baseline passes {result.gate.strictPassCount} /{' '}
                  {result.gate.requirement.requiredStrictPasses}
                </p>
                {result.advanced ? (
                  <p className="text-muted-foreground">
                    Your target moved exactly one step to {formatTarget(result.currentTargetMs)}.
                  </p>
                ) : result.gate.maintenanceReached ? (
                  <p className="text-muted-foreground">
                    You are in maintenance. There is no target beyond 10:00.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {result.gate.passesRemaining > 0
                      ? `${result.gate.passesRemaining} more passing observation${result.gate.passesRemaining === 1 ? '' : 's'} at this target before it advances.`
                      : 'At least one more passing Endurance or Baseline observation is required before this target advances.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                {`${prescription.label} sessions never count toward the hand-based target progression.`}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              One shorter session does not determine the trend.
            </p>

            <Button asChild>
              <Link href="/program">Back to the program</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
