'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BaselineSession } from '@/components/program/v2/BaselineSession'
import { ControlSession } from '@/components/program/v2/ControlSession'
import { EasySession } from '@/components/program/v2/EasySession'
import { EnduranceSession } from '@/components/program/v2/EnduranceSession'
import { ResetSession } from '@/components/program/v2/ResetSession'
import { SessionSummaryV2 } from '@/components/program/v2/SessionSummaryV2'
import { TransferSession } from '@/components/program/v2/TransferSession'
import { useAuth } from '@/contexts/AuthContext'
import { useGuidedSessionV2 } from '@/hooks/useGuidedSessionV2'
import { useProgramV2Progress, type RecordingResult } from '@/hooks/useProgramV2Progress'
import {
  formatTarget,
  getLocalDateKey,
  getScheduledSessionType,
  getSessionPrescription,
  type GuidedSessionType,
} from '@/lib/program/protocol-v2'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'

function isGuidedSessionType(value: string | null): value is GuidedSessionType {
  switch (value) {
    case 'control':
    case 'reset':
    case 'endurance':
    case 'easy':
    case 'baseline':
    case 'transfer':
      return true
    default:
      return false
  }
}

function resolveRequestedType(raw: string | null, fallback: GuidedSessionType): GuidedSessionType {
  return isGuidedSessionType(raw) ? raw : fallback
}

function SessionRunnerInner() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const progress = useProgramV2Progress()

  const todayKey = getLocalDateKey()
  const requestedType = resolveRequestedType(searchParams.get('type'), getScheduledSessionType())
  const prescription = getSessionPrescription(requestedType)

  const [result, setResult] = useState<RecordingResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const targetMs = progress.currentTargetMs
  const sleeveTargetMs = progress.transfer.suggestedSleeveTargetMs
  const sessionTargetMs = requestedType === 'transfer' ? sleeveTargetMs : targetMs

  const previousBaselineMs = useMemo(() => {
    const baseline = progress.baselines.find(
      (row) => row.continuous_attempt_ms !== null && row.standardized
    )

    return baseline?.continuous_attempt_ms ?? null
  }, [progress.baselines])

  const baselineRecordedToday = useMemo(
    () =>
      progress.sessions.some(
        (row) => row.session_type === 'baseline' && row.scheduled_local_date === todayKey
      ),
    [progress.sessions, todayKey]
  )

  const session = useGuidedSessionV2({
    userId: user?.id ?? 'anonymous',
    sessionType: requestedType,
    prepSeconds: prescription.prepSeconds,
    targetMs: sessionTargetMs,
    sleeveTargetMs,
  })

  if (authLoading || (user && progress.loading)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <div className="h-40 animate-pulse rounded bg-muted" />
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

  if (progress.needsOnboarding) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Guided Program V2 is not set up yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a starting point on the program page before running a session.
            </p>
            <Link className="text-primary underline" href="/program">
              Set up the Guided Program
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requestedType === 'transfer' && !progress.transfer.unlocked) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Transfer is locked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{progress.transfer.reason}</p>
            <Link className="text-primary underline" href="/program">
              Back to the program
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async () => {
    setSubmitError(null)

    try {
      const recording = await progress.recordSession(session.buildSubmission())
      setResult(recording)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save the session')
    }
  }

  if (session.stage === 'summary') {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        {submitError && (
          <Card>
            <CardContent className="p-4 text-sm text-red-400">{submitError}</CardContent>
          </Card>
        )}
        <SessionSummaryV2
          sessionType={requestedType}
          session={session}
          targetMs={sessionTargetMs}
          previousBaselineMs={previousBaselineMs}
          saving={progress.saving}
          result={result}
          onSubmit={handleSubmit}
          onDiscard={() => session.abandon()}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Today: {prescription.label}
          {prescription.countsTowardProgression ? '' : ' (does not count toward the hand target)'}
        </p>
        <p className="text-xs text-muted-foreground">
          {requestedType === 'transfer'
            ? `Device target ${formatTarget(sleeveTargetMs)}`
            : `Continuous target ${formatTarget(targetMs)}`}
        </p>
      </div>

      {requestedType === 'control' && <ControlSession session={session} />}
      {requestedType === 'endurance' && (
        <EnduranceSession session={session} targetMs={sessionTargetMs} />
      )}
      {requestedType === 'baseline' && (
        <BaselineSession
          session={session}
          alreadyRecordedToday={baselineRecordedToday}
          previousBaselineMs={previousBaselineMs}
        />
      )}
      {requestedType === 'reset' && <ResetSession session={session} />}
      {requestedType === 'easy' && <EasySession session={session} />}
      {requestedType === 'transfer' && (
        <TransferSession session={session} sleeveTargetMs={sleeveTargetMs} />
      )}

      <Link className="text-xs text-muted-foreground underline" href="/program">
        Leave session
      </Link>
    </div>
  )
}

export function SessionRunnerV2() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading session…</div>}>
      <SessionRunnerInner />
    </Suspense>
  )
}
