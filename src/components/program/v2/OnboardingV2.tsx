'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  formatTarget,
  getInitialTargetForBucket,
  type InitialBaselineBucket,
} from '@/lib/program/protocol-v2'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
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
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Where are you starting from?
        </h1>
        <p className="text-sm text-muted-foreground">
          Roughly how long can you last with no porn, using your normal comfortable technique, in
          one continuous stretch? This only sets your first target. Your first standardized Baseline
          overrides it.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selected === option.bucket

            return (
              <button
                key={option.bucket}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(option.bucket)}
                className={cn(
                  'touch-target flex items-start justify-between gap-3 rounded-md border px-3 py-3 text-left transition-[color,background-color,border-color,box-shadow] duration-150 ease-out-quart active:scale-[0.99]',
                  isSelected
                    ? 'border-primary/70 bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border/60 hover:border-border hover:bg-muted/40'
                )}
              >
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.detail}</span>
                </span>
                {isSelected && (
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          Your starting target will be{' '}
          <span className="tabular-nums text-foreground">
            {formatTarget(getInitialTargetForBucket(selected))}
          </span>
          .
        </p>

        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={() => onInitialize(selected)}
        >
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
