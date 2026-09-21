'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { formatTarget, getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type BaselineSessionProps = {
  session: GuidedSessionController
  alreadyRecordedToday: boolean
  previousBaselineMs: number | null
}

/** Sunday: the clean standardized measurement. One attempt, no same-day retest. */
export function BaselineSession({
  session,
  alreadyRecordedToday,
  previousBaselineMs,
}: BaselineSessionProps) {
  const prescription = getSessionPrescription('baseline')

  if (alreadyRecordedToday) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Baseline already recorded today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            There is no same-day retest. A second attempt today would not be a clean measurement.
            Continue with the next scheduled day.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (session.stage === 'not_started') {
    const ready =
      session.precheck.noPorn &&
      session.precheck.lubeUsed &&
      session.precheck.normalTechnique &&
      session.precheck.handStimulus

    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Standardized baseline</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
          {previousBaselineMs !== null && (
            <p className="text-sm text-muted-foreground">
              Previous valid baseline: {formatTarget(previousBaselineMs)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">No porn or erotic image stimulus</span>
              <Switch
                checked={session.precheck.noPorn}
                onCheckedChange={(checked) => session.setPrecheck({ noPorn: checked })}
                aria-label="No porn or erotic image stimulus"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Lube is being used</span>
              <Switch
                checked={session.precheck.lubeUsed}
                onCheckedChange={(checked) => session.setPrecheck({ lubeUsed: checked })}
                aria-label="Lube is being used"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Comparable, normal comfortable technique</span>
              <Switch
                checked={session.precheck.normalTechnique}
                onCheckedChange={(checked) => session.setPrecheck({ normalTechnique: checked })}
                aria-label="Comparable, normal comfortable technique"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Hand stimulus (not a device)</span>
              <Switch
                checked={session.precheck.handStimulus}
                onCheckedChange={(checked) => session.setPrecheck({ handStimulus: checked })}
                aria-label="Hand stimulus"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!ready}
            onClick={session.startBaseline}
          >
            Begin measurement
          </Button>
          <p className="text-xs text-muted-foreground">
            Once it begins the timer runs continuously. Full stops and long artificial pauses end
            the measurement, and there is no retry today.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Baseline</p>
        <CardTitle className="text-4xl tabular-nums">{formatTarget(session.attemptMs)}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Continuous stimulation until the natural endpoint. No full stops, no artificial pauses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            className="h-16 text-base"
            variant="destructive"
            onClick={() => session.endBaseline('full_stop')}
          >
            Full stop — end measurement
          </Button>
          <Button
            className="h-16 text-base"
            variant="outline"
            onClick={() => session.endBaseline('ejaculation')}
          >
            Ejaculation — natural endpoint
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ejaculation is a normal endpoint for a baseline measurement, not a failure.
        </p>
      </CardContent>
    </Card>
  )
}
