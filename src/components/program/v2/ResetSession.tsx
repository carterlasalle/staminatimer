'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { formatTarget, getSessionPrescription } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type ResetSessionProps = {
  session: GuidedSessionController
}

/**
 * Tuesday / Thursday: six minutes of breathing and relaxation. This is not a
 * masturbation session and never counts toward the continuous target.
 */
export function ResetSession({ session }: ResetSessionProps) {
  const prescription = getSessionPrescription('reset')

  if (session.stage === 'not_started') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">6-minute reset</CardTitle>
          <p className="text-sm text-muted-foreground">{prescription.instruction}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full sm:w-auto" onClick={session.startSession}>
            Start the reset
          </Button>
          <p className="text-xs text-muted-foreground">
            Notice unnecessary tension in the lower abdomen, glutes, thighs, jaw, and pelvic floor.
            Let those areas soften as you breathe. Do not strain or force anything.
          </p>
        </CardContent>
      </Card>
    )
  }

  const remainingMs = Math.max(0, prescription.mainMinSeconds * 1000 - session.elapsedMainMs)
  const done = remainingMs <= 0

  return (
    <Card>
      <CardHeader className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Reset</p>
        <CardTitle className="font-display text-5xl leading-none tracking-tight tabular-nums">
          {formatTarget(done ? session.elapsedMainMs : remainingMs)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {done ? 'Elapsed' : 'Remaining'}. Roughly 4 second inhale, 6 second exhale. Lower abdomen,
          glutes, inner thighs and pelvic floor soften. No hard contractions, no pushing, no
          straining.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <BreathingPacer />
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          onClick={session.completeSimpleSession}
        >
          {done ? 'Complete reset' : 'Complete reset early'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Reset sessions count toward adherence but never toward progression targets.
        </p>
      </CardContent>
    </Card>
  )
}
