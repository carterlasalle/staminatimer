'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDuration } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import type { BreathingMaintained, EjaculationOutcome } from '@/hooks/useProgramProgress'

export type SessionSummarySubmission = {
  selfRating: number
  breathingMaintained?: BreathingMaintained
  imageryRating?: number
  ejaculationOutcome: EjaculationOutcome
  notes?: string
  positionsUsed?: string[]
}

type SessionSummaryProps = {
  phase: number
  durationMs: number
  cyclesCompleted: number
  averageCycleIntervalMs: number | null
  completeStops: number
  timeInZoneMs: number
  highestArousalReached: number
  accidentallyFinished: boolean
  initialPositionsUsed?: string[]
  saving: boolean
  onSubmit: (data: SessionSummarySubmission) => Promise<void>
}

const phase7Positions = [
  'On your back (upward thrust)',
  'On your knees (missionary simulation)',
  'On your side (spooning simulation)',
  'Kneeling over toy',
]

export function SessionSummary({
  phase,
  durationMs,
  cyclesCompleted,
  averageCycleIntervalMs,
  completeStops,
  timeInZoneMs,
  highestArousalReached,
  accidentallyFinished,
  initialPositionsUsed,
  saving,
  onSubmit,
}: SessionSummaryProps) {
  const [selfRating, setSelfRating] = useState(3)
  const [breathingMaintained, setBreathingMaintained] = useState<BreathingMaintained>('mostly')
  const [imageryRating, setImageryRating] = useState(3)
  const [ejaculationOutcome, setEjaculationOutcome] = useState<EjaculationOutcome>(
    accidentallyFinished ? 'accidental' : 'no'
  )
  const [notes, setNotes] = useState('')
  const [positionsUsed, setPositionsUsed] = useState<string[]>(initialPositionsUsed ?? [])

  useEffect(() => {
    if (phase >= 7) {
      setPositionsUsed(initialPositionsUsed ?? [])
    }
  }, [initialPositionsUsed, phase])

  const outcomeGuidance = useMemo(() => {
    if (ejaculationOutcome === 'no') {
      return 'Session complete without ejaculation. This supports reflex retraining.'
    }
    if (ejaculationOutcome === 'intentional_after') {
      return 'Intentional post-session release logged. This is healthy maintenance when scheduled.'
    }
    return "Early ejaculation logged. It doesn't reset your phase. Extend the gap next time."
  }, [ejaculationOutcome])

  const togglePosition = (position: string) => {
    setPositionsUsed((prev) =>
      prev.includes(position) ? prev.filter((value) => value !== position) : [...prev, position]
    )
  }

  const submit = async () => {
    await onSubmit({
      selfRating,
      breathingMaintained: phase >= 2 ? breathingMaintained : undefined,
      imageryRating: phase >= 3 ? imageryRating : undefined,
      ejaculationOutcome,
      notes: notes.trim() || undefined,
      positionsUsed: phase >= 7 ? positionsUsed : undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Post-Session Debrief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Duration" value={formatDuration(durationMs)} />
          <Stat label="Cycles" value={`${cyclesCompleted}`} />
          <Stat label="Complete Stops" value={`${completeStops}`} />
          <Stat label="Time in 7-8" value={formatDuration(timeInZoneMs)} />
          <Stat label="Highest Arousal" value={`${highestArousalReached}/10`} />
        </div>

        {averageCycleIntervalMs !== null && (
          <p className="text-xs text-muted-foreground">
            Average time between cycles: {formatDuration(averageCycleIntervalMs)}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>How would you rate control in this session? (1-5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={selfRating}
              onChange={(event) =>
                setSelfRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Did you finish today?</Label>
            <Select
              value={ejaculationOutcome}
              onValueChange={(value) => setEjaculationOutcome(value as EjaculationOutcome)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="accidental">Yes (accidental finish)</SelectItem>
                <SelectItem value="intentional_after">Yes (intentional after session)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{outcomeGuidance}</p>
          </div>
        </div>

        {phase >= 2 && (
          <div className="space-y-2">
            <Label>Did you maintain breathing throughout?</Label>
            <Select
              value={breathingMaintained}
              onValueChange={(value) => setBreathingMaintained(value as BreathingMaintained)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="mostly">Mostly</SelectItem>
                <SelectItem value="no">No - kept holding breath</SelectItem>
              </SelectContent>
            </Select>
            {breathingMaintained === 'no' && (
              <p className="text-xs text-muted-foreground">
                Breath-holding is automatic under spike pressure. Next session, treat every breath hold as your STOP cue.
              </p>
            )}
          </div>
        )}

        {phase >= 3 && (
          <div className="space-y-2">
            <Label>Imagery quality rating (1-5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={imageryRating}
              onChange={(event) =>
                setImageryRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))
              }
            />
            {imageryRating <= 2 && (
              <p className="text-xs text-muted-foreground">
                If imagery feels weak, do a 2-minute sensory preview before touching: visual, touch, scent, sound, and emotional tone.
              </p>
            )}
          </div>
        )}

        {phase >= 7 && (
          <div className="space-y-2">
            <Label>Positions used this session</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {phase7Positions.map((position) => (
                <button
                  type="button"
                  key={position}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${positionsUsed.includes(position) ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/20 hover:bg-muted/40'}`}
                  onClick={() => togglePosition(position)}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What spiked arousal, what calmed it, what to repeat next time"
          />
        </div>

        <Button onClick={submit} disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving session...' : 'Save session'}
        </Button>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
