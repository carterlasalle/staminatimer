'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type EjaculationTrackerProps = {
  sessionsSinceLastEjaculation: number
}

function recommendationText(sessionsSinceLastEjaculation: number) {
  if (sessionsSinceLastEjaculation > 10) {
    return "You've gone over 10 sessions. It's appropriate to allow release after today's full session if you want."
  }
  if (sessionsSinceLastEjaculation >= 6) {
    return 'You are in the recommended ejaculation window (session 6-10).'
  }
  return "You're still early in the spacing window. Keep building non-ejaculatory sessions."
}

export function EjaculationTracker({ sessionsSinceLastEjaculation }: EjaculationTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ejaculation Scheduling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          Sessions since last ejaculation:{' '}
          <span className="font-semibold">{sessionsSinceLastEjaculation}</span>
        </p>
        <p className="text-xs text-muted-foreground">Recommended ejaculation window: session 6-10</p>
        <p className="text-sm text-muted-foreground">{recommendationText(sessionsSinceLastEjaculation)}</p>
      </CardContent>
    </Card>
  )
}
