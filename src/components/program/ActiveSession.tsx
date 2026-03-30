'use client'

import { ArousalGauge } from '@/components/program/ArousalGauge'
import { BreathingPacer } from '@/components/program/BreathingPacer'
import { PhaseAdvancementModal } from '@/components/program/PhaseAdvancementModal'
import { SessionStage } from '@/components/program/SessionStage'
import { SessionSummary, type SessionSummarySubmission } from '@/components/program/SessionSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useProgramProgress } from '@/hooks/useProgramProgress'
import { useProgramSession } from '@/hooks/useProgramSession'
import { formatDuration } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const phase3IntentionPrefix = 'program_intention_'

const phase7Positions = [
  'On your back (upward thrust)',
  'On your knees (missionary simulation)',
  'On your side (spooning simulation)',
  'Kneeling over toy',
]

const phaseBriefings: Record<number, string> = {
  1: 'Phase 1 focuses on awareness and stop-before-7 patterning.',
  2: 'Phase 2 adds deliberate breathing as your primary arousal brake.',
  3: 'Phase 3 trains imagination-driven arousal without screen stimulus.',
  4: 'Phase 4 transitions to regulated time in the 7-8 zone.',
  5: 'Phase 5 removes full contact breaks: freeze in place and breathe down.',
  6: 'Phase 6 integrates toy-based stimulation and pressure modulation.',
  7: 'Phase 7 transfers control to hip-thrusting patterns with position rotation.',
  8: 'Phase 8 is maintenance: flexible structure, durable skill retention.',
}

export function ActiveSession() {
  const router = useRouter()
  const { loading, progress, saving, recordSession } = useProgramProgress()
  const phase = progress?.current_phase ?? 1
  const [showTechniquePanel, setShowTechniquePanel] = useState(false)
  const [phase3Intention, setPhase3Intention] = useState('')
  const [showAdvancementModal, setShowAdvancementModal] = useState(false)
  const [advancedToPhase, setAdvancedToPhase] = useState<number | null>(null)

  const session = useProgramSession(phase)
  const intentionStorageKey = `${phase3IntentionPrefix}${session.sessionClientId}`

  useEffect(() => {
    if (phase !== 3) {
      return
    }
    try {
      const raw = localStorage.getItem(intentionStorageKey)
      if (raw) {
        setPhase3Intention(raw)
      }
    } catch {
      setPhase3Intention('')
    }
  }, [intentionStorageKey, phase])

  useEffect(() => {
    if (phase !== 3) {
      return
    }
    try {
      localStorage.setItem(intentionStorageKey, phase3Intention)
    } catch {
      // Ignore local storage write errors
    }
  }, [intentionStorageKey, phase, phase3Intention])

  const canSelectArousal = session.stage === 'stage1' || session.stage === 'stage2'

  const sessionNumberInPhase = useMemo(
    () => (progress?.sessions_in_current_phase ?? 0) + 1,
    [progress?.sessions_in_current_phase]
  )

  const stage2ZoneBackgroundClass =
    phase >= 4
      ? session.arousalRating >= 9
        ? 'bg-orange-500/10'
        : session.arousalRating >= 7
          ? 'bg-amber-500/10'
          : session.arousalRating >= 6
            ? 'bg-emerald-500/10'
            : 'bg-sky-500/10'
      : ''

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-56 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const submitSummary = async (summary: SessionSummarySubmission) => {
    const startedAt = session.startedAt ?? new Date(Date.now() - session.sessionDurationMs).toISOString()
    const completedAt = session.completedAt ?? new Date().toISOString()

    const result = await recordSession({
      startedAt,
      completedAt,
      durationMs: session.sessionDurationMs,
      cyclesCompleted: session.cyclesCompleted,
      completeStops: session.completeStops,
      timeInZoneMs: session.timeInZoneMs,
      highestArousalReached: session.highestArousalReached,
      accidentallyFinished: session.accidentallyFinished,
      endedEarly: session.endedEarly,
      selfRating: summary.selfRating,
      breathingMaintained: summary.breathingMaintained,
      imageryRating: summary.imageryRating,
      positionsUsed: summary.positionsUsed,
      notes:
        [
          summary.notes?.trim(),
          session.averageCycleIntervalMs
            ? `avg_cycle_interval_ms=${session.averageCycleIntervalMs}`
            : null,
        ]
          .filter(Boolean)
          .join(' | ') || undefined,
      lubeUsed: session.lubeUsed,
      toyUsed: session.toyUsed,
      ejaculationOutcome: summary.ejaculationOutcome,
    })

    if (result.advancedToPhase) {
      setAdvancedToPhase(result.advancedToPhase)
      setShowAdvancementModal(true)
      return
    }

    router.push('/program')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Program Session {sessionNumberInPhase} • Phase {phase}
          </p>
          <CardTitle className="text-xl">{phaseBriefings[phase]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {phase === 8
              ? 'Phase 8 is maintenance. Use the suggested structure or customize it before starting.'
              : 'This is a guided protocol, not a free timer. Follow each stage in sequence.'}
          </p>
          {session.latestCue && (
            <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {session.latestCue}
            </div>
          )}
        </CardContent>
      </Card>

      {session.stage === 'commitment' && (
        <SessionStage
          badge="Stage 0A • Commitment Check"
          title="Before you begin"
          description="All three acknowledgements are required before session start."
        >
          {phase === 3 && (
            <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
              <Label htmlFor="phase3-intention">Pre-session intention (local only)</Label>
              <Input
                id="phase3-intention"
                value={phase3Intention}
                onChange={(event) => setPhase3Intention(event.target.value)}
                placeholder="a real person I'm attracted to / a specific scenario / a feeling to recreate"
              />
              <p className="text-xs text-muted-foreground">
                Stored on this device only, never synced.
              </p>
            </div>
          )}

          {phase === 8 && (
            <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="text-sm font-medium">Phase 8 freeform structure</p>
              <p className="text-xs text-muted-foreground">
                Suggested: 5 min warm-up + 15 min freeform. You can customize this.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phase8-warmup">Warm-up minutes</Label>
                  <Input
                    id="phase8-warmup"
                    type="number"
                    min={0}
                    max={30}
                    value={Math.round(session.phase8Config.warmupSeconds / 60)}
                    onChange={(event) => {
                      const value = Math.max(0, Math.min(30, Number(event.target.value) || 0))
                      session.setPhase8Config((prev) => ({ ...prev, warmupSeconds: value * 60 }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase8-main">Freeform minutes</Label>
                  <Input
                    id="phase8-main"
                    type="number"
                    min={5}
                    max={60}
                    value={Math.round(session.phase8Config.mainSessionSeconds / 60)}
                    onChange={(event) => {
                      const value = Math.max(5, Math.min(60, Number(event.target.value) || 15))
                      session.setPhase8Config((prev) => ({ ...prev, mainSessionSeconds: value * 60 }))
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <CommitmentSwitch
                  checked={session.phase8Config.includePositionSetup}
                  onCheckedChange={() =>
                    session.setPhase8Config((prev) => ({
                      ...prev,
                      includePositionSetup: !prev.includePositionSetup,
                    }))
                  }
                  label="Include position setup"
                />
                <CommitmentSwitch
                  checked={session.phase8Config.includePelvicCheck}
                  onCheckedChange={() =>
                    session.setPhase8Config((prev) => ({
                      ...prev,
                      includePelvicCheck: !prev.includePelvicCheck,
                    }))
                  }
                  label="Include pelvic floor check"
                />
                <CommitmentSwitch
                  checked={session.phase8Config.includeCooldown}
                  onCheckedChange={() =>
                    session.setPhase8Config((prev) => ({
                      ...prev,
                      includeCooldown: !prev.includeCooldown,
                    }))
                  }
                  label="Include cooldown"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  session.setPhase8Config({
                    includePositionSetup: true,
                    includePelvicCheck: true,
                    includeCooldown: true,
                    warmupSeconds: 5 * 60,
                    mainSessionSeconds: 15 * 60,
                  })
                }
              >
                Reset to suggested structure
              </Button>
            </div>
          )}

          <CommitmentSwitch
            checked={session.commitments.privateSpace}
            onCheckedChange={() => session.toggleCommitment('privateSpace')}
            label="I am in a private space with no risk of interruption"
          />
          <CommitmentSwitch
            checked={session.commitments.noPorn}
            onCheckedChange={() => session.toggleCommitment('noPorn')}
            label="I will not use porn or erotic images during this session"
          />
          <CommitmentSwitch
            checked={session.commitments.understandEarlyEndRule}
            onCheckedChange={() => session.toggleCommitment('understandEarlyEndRule')}
            label="I understand that finishing early ends my session and does not count toward my phase"
          />

          <Button onClick={session.startProgram} disabled={!session.allCommitmentsChecked}>
            Start Session
          </Button>
        </SessionStage>
      )}

      {session.stage === 'position_setup' && (
        <SessionStage
          badge="Stage 0B • Position Setup"
          title="Lie flat and downshift your nervous system"
          remainingSec={session.stageRemainingSec}
        >
          <p className="text-sm text-muted-foreground">
            Lie flat on your back. Legs straight and uncrossed. Arms relaxed by your sides. Take 3 slow breaths:
            inhale 4 seconds, exhale 6 seconds, and feel your lower belly expand on inhale.
          </p>
          <BodyOutlineSvg />
        </SessionStage>
      )}

      {session.stage === 'pelvic_check' && (
        <SessionStage
          badge="Stage 0C • Pelvic Floor Check"
          title="Scan and release"
          remainingSec={session.stageRemainingSec}
        >
          <p className="text-sm text-muted-foreground">
            Before touching yourself, scan the perineum for baseline clenching. Push outward gently as if beginning urination.
            Hold the open sensation 10 seconds, then release slowly.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={session.startRkPractice}>
              Practice RK (10s)
            </Button>
            {session.rkPracticeRemainingSec > 0 && (
              <p className="text-sm text-primary">
                Push out gently... hold... release slowly ({session.rkPracticeRemainingSec}s)
              </p>
            )}
          </div>
        </SessionStage>
      )}

      {session.stage === 'stage1' && (
        <SessionStage
          badge="Stage 1 • Erection Without Rush"
          title="Warm-up without escalation"
          remainingSec={session.stageRemainingSec}
        >
          <p className="text-sm text-muted-foreground">
            Start with no lube. Light touch, light grip. The target is erection without urgency and without chasing peak stimulation.
          </p>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm font-medium text-amber-300">FORESKIN DOWN</p>
            <p className="text-sm text-muted-foreground">
              Keep foreskin rolled down through this stage. Direct glans stimulation reduces training mismatch with penetrative friction.
            </p>
          </div>

          <ArousalSelector
            value={session.arousalRating}
            onChange={session.setArousalRating}
            disabled={!canSelectArousal}
          />

          {session.stage1HighArousalFlag && (
            <div className="rounded-md border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-muted-foreground">
              If warm-up felt close to finishing, this is performance anxiety + hypersensitivity patterning.
              Keep the stage. It trains separation between erection and urgency.
            </div>
          )}

          <Button variant="destructive" onClick={session.markAccidentalFinish}>
            Accidentally Finished
          </Button>
        </SessionStage>
      )}

      {session.stage === 'stage2' && (
        <SessionStage
          badge="Stage 2 • Main Session"
          title="Main protocol"
          remainingSec={session.stageRemainingSec}
        >
          <div className={`space-y-3 rounded-md border border-border/60 p-3 ${stage2ZoneBackgroundClass}`}>
            <p className="text-sm text-muted-foreground">
              Add water-based lube now. Enough for glide, not saturation.
            </p>
            <p className="text-sm text-muted-foreground">
              Keep your pelvic floor relaxed throughout. Push out gently as if peeing, without strain.
            </p>
          </div>

          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => setShowTechniquePanel((prev) => !prev)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                Technique foundation
                {showTechniquePanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
            {showTechniquePanel && (
              <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Grip:</span> medium and relaxed. Avoid calibrating to a tighter-than-sex stimulus.
                </p>
                <p>
                  <span className="font-medium text-foreground">Speed:</span> slower than feels natural. Build tolerance at low intensity first.
                </p>
                <p>
                  <span className="font-medium text-foreground">Breath:</span> exhale on every stroke, inhale on recovery. Long exhales lower arousal.
                </p>
              </CardContent>
            )}
          </Card>

          {phase >= 2 && <BreathingPacer />}

          {phase <= 3 ? (
            <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="text-sm font-medium">
                State: {session.buildState === 'build' ? 'BUILD' : 'STOP'}
              </p>
              {phase === 2 && (
                <p className="text-sm text-muted-foreground">
                  Keep your exhale longer than inhale throughout BUILD. If breath stalls, treat it as 7+ and STOP.
                </p>
              )}
              <ArousalSelector
                value={session.arousalRating}
                onChange={session.setArousalRating}
                disabled={!canSelectArousal}
              />
              {session.buildState === 'build' ? (
                <Button onClick={session.triggerBuildStop}>I&apos;m at 7+</Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Stop timer: {session.regulationRemainingSec}s
                  </p>
                  <Button
                    variant="outline"
                    disabled={session.regulationRemainingSec > 0}
                    onClick={session.resumeFromRegulation}
                  >
                    Resume at 4-5
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <ArousalGauge
                value={session.arousalRating}
                onChange={session.setArousalRating}
                onCompleteStop={session.triggerCompleteStop}
              />
              {session.buildState !== 'build' && (
                <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm">
                  <p className="font-medium">
                    {session.buildState === 'freeze' ? 'Freeze timer' : 'Complete stop timer'}: {session.regulationRemainingSec}s
                  </p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    disabled={session.regulationRemainingSec > 0}
                    onClick={session.resumeFromRegulation}
                  >
                    Resume
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Time in The Zone (7-8): {formatDuration(session.timeInZoneMs)}
              </p>
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Zone modulation</p>
                <p>To drop 8 → 7: slow pace by half without stopping.</p>
                <p>To drop 9 → 8: remove hand 5 seconds, breathe, restart minimal.</p>
                <p>To hold 7-8: alternate shaft (stabilizer) and glans (accelerator) stimulation.</p>
              </div>
            </div>
          )}

          {phase === 5 && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Phase 5 grip progression</p>
              <p>Start very light. After 5 min, shift to medium pressure.</p>
              <p>After 10 min, add one 30-second firmer interval then return to medium.</p>
              <p>From 12 min onward, run one 10-second normal-speed burst and regulate before 9.</p>
            </div>
          )}

          {phase === 3 && (
            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
              Imagery anchor: {phase3Intention.trim() || 'No intention set. Use person/scenario-based imagery.'}
            </div>
          )}

          {phase >= 7 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Position rotation tracking</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {phase7Positions.map((position) => (
                  <button
                    type="button"
                    key={position}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${session.positionsUsed.includes(position) ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/20 hover:bg-muted/40'}`}
                    onClick={() => session.togglePositionUsed(position)}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="destructive" onClick={session.markAccidentalFinish}>
              Accidentally Finished
            </Button>
            <Button variant="outline" onClick={session.markEndedEarly}>
              End Early (Incomplete)
            </Button>
          </div>
        </SessionStage>
      )}

      {session.stage === 'cooldown' && (
        <SessionStage
          badge="Stage 3 • Cool Down"
          title="Down-regulate and lock in the pattern"
          remainingSec={session.stageRemainingSec}
        >
          <p className="text-sm text-muted-foreground">
            Stop stimulation completely. Breathe 4 seconds in, 6 seconds out. Perform 3 reverse-kegel releases in this window.
          </p>
        </SessionStage>
      )}

      {session.stage === 'summary' && (
        <SessionSummary
          phase={phase}
          durationMs={session.sessionDurationMs}
          cyclesCompleted={session.cyclesCompleted}
          averageCycleIntervalMs={session.averageCycleIntervalMs}
          completeStops={session.completeStops}
          timeInZoneMs={session.timeInZoneMs}
          highestArousalReached={session.highestArousalReached}
          accidentallyFinished={session.accidentallyFinished}
          saving={saving}
          onSubmit={submitSummary}
        />
      )}

      <PhaseAdvancementModal
        open={showAdvancementModal}
        nextPhase={advancedToPhase}
        onClose={() => {
          setShowAdvancementModal(false)
          router.push('/program')
        }}
      />
    </div>
  )
}

function CommitmentSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: () => void
  label: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-muted/20 p-3">
      <Label className="leading-snug">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function ArousalSelector({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Where are you on the scale?</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, idx) => idx + 1).map((rating) => (
          <Button
            key={rating}
            type="button"
            variant={value === rating ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => onChange(rating)}
            className="h-9"
          >
            {rating}
          </Button>
        ))}
      </div>
    </div>
  )
}

function BodyOutlineSvg() {
  return (
    <svg viewBox="0 0 420 120" className="h-24 w-full rounded-md border border-border/50 bg-muted/30 p-2">
      <circle cx="40" cy="60" r="12" fill="currentColor" className="text-muted-foreground" />
      <rect x="52" y="52" width="148" height="16" rx="8" fill="currentColor" className="text-muted-foreground" />
      <rect x="200" y="56" width="58" height="8" rx="4" fill="currentColor" className="text-muted-foreground" />
      <rect x="258" y="56" width="58" height="8" rx="4" fill="currentColor" className="text-muted-foreground" />
      <rect x="132" y="70" width="54" height="8" rx="4" fill="currentColor" className="text-muted-foreground" />
      <rect x="132" y="42" width="54" height="8" rx="4" fill="currentColor" className="text-muted-foreground" />
      <text x="330" y="50" className="fill-current text-xs text-muted-foreground">Flat on back</text>
      <text x="330" y="68" className="fill-current text-xs text-muted-foreground">Legs straight</text>
      <text x="330" y="86" className="fill-current text-xs text-muted-foreground">Arms relaxed</text>
    </svg>
  )
}
