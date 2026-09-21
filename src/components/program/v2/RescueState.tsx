'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Full reset</p>
        <CardTitle className="text-xl">
          Recovery elapsed: {formatTarget(session.rescueElapsedMs)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Stop completely. Slow breathing. Let urgency genuinely fall.</p>
          <p>
            Resume only once you are genuinely around 3-4/10. There is no countdown to wait out.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">How are you now?</p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className="h-16 text-lg"
              variant="outline"
              onClick={() => session.confirmReset(3)}
            >
              3
            </Button>
            <Button
              className="h-16 text-lg"
              variant="outline"
              onClick={() => session.confirmReset(4)}
            >
              4
            </Button>
            <Button className="h-16 text-base" variant="secondary" onClick={session.stillAboveFour}>
              Still above 4
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choosing &ldquo;Still above 4&rdquo; keeps you in the reset. Confirm 3 or 4 when urgency
            has actually dropped.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Rescue stops recorded this session: {session.rescueStopCount}
        </p>
      </CardContent>
    </Card>
  )
}
