'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTarget, TARGET_AROUSAL_RANGE } from '@/lib/program/protocol-v2'
import type { GuidedSessionController } from '@/hooks/useGuidedSessionV2'

type ControlBlockProps = {
  session: GuidedSessionController
  /** Set when this block is the remainder of an Endurance session. */
  isRemainder?: boolean
  completionLabel?: string
}

const arousalChoices = [3, 4, 5, 6, 7, 8, 9]

/**
 * The shared Control-style block: large STEADY / ACCELERATING / NEED RESET
 * controls, acceleration guidance, and an optional arousal logger. Slowing down
 * never breaks the continuous block; only a rescue stop does.
 */
export function ControlBlock({
  session,
  isRemainder = false,
  completionLabel = 'Complete training',
}: ControlBlockProps) {
  const accelerating = session.stage === 'accelerating'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {isRemainder ? 'Control-style remainder' : 'Main training'}
          </p>
          <CardTitle className="text-xl">
            {accelerating ? 'Slow + continue' : 'Continuous block'} ·{' '}
            {formatTarget(session.currentBlockMs)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Target range {TARGET_AROUSAL_RANGE.min}-{TARGET_AROUSAL_RANGE.max}/10 · longest block{' '}
            {formatTarget(session.longestContinuousBlockMs)} · rescue stops{' '}
            {session.rescueStopCount}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {accelerating ? (
            <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="text-base font-medium">
                Slow by roughly 30-50%. Keep stimulation continuous.
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Reduce pace rather than stopping.</li>
                <li>Long exhale.</li>
                <li>
                  Relax unnecessary tension in your jaw, abdomen, glutes, thighs, and pelvic floor.
                </li>
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-16 text-base" onClick={session.backInRange}>
                  Back in range
                </Button>
                <Button
                  className="h-16 text-base"
                  variant="destructive"
                  onClick={session.requestReset}
                >
                  Need reset
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Button
                  className="h-20 text-base"
                  variant="outline"
                  onClick={session.markSteady}
                  aria-pressed
                >
                  Steady
                </Button>
                <Button className="h-20 text-base" onClick={session.markAccelerating}>
                  Accelerating
                </Button>
                <Button
                  className="h-20 text-base"
                  variant="destructive"
                  onClick={session.requestReset}
                >
                  Need reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Steady is the normal state. Acceleration -&gt; slow and continue. Only use a full
                reset when slowing is not enough.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Optional arousal rating</p>
            <div className="flex flex-wrap gap-2">
              {arousalChoices.map((choice) => (
                <Button
                  key={choice}
                  size="sm"
                  variant={session.currentArousal === choice ? 'default' : 'outline'}
                  onClick={() => session.setArousal(choice)}
                  aria-label={`Report arousal ${choice} out of 10`}
                >
                  {choice}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Reported highest: {session.highestArousal}/10. Ratings are optional and not required
              to run the session.
            </p>
          </div>
        </CardContent>
      </Card>

      {!isRemainder && session.stage === 'main' && (
        <Button className="w-full" size="lg" onClick={session.completeControl}>
          {completionLabel}
        </Button>
      )}
      {isRemainder && (
        <Button className="w-full" size="lg" onClick={session.endRemainder}>
          Conclude session
        </Button>
      )}
    </div>
  )
}
