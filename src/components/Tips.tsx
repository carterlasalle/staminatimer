'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import { useMemo } from 'react'

/**
 * One rotating reminder, aligned with the Guided Program V2 protocol: continuous
 * stimulation around moderate arousal, slowing before stopping, and honest data.
 */
const TIPS = [
  'Long, slow exhales are the brake. Keep breathing through the whole block.',
  'Stay around 4-6/10. Time near the top of the scale is not the goal.',
  'When arousal climbs, slow down by roughly 30-50% and keep going.',
  'A full stop is a reset, not a technique. Resume once you are genuinely back around 3-4/10.',
  'Track your longest continuous block rather than how often you stopped.',
  'One shorter session does not change the trend. Look at the last few together.',
]

export function Tips() {
  const tip = useMemo(() => {
    const index = new Date().getDay() % TIPS.length

    return TIPS[index]
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-accent" aria-hidden />
          Today&apos;s reminder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{tip}</p>
      </CardContent>
    </Card>
  )
}
