'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { ControlBlock } from '@/components/program/v2/ControlBlock'
import { RescueState } from '@/components/program/v2/RescueState'
import { formatTarget, getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type ControlSessionProps = {
  session: GuidedSessionController
}

/** Monday / Friday: the primary skill-building session. */
export function ControlSession({ session }: ControlSessionProps) {
  const prescription = getSessionPrescription('control')

  if (session.stage === 'not_started') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Control session</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full sm:w-auto" onClick={session.startSession}>
            Start 5-minute breathing prep
          </Button>
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
            Five minutes of slow breathing. Long exhale, no straining.
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
              {prepDone ? 'Begin main training' : 'Breathing prep in progress'}
            </Button>
            {!prepDone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => session.beginMainBlock({ prepCompleted: false })}
              >
                Continue early (this session will not count toward progression)
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

  return <ControlBlock session={session} />
}

export function BlockEnded({ session }: { session: GuidedSessionController }) {
  const isLoop = session.terminationReason === 'rescue_loop'

  return (
    <Card className="border-warning/40 bg-warning/10">
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-warning">
          Structured block ended
        </p>
        <CardTitle className="text-xl">
          {isLoop ? 'Repeated rescue loop detected' : 'Rescue limit reached'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isLoop
            ? 'Repeated rescue cycling was detected. Ending the structured block prevents this session from turning into repeated edge/recovery cycles.'
            : 'Control sessions allow a maximum of three rescue stops. Ending the structured block here keeps the session from turning into repeated recovery cycles.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Everything recorded so far is preserved. Do not immediately try again; next session, start
          at a lower intensity and react earlier to acceleration.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={session.concludeTerminatedSession}>Save session summary</Button>
          <Button variant="outline" onClick={session.abandon}>
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
