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
import { useEffect, useMemo, useState } from 'react'

type EncounterDurationBucket = 'under-2' | '2-5' | '5-10' | '10-20' | '20-plus'

type EncounterLogEntry = {
  id: string
  createdAt: string
  durationBucket: EncounterDurationBucket
  controlRating: number
  notes: string
  usedCondom: 'yes' | 'no'
}

const STORAGE_KEY = 'program_encounter_logs'

const durationLabelMap: Record<EncounterDurationBucket, string> = {
  'under-2': 'Under 2 min',
  '2-5': '2-5 min',
  '5-10': '5-10 min',
  '10-20': '10-20 min',
  '20-plus': '20+ min',
}

function createEntryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `enc-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function EncounterLog() {
  const [entries, setEntries] = useState<EncounterLogEntry[]>([])
  const [durationBucket, setDurationBucket] = useState<EncounterDurationBucket>('2-5')
  const [controlRating, setControlRating] = useState(3)
  const [notes, setNotes] = useState('')
  const [usedCondom, setUsedCondom] = useState<'yes' | 'no'>('no')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw) as EncounterLogEntry[]
      setEntries(Array.isArray(parsed) ? parsed : [])
    } catch {
      setEntries([])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // Ignore localStorage errors
    }
  }, [entries])

  const recentEntries = useMemo(() => entries.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [entries])

  const addEntry = () => {
    const entry: EncounterLogEntry = {
      id: createEntryId(),
      createdAt: new Date().toISOString(),
      durationBucket,
      controlRating,
      notes: notes.trim(),
      usedCondom,
    }
    setEntries((prev) => [entry, ...prev])
    setNotes('')
    setDurationBucket('2-5')
    setControlRating(3)
    setUsedCondom('no')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Phase 8 Real Encounter Log (Local Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This log stays on this device only and is never synced to server storage.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Approximate duration of penetrative sex</Label>
            <Select
              value={durationBucket}
              onValueChange={(value) => setDurationBucket(value as EncounterDurationBucket)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-2">Under 2 min</SelectItem>
                <SelectItem value="2-5">2-5 min</SelectItem>
                <SelectItem value="5-10">5-10 min</SelectItem>
                <SelectItem value="10-20">10-20 min</SelectItem>
                <SelectItem value="20-plus">20+ min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Control rating (1-5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={controlRating}
              onChange={(event) =>
                setControlRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Did you use a condom?</Label>
            <Select value={usedCondom} onValueChange={(value) => setUsedCondom(value as 'yes' | 'no')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What worked, what spiked, what helped"
            />
          </div>
        </div>

        <Button onClick={addEntry}>Save encounter log</Button>

        {recentEntries.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Control trend</p>
            <div className="space-y-2">
              {recentEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    <span>
                      {durationLabelMap[entry.durationBucket]} • rating {entry.controlRating}/5
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(entry.controlRating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
