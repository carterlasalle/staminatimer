'use client'

import { AnimatedGroup } from '@/components/motion/AnimatedGroup'
import { ModeToggle } from '@/components/mode-toggle'
import { NumberTicker } from '@/components/motion/NumberTicker'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { Button } from '@/components/ui/button'
import {
  FIVE_MINUTE_CHECKPOINT_MS,
  TARGET_LADDER_MS,
  WEEKLY_PLAN,
  formatTarget,
  getProgressionRequirement,
  getSessionPrescription,
} from '@/lib/program/protocol-v2'
import { ArrowRight, BarChart3, Bot, Lock, ShieldCheck, Target, Timer, Trophy } from 'lucide-react'
import Link from 'next/link'

const EXAMPLE_TARGET_MS = TARGET_LADDER_MS[4] // 4:00
const EXAMPLE_GATE = getProgressionRequirement(EXAMPLE_TARGET_MS)

const INCLUDED = [
  {
    icon: Timer,
    title: 'Precision timer',
    description: 'Wall-clock accuracy for active time, holds and finishes.',
  },
  {
    icon: BarChart3,
    title: 'Measured progress',
    description: 'Longest continuous block, standardized baseline, and rescue-stop trends.',
  },
  {
    icon: Bot,
    title: 'Optional AI coach',
    description: 'Ask questions about your own sessions. Entirely opt-in.',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Milestones for consistency, not for withholding anything.',
  },
]

const PRIVACY_POINTS = [
  {
    icon: Lock,
    title: 'Your records stay yours',
    description:
      'Every training row is scoped to your account by database row-level security, not by application code.',
  },
  {
    icon: ShieldCheck,
    title: 'No ads, no data selling',
    description:
      'There is no advertising and no data broker in this product. Analytics is optional and never carries session content.',
  },
]

/** The one card the product is built around, rendered from the real protocol. */
function TargetPanel() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Current target
      </p>
      <p className="mt-2 font-display text-5xl leading-none tracking-tight tabular-nums">
        {formatTarget(EXAMPLE_TARGET_MS)}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <NumberTicker value={EXAMPLE_GATE.requiredPasses} durationMs={900} /> of{' '}
          {EXAMPLE_GATE.requiredObservations} passed
        </p>
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-1.5 w-7 rounded-full bg-primary" />
          <span className="h-1.5 w-7 rounded-full bg-primary" />
          <span className="h-1.5 w-7 rounded-full bg-destructive/60" />
          <span className="h-1.5 w-7 rounded-full bg-muted" />
        </span>
      </div>

      <p className="mt-4 border-t border-border/60 pt-4 text-sm text-muted-foreground">
        At least {EXAMPLE_GATE.requiredStrictPasses} passing result must come from an Endurance or
        Baseline session, so the target only moves when performance repeats.
      </p>
    </div>
  )
}

function WeekPanel() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Your week
      </p>
      <ul className="mt-3 divide-y divide-border/60">
        {WEEKLY_PLAN.map((entry) => (
          <li key={entry.day} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-muted-foreground">{entry.day}</span>
            <span className="flex items-center gap-2">
              <span>{getSessionPrescription(entry.sessionType).label}</span>
              {entry.optional && <span className="text-xs text-muted-foreground">optional</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Home() {
  // Signed-in visitors are sent to their dashboard by the middleware, which has
  // already validated the session. Doing it here meant loading `supabase-js` on
  // the landing page — the only thing that pulled it into the public bundle — to
  // run a check the server had already done.
  return (
    <div className="app-ground min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
              <Timer className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              Stamina Timer
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            <a href="#program" className="text-sm text-muted-foreground hover:text-foreground">
              The program
            </a>
            <a href="#included" className="text-sm text-muted-foreground hover:text-foreground">
              What&apos;s inside
            </a>
            <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">
              Guides
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Start training</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero: the promise on the left, the product on the right. */}
        <section className="entrance mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Guided training for lasting longer
              </p>

              {/*
                Deliberately a plain h1 with the CSS rise-in, not a SplitHeading.
                The hero headline is the largest-contentful element, so any
                entrance animation on it delays the moment it reaches its final
                painted state — and therefore the LCP. Measured on a throttled
                mobile profile: SplitText here took LCP from 2.2 s to 4.4 s. The
                section headings below the fold use it instead, where it costs
                nothing that is measured.
              */}
              <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Build lasting control, measured one session at a time.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                A structured program that trains continuous control instead of chasing peak arousal.
                Ten minutes a day, a target that only advances when your performance repeats, and
                records that stay yours.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/login">
                    Start training
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#program">See how it works</a>
                </Button>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                  Private by design
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" aria-hidden />
                  No credit card
                </li>
                <li>
                  <a
                    href="https://github.com/carterlasalle/staminatimer"
                    className="hover:text-foreground"
                  >
                    Open source (MIT)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <TargetPanel />
              <WeekPanel />
            </div>
          </div>
        </section>

        {/* The method: the actual weekly prescription and target ladder. */}
        <section id="program" className="border-y border-border/60 bg-card/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                The program
              </p>
              <SplitHeading
                as="h2"
                delay={0.05}
                className="mt-3 font-display text-3xl tracking-tight sm:text-4xl"
              >
                Most training time around moderate arousal
              </SplitHeading>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Each session type has one job. Control builds the block. Endurance tests it once
                without a retry. Baseline measures it the same way every time. Reset is breathing,
                not training.
              </p>
            </div>

            <AnimatedGroup
              className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12"
              itemClassName=""
              stagger={0.08}
            >
              <div>
                <h3 className="text-sm font-medium">Steady, accelerating, or a full reset</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  When arousal climbs you slow down and keep going. Slowing never breaks the
                  continuous block. A full stop is a rescue, and you only resume once urgency has
                  genuinely dropped to around 3-4/10 — there is no countdown to wait out.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Two rapid rescues end the block</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  If you stop, resume and stop again within about two minutes of active stimulation,
                  the session ends. That keeps practice from turning into repeated edge-and-recover
                  cycles.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">The 5:00 checkpoint locks</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {formatTarget(FIVE_MINUTE_CHECKPOINT_MS)} is deliberately harder to pass: it needs{' '}
                  {getProgressionRequirement(FIVE_MINUTE_CHECKPOINT_MS).requiredPasses} of{' '}
                  {getProgressionRequirement(FIVE_MINUTE_CHECKPOINT_MS).requiredObservations}{' '}
                  observations, with two from Endurance or Baseline. Above it, the ladder runs to{' '}
                  {formatTarget(TARGET_LADDER_MS[TARGET_LADDER_MS.length - 1])}.
                </p>
              </div>
            </AnimatedGroup>

            <ScrollReveal className="mt-12 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs uppercase tracking-wider">Target ladder</span>
              {TARGET_LADDER_MS.map((target) => (
                <span
                  key={target}
                  className="rounded-md border border-border/60 px-2 py-1 tabular-nums"
                >
                  {formatTarget(target)}
                </span>
              ))}
            </ScrollReveal>
          </div>
        </section>

        {/* What's included: a spec-style list, not a grid of identical cards. */}
        <section id="included" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  What&apos;s inside
                </p>
                <SplitHeading
                  as="h2"
                  delay={0.1}
                  className="mt-3 font-display text-3xl tracking-tight sm:text-4xl"
                >
                  Everything the training needs, nothing it doesn&apos;t
                </SplitHeading>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  No leaderboards, no streak pressure, and no claims about what a number on a scale
                  means about you.
                </p>
              </div>

              <ScrollReveal>
                <ul className="divide-y divide-border/60 border-y border-border/60">
                  {INCLUDED.map((item) => (
                    <li key={item.title} className="flex gap-4 py-5">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <div>
                        <h3 className="text-sm font-medium">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Privacy: the product's other half, stated plainly. */}
        <section className="border-y border-border/60 bg-card/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Privacy</p>
              <SplitHeading
                as="h2"
                delay={0.15}
                className="mt-3 font-display text-3xl tracking-tight sm:text-4xl"
              >
                Nothing here is anyone else&apos;s business
              </SplitHeading>
            </div>

            <ul className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
              {PRIVACY_POINTS.map((point) => (
                <li key={point.title}>
                  <point.icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-sm font-medium">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-sm text-muted-foreground">
              Read the{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>{' '}
              for the full data model.
            </p>
          </div>
        </section>

        {/* One closing action. */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <SplitHeading
              as="h2"
              delay={0.2}
              className="font-display text-3xl tracking-tight sm:text-4xl"
            >
              Start with today&apos;s session
            </SplitHeading>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The program tells you what to do today, what you are training toward, and whether
              today counted.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/guides">Read the guides</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Free to use. No credit card. Your data stays in your account.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <Timer className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-display text-base font-semibold tracking-tight">
                  Stamina Timer
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                A private training app for building control: a guided program, measured progress,
                and records that stay yours.
              </p>
            </div>

            <nav aria-labelledby="footer-resources">
              <h2 id="footer-resources" className="text-sm font-medium">
                Resources
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/guides"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Training guides
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="text-sm font-medium">
                Legal
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/license"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    License
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border/60 pt-8 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} Stamina Timer</p>
            <p>Not a medical device. This app does not diagnose or treat any condition.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
