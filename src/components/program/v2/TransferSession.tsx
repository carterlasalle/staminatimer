'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { BlockEnded } from '@/components/program/v2/ControlSession'
import { ControlBlock } from '@/components/program/v2/ControlBlock'
import { RescueState } from '@/components/program/v2/RescueState'
import { formatTarget, getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type TransferSessionProps = {
  session: GuidedSessionController
  sleeveTargetMs: number
}

/**
 * Device / sleeve practice. This is a separate track: sleeve results never
 * advance the hand-based target, and a shorter duration on a harder stimulus is
 * not regression.
 */
export function TransferSession({ session, sleeveTargetMs }: TransferSessionProps) {
  const prescription = getSessionPrescription('transfer')

  if (session.stage === 'not_started') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Device session (transfer track)</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Suggested device target: {formatTarget(sleeveTargetMs)}. This number is separate from
            your hand target and does not replace it.
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={session.startSession}>
            Start device session
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
            Brief breathing preparation before the block.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <BreathingPacer />
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!prepDone}
            onClick={() => session.beginMainBlock({ prepCompleted: prepDone })}
          >
            {prepDone ? 'Begin block' : 'Breathing prep in progress'}
          </Button>
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

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-1 p-4">
          <p className="text-sm font-medium">
            Suggested device target {formatTarget(sleeveTargetMs)}
          </p>
          <p className="text-xs text-muted-foreground">
            Shorter duration on a harder stimulus is expected and is not regression. Sleeve results
            never advance the hand target.
          </p>
        </CardContent>
      </Card>
      <ControlBlock session={session} completionLabel="Conclude device session" />
    </div>
  )
}
