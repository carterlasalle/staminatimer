'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

type PhaseAdvancementModalProps = {
  open: boolean
  nextPhase: number | null
  onClose: () => void
}

export function PhaseAdvancementModal({ open, nextPhase, onClose }: PhaseAdvancementModalProps) {
  if (!nextPhase) {
    return null
  }

  const isPhaseEight = nextPhase === 8

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPhaseEight ? 'Phase 8 Unlocked' : `Phase ${nextPhase} Unlocked`}</DialogTitle>
          <DialogDescription>
            {isPhaseEight
              ? 'You completed the full protocol. Phase 8 is maintenance and mastery.'
              : 'You completed all qualifying sessions for this phase and advanced.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isPhaseEight ? (
            <div className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
              <motion.div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                <Award className="h-6 w-6 text-emerald-300" />
              </motion.div>
              <ConfettiRow />
              <p className="text-sm text-muted-foreground">
                You completed all eight phases. This adaptation was built through consistent repetition and neuroplastic change,
                not temporary suppression. Phase 8 is maintenance and mastery: keep practicing with flexible structure so your
                capacity remains durable in real encounters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">
                Continue with deliberate practice. Capacity expands with consistency, not intensity spikes.
              </p>
            </div>
          )}
        </div>

        <Button onClick={onClose}>Continue</Button>
      </DialogContent>
    </Dialog>
  )
}

function ConfettiRow() {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 14 }).map((_, idx) => (
        <motion.span
          key={idx}
          className="h-2 w-2 rounded-full bg-emerald-400"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [-8, 0, 12] }}
          transition={{
            duration: 1.6,
            delay: idx * 0.04,
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
        />
      ))}
    </div>
  )
}
