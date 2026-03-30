'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const INHALE_MS = 4_000
const EXHALE_MS = 6_000
const CYCLE_MS = INHALE_MS + EXHALE_MS

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
    <div className="rounded-xl border border-border/60 bg-card/70 p-4">
      <div className="flex flex-col items-center justify-center gap-3">
        <motion.div
          className={`h-24 w-24 rounded-full border-2 ${inhale ? 'border-sky-400/60 bg-sky-500/10' : 'border-emerald-400/60 bg-emerald-500/10'}`}
          animate={{
            scale: inhale ? 1.18 : 0.94,
            boxShadow: inhale
              ? '0 0 0 14px rgba(56, 189, 248, 0.10)'
              : '0 0 0 10px rgba(16, 185, 129, 0.10)',
          }}
          transition={{
            duration: inhale ? 4 : 6,
            ease: 'easeInOut',
          }}
        />
        <div className="text-center">
          <p className={`text-sm font-medium ${inhale ? 'text-sky-400' : 'text-emerald-400'}`}>
            {inhale ? 'Breathe in...' : 'Breathe out...'}
          </p>
          <p className="text-xs text-muted-foreground">{secondsLeft}s</p>
        </div>
      </div>
    </div>
  )
}
