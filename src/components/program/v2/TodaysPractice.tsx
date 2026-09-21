'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

/** The top card: what to do today, what target is being trained, and the start action. */
export function TodaysPractice({ sessionType, currentTargetMs, status }: TodaysPracticeProps) {
  const prescription = getSessionPrescription(sessionType)
  const optional = prescription.optional

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Guided Program
            </p>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Today&apos;s Practice</p>
              <CardTitle className="text-2xl">{prescription.label}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{prescription.summary}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {status === 'maintenance' ? 'Maintenance baseline' : 'Current Target'}
            </p>
            <p className="text-2xl font-semibold">{formatTarget(currentTargetMs)}</p>
            {status === 'maintenance' && (
              <p className="text-xs text-emerald-500">10:00 baseline established.</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/program/session">
            Start Today&apos;s Session
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {optional && (
          <p className="text-xs text-muted-foreground">
            This session is optional. Skipping it is completely acceptable and does not affect your
            progression.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
