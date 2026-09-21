'use client'

import { useEffect, useRef, useState } from 'react'

const INHALE_MS = 4_000
const EXHALE_MS = 6_000
const CYCLE_MS = INHALE_MS + EXHALE_MS

/**
 * A 4s-in / 6s-out pacer. The ring is driven entirely by CSS keyframes on
 * transform and opacity, so it stays on the compositor for the whole six
 * minutes a Reset session runs and never touches paint or layout.
 */
export function BreathingPacer() {
  const cycleStartAtRef = useRef(Date.now())
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const elapsedInCycle = (nowMs - cycleStartAtRef.current) % CYCLE_MS
  const inhale = elapsedInCycle < INHALE_MS
  const msLeftInPhase = inhale ? INHALE_MS - elapsedInCycle : CYCLE_MS - elapsedInCycle
  const secondsLeft = Math.max(1, Math.ceil(msLeftInPhase / 1000))

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-4"
      role="timer"
      aria-live="off"
      aria-label={`${inhale ? 'Breathe in' : 'Breathe out'}, ${secondsLeft} seconds remaining in this phase`}
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span aria-hidden className="breathe-halo absolute inset-0 rounded-full bg-primary/25" />
        <span
          aria-hidden
          className="breathe-ring absolute inset-4 rounded-full border-2 border-primary/60 bg-primary/10"
        />
        <span className="tabular-nums font-display text-4xl leading-none text-foreground">
          {secondsLeft}
        </span>
      </div>

      <p className="text-sm font-medium tracking-wide text-muted-foreground">
        {inhale ? 'Breathe in' : 'Breathe out'}
      </p>
    </div>
  )
}
