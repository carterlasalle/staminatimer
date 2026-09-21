'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatTarget,
  getInitialTargetForBucket,
  type InitialBaselineBucket,
} from '@/lib/program/protocol-v2'
import { useState } from 'react'

type OnboardingV2Props = {
  saving: boolean
  onInitialize: (bucket: InitialBaselineBucket) => Promise<void>
}

const options: Array<{ bucket: InitialBaselineBucket; label: string; detail: string }> = [
  { bucket: 'under_2', label: 'Under 2 min', detail: 'Start at 2:00' },
  { bucket: '2_3', label: '2-3 min', detail: 'Start at 2:30' },
  { bucket: '3_5', label: '3-5 min', detail: 'Start at 3:30' },
  { bucket: '5_plus', label: '5+ min', detail: 'Start at the 5:00 checkpoint' },
  {
    bucket: 'unknown',
    label: "I don't know",
    detail: 'Start at 2:00 and recalibrate from the first Baseline',
  },
]

/**
 * V2 onboarding: a self-reported starting point only. It is a placement aid and
 * never jumps anyone above the 5:00 checkpoint, and measured data always
 * overrides it later.
 */
export function OnboardingV2({ saving, onInitialize }: OnboardingV2Props) {
  const [selected, setSelected] = useState<InitialBaselineBucket>('unknown')

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Guided Program V2
        </p>
        <CardTitle className="text-2xl">Where are you starting from?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Roughly how long can you last with no porn, using your normal comfortable technique, in
          one continuous stretch? This only sets your first target. Your first standardized Baseline
          overrides it.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.bucket}
              type="button"
              aria-pressed={selected === option.bucket}
              onClick={() => setSelected(option.bucket)}
              className={`rounded-md border px-3 py-3 text-left transition-colors ${
                selected === option.bucket
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border/60 hover:bg-accent/40'
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.detail}</p>
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Your starting target will be {formatTarget(getInitialTargetForBucket(selected))}.
        </p>

        <Button disabled={saving} onClick={() => onInitialize(selected)}>
          {saving ? 'Starting…' : 'Start Guided Program V2'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Any earlier Guided Program history stays stored as legacy history. It is never converted
          into V2 progression.
        </p>
      </CardContent>
    </Card>
  )
}
