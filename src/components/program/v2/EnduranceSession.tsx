'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { BlockEnded } from '@/components/program/v2/ControlSession'
import { ControlBlock } from '@/components/program/v2/ControlBlock'
import { RescueState } from '@/components/program/v2/RescueState'
import { formatTarget, getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type EnduranceSessionProps = {
  session: GuidedSessionController
  targetMs: number
}

/** Wednesday: exactly one serious continuous attempt at the current target. */
export function EnduranceSession({ session, targetMs }: EnduranceSessionProps) {
  const prescription = getSessionPrescription('endurance')

  if (session.stage === 'not_started') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Continuous target: {formatTarget(targetMs)}</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full sm:w-auto" onClick={session.startSession}>
            Start 5-minute breathing prep
          </Button>
          <p className="text-xs text-muted-foreground">
            One attempt only. A full stop ends the measured attempt for today.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (session.stage === 'prep') {
    const prepDone = session.prepRemainingMs <= 0

    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">
            Prep · {formatTarget(session.prepRemainingMs)} remaining
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Continuous target: {formatTarget(targetMs)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <BreathingPacer />
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!prepDone}
              onClick={() => session.beginMainBlock({ prepCompleted: true })}
            >
              {prepDone ? 'Begin the attempt' : 'Breathing prep in progress'}
            </Button>
            {!prepDone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => session.beginMainBlock({ prepCompleted: false })}
              >
                Continue early (this attempt will not count toward progression)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (session.stage === 'rescue') {
    return <RescueState session={session} />
  }

  if (session.stage === 'block_ended') {
    return <BlockEnded session={session} />
  }

  if (session.remainderMode) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-1 p-4">
            <p className="text-sm font-medium">
              Measured attempt: {formatTarget(session.attemptMs)} (recorded)
            </p>
            <p className="text-xs text-muted-foreground">
              This remainder is training, not another progression test.
            </p>
          </CardContent>
        </Card>
        <ControlBlock session={session} isRemainder />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Endurance</p>
          <CardTitle className="font-display text-6xl leading-none tracking-tight tabular-nums">
            {formatTarget(session.attemptMs)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Continuous target: {formatTarget(targetMs)}
            {session.attemptPassedTarget ? ' · passed' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.attemptPassedTarget ? (
            <div className="space-y-3 rounded-md border border-primary/40 bg-primary/10 p-4">
              <p className="text-base font-medium text-primary">Target passed</p>
              <p className="text-sm text-muted-foreground">
                Continue for roughly another 30-60 seconds at a comparable intensity if you are
                comfortable, then conclude. The target is a duration milestone, not an ejaculation
                time.
              </p>
              <Button size="lg" className="w-full" onClick={session.endAttemptAtTarget}>
                Conclude attempt
              </Button>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Minor pace changes and slowing while continuing are allowed.</p>
              <p>
                A full stop terminates the measured attempt for today. It will not be restarted.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="h-16 text-base"
              variant="destructive"
              onClick={session.endAttemptByFullStop}
            >
              Full stop — end attempt
            </Button>
            <Button
              className="h-16 text-base"
              variant="outline"
              onClick={session.endAttemptByEjaculation}
            >
              Ejaculation — natural endpoint
            </Button>
          </div>
          {!session.attemptPassedTarget && (
            <Button variant="ghost" size="sm" onClick={session.endAttemptAtTarget}>
              Conclude attempt without full stop
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
