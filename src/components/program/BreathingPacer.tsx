'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type BreathPhase = 'inhale' | 'exhale'

export function BreathingPacer() {
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [secondsLeft, setSecondsLeft] = useState(4)

  useEffect(() => {
    setSecondsLeft(phase === 'inhale' ? 4 : 6)

    const switchTimer = window.setTimeout(() => {
      setPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'))
    }, (phase === 'inhale' ? 4 : 6) * 1000)

    const tickTimer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(1, prev - 1))
    }, 1000)

    return () => {
      window.clearTimeout(switchTimer)
      window.clearInterval(tickTimer)
    }
  }, [phase])

  const inhale = phase === 'inhale'

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
