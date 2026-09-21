'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatTarget } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type RescueStateProps = {
  session: GuidedSessionController
}

/**
 * A rescue stop is a true reset, not an edging pause. The recovery timer is
 * open-ended and only the user can close it, by confirming they are genuinely
 * back around 3-4/10.
 */
export function RescueState({ session }: RescueStateProps) {
  return (
    <Card className="border-warning/40 bg-warning/10">
      <CardHeader className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-warning">Full reset</p>
        <p className="font-display text-5xl leading-none tracking-tight tabular-nums">
          {formatTarget(session.rescueElapsedMs)}
        </p>
        <p className="text-sm text-muted-foreground">
          Recovery elapsed. There is no countdown to wait out.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-1 text-sm text-foreground/90">
          <p>Stop completely. Slow breathing. Let urgency genuinely fall.</p>
          <p>Resume only once you are genuinely around 3-4/10.</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">How are you now?</p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className="h-20 font-display text-2xl tabular-nums"
              onClick={() => session.confirmReset(3)}
            >
              3
            </Button>
            <Button
              className="h-20 font-display text-2xl tabular-nums"
              onClick={() => session.confirmReset(4)}
            >
              4
            </Button>
            <Button className="h-20 text-sm" variant="outline" onClick={session.stillAboveFour}>
              Still above 4
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choosing &ldquo;Still above 4&rdquo; keeps you in the reset. Confirm 3 or 4 only when
            urgency has actually dropped.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Rescue stops recorded this session:{' '}
          <span className="tabular-nums text-foreground">{session.rescueStopCount}</span>
        </p>
      </CardContent>
    </Card>
  )
}
