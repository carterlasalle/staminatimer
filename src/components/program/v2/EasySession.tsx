'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ControlBlock } from '@/components/program/v2/ControlBlock'
import { getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type EasySessionProps = {
  session: GuidedSessionController
}

/** Saturday: deliberately low pressure. Skipping is completely acceptable. */
export function EasySession({ session }: EasySessionProps) {
  const prescription = getSessionPrescription('easy')

  if (session.stage === 'not_started') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Easy / optional session</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full sm:w-auto" onClick={session.startSession}>
            Start easy session
          </Button>
          <p className="text-xs text-muted-foreground">
            Skipping today is completely acceptable. Nothing here affects your progression.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{prescription.summary}</p>
        </CardContent>
      </Card>
      <ControlBlock session={session} completionLabel="Conclude easy session" />
    </div>
  )
}
