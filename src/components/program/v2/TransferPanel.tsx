'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EncounterLog } from '@/components/program/EncounterLog'
import { formatTarget, type TransferUnlockState } from '@/lib/program/protocol-v2'
import type { ProgramV2SessionRow } from '@/hooks/useProgramV2Progress'
import Link from 'next/link'

type TransferPanelProps = {
  transfer: TransferUnlockState
  transferSessions: ProgramV2SessionRow[]
  daysSinceLastEjaculation: number | null
  encounterLogOpen: boolean
  onToggleEncounterLog: () => void
}

/**
 * Transfer is a separate track from the solo hand progression. Device results
 * never advance the hand target, and solo capability is never presented as a
 * guarantee of the same duration during partnered sex.
 */
export function TransferPanel({
  transfer,
  transferSessions,
  daysSinceLastEjaculation,
  encounterLogOpen,
  onToggleEncounterLog,
}: TransferPanelProps) {
  const latestSleeve = transferSessions[0]

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Partner Transfer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Solo capability and partner transfer are tracked separately. Reaching a duration solo does
          not imply the same duration during partnered sex.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Solo capability (hand)
            </dt>
            <dd className="font-display text-3xl leading-none tabular-nums">
              {formatTarget(transfer.handTargetMs)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              Partner transfer
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium normal-case tracking-normal">
                separate track
              </span>
            </dt>
            <dd className="font-display text-3xl leading-none tabular-nums">
              {latestSleeve?.continuous_attempt_ms
                ? formatTarget(latestSleeve.continuous_attempt_ms)
                : '—'}
            </dd>
          </div>
        </dl>

        <p className="text-sm text-muted-foreground">{transfer.reason}</p>

        {transfer.unlocked && (
          <div className="space-y-3">
            <p className="text-sm">
              Suggested initial device target:{' '}
              <span className="tabular-nums">{formatTarget(transfer.suggestedSleeveTargetMs)}</span>
              . A harder, more realistic stimulus may temporarily reduce duration. That is expected
              and is not regression.
            </p>
            <Button asChild variant="outline" className="touch-target">
              <Link href="/program/session?type=transfer">Start device session</Link>
            </Button>
          </div>
        )}

        {daysSinceLastEjaculation !== null && (
          <p className="text-xs text-muted-foreground">
            Context only:{' '}
            <span className="tabular-nums">
              {daysSinceLastEjaculation} day
              {daysSinceLastEjaculation === 1 ? '' : 's'}
            </span>{' '}
            since last known ejaculation. Recorded for your own comparison; never a target or a
            rule.
          </p>
        )}

        <div className="space-y-2 border-t border-border/60 pt-4">
          <Button
            variant="secondary"
            className="touch-target"
            onClick={onToggleEncounterLog}
            aria-expanded={encounterLogOpen}
          >
            {encounterLogOpen ? 'Hide encounter log' : 'Log a partnered encounter'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Encounter notes stay in this browser. Partnered encounters never advance your solo
            target.
          </p>
          {encounterLogOpen && <EncounterLog />}
        </div>
      </CardContent>
    </Card>
  )
}
