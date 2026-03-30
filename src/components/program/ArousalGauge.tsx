'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

type ArousalGaugeProps = {
  value: number
  onChange: (value: number) => void
  onCompleteStop: () => void
  showCompleteStopButton?: boolean
}

function zoneLabel(value: number) {
  if (value <= 5) return 'Recovery Zone'
  if (value === 6) return 'Building'
  if (value <= 8) return 'The Zone (Target)'
  if (value === 9) return 'Warning: Back Off'
  return 'PONR'
}

function zoneColorClass(level: number) {
  if (level <= 5) return 'bg-sky-500/50'
  if (level === 6) return 'bg-emerald-500/60'
  if (level <= 8) return 'bg-amber-400/70'
  if (level === 9) return 'bg-orange-500/80'
  return 'bg-red-500/90'
}

export function ArousalGauge({
  value,
  onChange,
  onCompleteStop,
  showCompleteStopButton = true,
}: ArousalGaugeProps) {
  const safeValue = Math.max(1, Math.min(10, Math.round(value)))

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange(safeValue - 1)}
            aria-label="Decrease arousal rating"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Arousal</p>
            <p className="text-xl font-semibold">{safeValue}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange(safeValue + 1)}
            aria-label="Increase arousal rating"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{zoneLabel(safeValue)}</p>
      </div>

      <div className="mt-4 flex items-end gap-1">
        {Array.from({ length: 10 }, (_, idx) => idx + 1).map((level) => (
          <button
            key={level}
            type="button"
            className={cn(
              'h-8 flex-1 rounded-sm transition-all hover:opacity-90',
              safeValue >= level ? zoneColorClass(level) : 'bg-muted'
            )}
            onClick={() => onChange(level)}
            aria-label={`Set arousal to ${level}`}
          />
        ))}
      </div>

      {showCompleteStopButton && (
        <Button
          className="mt-4 w-full"
          variant={safeValue >= 9 ? 'destructive' : 'outline'}
          onClick={onCompleteStop}
        >
          Complete Stop / Freeze
        </Button>
      )}
    </div>
  )
}
