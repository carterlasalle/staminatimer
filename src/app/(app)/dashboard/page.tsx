'use client'

export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { OnboardingTutorial, useOnboarding } from '@/components/OnboardingTutorial'
import { useProgramV2Progress } from '@/hooks/useProgramV2Progress'
import {
  formatTarget,
  getMondayFirstDayIndex,
  getProgressionRequirement,
  getScheduledSessionType,
  getSessionPrescription,
} from '@/lib/program/protocol-v2'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { showOnboarding, completeOnboarding } = useOnboarding()
  const { loading, error, refresh, needsOnboarding, currentTargetMs, gate, sessions } =
    useProgramV2Progress()
  const today = new Date()
  const sessionType = getScheduledSessionType(today)
  const prescription = getSessionPrescription(sessionType)
  const latest = sessions[0]
  const requirement = getProgressionRequirement(currentTargetMs)
  const todayIndex = getMondayFirstDayIndex(today)
  const recentBestMs = sessions.reduce<number | null>((best, session) => {
    const duration = session.longest_continuous_block_ms
    if (duration === null || duration <= 0) return best

    return best === null || duration > best ? duration : best
  }, null)

  return (
    <AppNavigation>
      <OnboardingTutorial isOpen={showOnboarding} onComplete={completeOnboarding} />
      {error ? (
        <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-12">
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Today</p>
          <h1 className="mt-5 font-display text-4xl tracking-[-0.05em]">
            We couldn&apos;t load your training data.
          </h1>
          <p role="alert" className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {error}
          </p>
          <button className="today-start-action mt-8" type="button" onClick={() => void refresh()}>
            Try again <ArrowRight className="h-4 w-4" />
          </button>
        </main>
      ) : (
        <div className="today-page">
          <div className="today-atmosphere" aria-hidden>
            <span />
            <span />
          </div>
          <header className="relative max-w-6xl px-5 pt-9 sm:px-8 lg:px-12 lg:pt-12">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Today</p>
            <div className="mt-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Getting today’s prescription'
                    : needsOnboarding
                      ? 'Set your starting point first'
                      : prescription.label}
                </p>
                <h1 className="mt-2 font-display text-6xl leading-none tracking-[-0.07em] tabular-nums sm:text-8xl">
                  {loading ? '—' : formatTarget(currentTargetMs)}
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {loading
                    ? 'Your session details will appear here when the program is ready.'
                    : needsOnboarding
                      ? 'Choose a baseline and the program will give you a clear session for today.'
                      : prescription.summary}
                </p>
              </div>
              {loading ? (
                <span className="today-start-action cursor-wait opacity-60" aria-live="polite">
                  Loading session
                </span>
              ) : (
                <Link
                  href={needsOnboarding ? '/program' : `/program/session?type=${sessionType}`}
                  className="today-start-action"
                >
                  {needsOnboarding ? 'Set up program' : 'Begin session'}{' '}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </header>

          <section
            aria-label="Current training metrics"
            className="relative mx-5 mt-14 max-w-6xl border-y border-border/60 sm:mx-8 lg:mx-12"
          >
            <dl className="grid divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              <div className="py-5 sm:px-5 sm:first:pl-0">
                <dt className="text-xs text-muted-foreground">Current target</dt>
                <dd className="mt-2 font-display text-3xl tracking-[-0.05em] tabular-nums">
                  {loading ? '—' : formatTarget(currentTargetMs)}
                </dd>
              </div>
              <div className="py-5 sm:px-5">
                <dt className="text-xs text-muted-foreground">Recent best</dt>
                <dd className="mt-2 font-display text-3xl tracking-[-0.05em] tabular-nums">
                  {loading ? '—' : recentBestMs ? formatTarget(recentBestMs) : '—'}
                </dd>
              </div>
              <div className="py-5 sm:px-5">
                <dt className="text-xs text-muted-foreground">Observations</dt>
                <dd className="mt-2 font-display text-3xl tracking-[-0.05em] tabular-nums">
                  {loading
                    ? '—'
                    : `${gate?.observationCount ?? 0} / ${requirement.requiredObservations}`}
                </dd>
              </div>
              <div className="py-5 sm:px-5 sm:last:pr-0">
                <dt className="text-xs text-muted-foreground">Passes</dt>
                <dd className="mt-2 font-display text-3xl tracking-[-0.05em] tabular-nums">
                  {loading ? '—' : `${gate?.passCount ?? 0} / ${requirement.requiredPasses}`}
                </dd>
              </div>
            </dl>
          </section>

          <section className="relative mx-5 mt-14 grid max-w-6xl gap-10 pb-16 sm:mx-8 lg:mx-12 lg:grid-cols-[1.4fr_.6fr]">
            <div>
              <div className="flex items-end justify-between border-b border-border/60 pb-4">
                <h2 className="font-display text-3xl tracking-[-0.045em]">Weekly rhythm</h2>
                <Link href="/program" className="text-sm text-primary hover:underline">
                  View program
                </Link>
              </div>
              <div className="today-rhythm mt-6">
                {[
                  ['M', 'Monday'],
                  ['T', 'Tuesday'],
                  ['W', 'Wednesday'],
                  ['T', 'Thursday'],
                  ['F', 'Friday'],
                  ['S', 'Saturday'],
                  ['S', 'Sunday'],
                ].map(([day, name], index) => (
                  <span
                    key={name}
                    title={name}
                    className={index === todayIndex ? 'is-current' : undefined}
                  >
                    {day}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Today&apos;s session is {prescription.label.toLowerCase()}. The schedule gives each
                day a separate job, so the signal stays readable.
              </p>
            </div>
            <div className="border-t border-border/60 pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <p className="text-xs text-muted-foreground">Recent session</p>
              <p className="mt-2 text-lg">
                {latest ? getSessionPrescription(latest.session_type).label : 'No sessions yet'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {latest
                  ? `${formatTarget(latest.longest_continuous_block_ms ?? 0)} longest continuous block`
                  : 'Your first result will appear here.'}
              </p>
              <Link
                href="/progress"
                className="mt-6 inline-flex text-sm text-primary hover:underline"
              >
                Open progress <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      )}
    </AppNavigation>
  )
}
