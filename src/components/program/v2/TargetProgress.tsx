'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FIVE_MINUTE_CHECKPOINT_MS,
  formatTarget,
  type GuidedSessionType,
  type ProgressionGateState,
  type ProgramStatus,
} from '@/lib/program/protocol-v2'
import type { ProgressionObservationRow } from '@/hooks/useProgramV2Progress'
import { cn } from '@/lib/utils'
import { CheckIcon, XIcon } from 'lucide-react'

type TargetProgressProps = {
  currentTargetMs: number
  nextTargetMs: number | null
  status: ProgramStatus
  gate: ProgressionGateState | null
  observations: ProgressionObservationRow[]
}

const sessionLabels: Record<GuidedSessionType, string> = {
  control: 'Control',
  endurance: 'Endurance',
  baseline: 'Baseline',
  reset: 'Reset',
  easy: 'Easy',
  transfer: 'Transfer',
}

function gateSegmentClass(passed: boolean | null) {
  if (passed === null) {
    return 'bg-muted'
  }

  return passed ? 'bg-primary' : 'bg-destructive/60'
}

/** Current target and the exact evidence the progression gate is looking at. */
export function TargetProgress({
  currentTargetMs,
  nextTargetMs,
  status,
  gate,
  observations,
}: TargetProgressProps) {
  const requiredCount = gate?.requirement.requiredObservations ?? 4
  const recent = observations.slice(0, requiredCount)
  const atCheckpoint = currentTargetMs === FIVE_MINUTE_CHECKPOINT_MS

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Target
            </p>
            <CardTitle className="font-display text-4xl leading-none tracking-tight tabular-nums">
              {formatTarget(currentTargetMs)}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {status === 'maintenance' ? (
              <span className="text-primary">10:00 baseline established</span>
            ) : (
              <>Next target: {nextTargetMs === null ? 'maintenance' : formatTarget(nextTargetMs)}</>
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {atCheckpoint && (
          <div className="space-y-1 rounded-md border border-primary/40 bg-primary/10 p-4">
            <p className="text-sm font-medium">5:00 Checkpoint</p>
            <p className="text-sm text-muted-foreground">
              4 / 5 qualifying observations required, including 2 strict Endurance or Baseline
              passes. Five minutes has to become genuinely repeatable.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium">Recent qualifying observations</p>

          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing at this target yet. Control, Endurance and Baseline sessions build this list.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
              {recent.map((observation) => (
                <li
                  key={`${observation.sessionType}-${observation.at}`}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  {observation.passed ? (
                    <CheckIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <XIcon className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                  )}
                  <span
                    className={cn(
                      'font-medium tabular-nums',
                      !observation.passed && 'text-muted-foreground'
                    )}
                  >
                    {formatTarget(observation.durationMs)}
                  </span>
                  <span className="ml-auto text-xs uppercase tracking-wider text-muted-foreground">
                    {sessionLabels[observation.sessionType] ?? observation.sessionType}
                  </span>
                  <span className="sr-only">
                    {observation.passed ? 'passed' : 'did not pass'} the{' '}
                    {formatTarget(currentTargetMs)} target
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {gate && (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {gate.passCount} / {gate.requirement.requiredObservations} passed
                {!gate.hasEnoughObservations && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    window still filling
                  </span>
                )}
              </p>
              <span className="flex gap-1.5" aria-hidden>
                {Array.from({ length: requiredCount }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1.5 w-7 rounded-full transition-colors duration-200',
                      gateSegmentClass(recent[index] ? recent[index].passed : null)
                    )}
                  />
                ))}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Strict Endurance/Baseline passes: {gate.strictPassCount} /{' '}
              {gate.requirement.requiredStrictPasses}
            </p>

            <p
              className={
                gate.shouldAdvance ? 'text-sm text-primary' : 'text-sm text-muted-foreground'
              }
            >
              {gate.shouldAdvance
                ? 'Gate satisfied. One target advance can be recorded on the next qualifying session.'
                : gate.hasEnoughObservations
                  ? gate.passesRemaining > 0
                    ? `${gate.passesRemaining} more passing observation${
                        gate.passesRemaining === 1 ? '' : 's'
                      } needed.`
                    : 'At least one passing result must come from Endurance or Baseline.'
                  : `${gate.requirement.requiredObservations - gate.observationCount} more qualifying observation${
                      gate.requirement.requiredObservations - gate.observationCount === 1 ? '' : 's'
                    } needed before advancement is evaluated.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
