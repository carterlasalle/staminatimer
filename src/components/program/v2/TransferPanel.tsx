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
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Solo capability (hand)</p>
            <p className="text-lg font-semibold">{formatTarget(transfer.handTargetMs)}</p>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Partner transfer</p>
            <p className="text-lg font-semibold">
              {latestSleeve?.continuous_attempt_ms
                ? formatTarget(latestSleeve.continuous_attempt_ms)
                : 'not measured'}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{transfer.reason}</p>

        {transfer.unlocked && (
          <div className="space-y-2">
            <p className="text-sm">
              Suggested initial device target: {formatTarget(transfer.suggestedSleeveTargetMs)}. A
              harder, more realistic stimulus may temporarily reduce duration. That is expected and
              is not regression.
            </p>
            <Button asChild variant="outline">
              <Link href="/program/session?type=transfer">Start device session</Link>
            </Button>
          </div>
        )}

        {daysSinceLastEjaculation !== null && (
          <p className="text-xs text-muted-foreground">
            Context only: {daysSinceLastEjaculation} day
            {daysSinceLastEjaculation === 1 ? '' : 's'} since last known ejaculation. This is
            recorded for your own comparison and is never a target or a rule.
          </p>
        )}

        <div className="space-y-2">
          <Button variant="secondary" size="sm" onClick={onToggleEncounterLog}>
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
