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

/** Current target and the exact evidence the progression gate is looking at. */
export function TargetProgress({
  currentTargetMs,
  nextTargetMs,
  status,
  gate,
  observations,
}: TargetProgressProps) {
  const recent = observations.slice(0, gate?.requirement.requiredObservations ?? 4)
  const atCheckpoint = currentTargetMs === FIVE_MINUTE_CHECKPOINT_MS

  return (
    <Card>
      <CardHeader className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Current Target
        </p>
        <CardTitle className="text-3xl">{formatTarget(currentTargetMs)}</CardTitle>
        {status === 'maintenance' ? (
          <p className="text-sm text-emerald-500">10:00 baseline established. Maintenance mode.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Next target: {nextTargetMs === null ? 'maintenance' : formatTarget(nextTargetMs)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {atCheckpoint && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">5:00 Checkpoint</p>
            <p className="text-sm text-muted-foreground">
              4 / 5 qualifying observations required, including 2 strict Endurance or Baseline
              passes. Five minutes has to become genuinely repeatable.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Recent qualifying observations</p>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No progression observations at this target yet. Control, Endurance and Baseline
              sessions build this list.
            </p>
          ) : (
            <ul className="space-y-1">
              {recent.map((observation) => (
                <li
                  key={`${observation.sessionType}-${observation.at}`}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    {observation.passed ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden />
                    ) : (
                      <XIcon className="h-4 w-4 text-red-500" aria-hidden />
                    )}
                    <span className={observation.passed ? '' : 'text-muted-foreground'}>
                      {formatTarget(observation.durationMs)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
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
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {gate.passCount} / {gate.requirement.requiredObservations} passed
              {gate.hasEnoughObservations ? '' : ' (window not complete yet)'}
            </p>
            <p className="text-muted-foreground">
              Strict Endurance/Baseline passes: {gate.strictPassCount} /{' '}
              {gate.requirement.requiredStrictPasses}
            </p>
            {gate.shouldAdvance ? (
              <p className="text-emerald-500">
                Gate satisfied. One target advance can be recorded on the next qualifying session.
              </p>
            ) : gate.hasEnoughObservations ? (
              <p className="text-muted-foreground">
                {gate.passesRemaining > 0
                  ? `${gate.passesRemaining} more passing observation${gate.passesRemaining === 1 ? '' : 's'} needed.`
                  : 'At least one passing result must come from Endurance or Baseline.'}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {gate.requirement.requiredObservations - gate.observationCount} more qualifying
                observation
                {gate.requirement.requiredObservations - gate.observationCount === 1
                  ? ''
                  : 's'}{' '}
                needed before advancement is evaluated.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
