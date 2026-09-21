'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContextGuidanceV2 } from '@/components/program/v2/ContextGuidanceV2'
import { DailyPracticeV2 } from '@/components/program/v2/DailyPracticeV2'
import { OnboardingV2 } from '@/components/program/v2/OnboardingV2'
import { TargetProgress } from '@/components/program/v2/TargetProgress'
import { TodaysPractice } from '@/components/program/v2/TodaysPractice'
import { TransferPanel } from '@/components/program/v2/TransferPanel'
import { TrendsV2 } from '@/components/program/v2/TrendsV2'
import { WeeklyPlan } from '@/components/program/v2/WeeklyPlan'
import { useAuth } from '@/contexts/AuthContext'
import { useProgramV2Progress } from '@/hooks/useProgramV2Progress'
import { getScheduledSessionType } from '@/lib/program/protocol-v2'
import Link from 'next/link'
import { useState } from 'react'

/** The Guided Program V2 dashboard: weekly prescription, target, evidence and trends. */
export function ProgramDashboardV2() {
  const { user, loading: authLoading } = useAuth()

  const {
    loading,
    saving,
    error,
    progress,
    sessions,
    rescueEvents,
    needsOnboarding,
    currentTargetMs,
    status,
    nextTargetMs,
    observations,
    gate,
    baselines,
    controlSessions,
    transferSessions,
    transfer,
    daysSinceLastEjaculation,
    initialize,
  } = useProgramV2Progress()

  const [encounterLogOpen, setEncounterLogOpen] = useState(false)

  const todayType = getScheduledSessionType(new Date())

  if (authLoading || (user && loading)) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
        <div className="h-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded bg-muted" />
          <div className="h-56 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign in to use the Guided Program</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline" href="/login">
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (needsOnboarding || !progress) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        {error && (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}
        <OnboardingV2 saving={saving} onInitialize={initialize} />
      </div>
    )
  }

  return (
    <div className="entrance mx-auto max-w-6xl space-y-8 p-4 pt-6 md:p-8 md:pt-10">
      <TodaysPractice sessionType={todayType} currentTargetMs={currentTargetMs} status={status} />

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <TargetProgress
          currentTargetMs={currentTargetMs}
          nextTargetMs={nextTargetMs}
          status={status}
          gate={gate}
          observations={observations}
        />
        <div className="space-y-6 lg:space-y-8">
          <WeeklyPlan />
          <DailyPracticeV2 />
        </div>
      </div>

      <ContextGuidanceV2
        sessions={sessions}
        rescueEvents={rescueEvents}
        gate={gate}
        currentTargetMs={currentTargetMs}
      />

      <TrendsV2 baselines={baselines} controlSessions={controlSessions} />

      <TransferPanel
        transfer={transfer}
        transferSessions={transferSessions}
        daysSinceLastEjaculation={daysSinceLastEjaculation}
        encounterLogOpen={encounterLogOpen}
        onToggleEncounterLog={() => setEncounterLogOpen((open) => !open)}
      />

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        <span>
          Earlier Guided Program sessions stay stored as legacy history, are never converted into V2
          progression, and are never shown as V2 metrics.
        </span>
        <Link className="text-primary underline-offset-4 hover:underline" href="/progress">
          Open full progress history
        </Link>
      </p>
    </div>
  )
}
