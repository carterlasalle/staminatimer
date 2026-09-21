'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatTarget,
  getSessionPrescription,
  type GuidedSessionType,
} from '@/lib/program/protocol-v2'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

type TodaysPracticeProps = {
  sessionType: GuidedSessionType
  currentTargetMs: number
  status: 'active' | 'maintenance'
}

/** The one card that answers "what am I doing today?" and nothing else. */
export function TodaysPractice({ sessionType, currentTargetMs, status }: TodaysPracticeProps) {
  const prescription = getSessionPrescription(sessionType)

  const structure = [
    prescription.prepSeconds > 0 ? `${Math.round(prescription.prepSeconds / 60)} min prep` : null,
    prescription.mainMinSeconds > 0
      ? prescription.mainMinSeconds === prescription.mainMaxSeconds
        ? `${Math.round(prescription.mainMinSeconds / 60)} min`
        : `${Math.round(prescription.mainMinSeconds / 60)}-${Math.round(
            prescription.mainMaxSeconds / 60
          )} min`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card className="overflow-hidden border-primary/25 bg-card">
      <CardContent className="grid gap-8 p-6 sm:grid-cols-[1.4fr_auto] sm:items-center sm:p-8">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Guided Program
          </p>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Today&apos;s Practice</p>
            <h2 className="font-display text-4xl leading-none tracking-tight">
              {prescription.label}
            </h2>
            <p className="text-sm text-muted-foreground">{prescription.summary}</p>
            {structure && <p className="text-sm text-muted-foreground/80">Today: {structure}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="touch-manipulation">
              <Link href="/program/session">
                Start Today&apos;s Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {prescription.optional && (
              <span className="text-xs text-muted-foreground">
                Optional. Skipping does not affect progression.
              </span>
            )}
          </div>
        </div>

        <div className="sm:border-l sm:border-border/60 sm:pl-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {status === 'maintenance' ? 'Maintenance baseline' : 'Current Target'}
          </p>
          <p className="font-display text-5xl leading-none tracking-tight tabular-nums">
            {formatTarget(currentTargetMs)}
          </p>
          {status === 'maintenance' && (
            <p className="mt-2 text-xs text-primary">10:00 baseline established</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
