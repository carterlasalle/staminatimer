'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ProgramStage =
  | 'commitment'
  | 'position_setup'
  | 'pelvic_check'
  | 'stage1'
  | 'stage2'
  | 'cooldown'
  | 'summary'

type BuildState = 'build' | 'stop' | 'freeze'

type CommitmentState = {
  privateSpace: boolean
  noPorn: boolean
  understandEarlyEndRule: boolean
}

type ArousalSample = {
  atMs: number
  rating: number
  stage: ProgramStage
}

type Phase8Config = {
  includePositionSetup: boolean
  includePelvicCheck: boolean
  includeCooldown: boolean
  warmupSeconds: number
  mainSessionSeconds: number
}

const STAGE_DURATIONS_SECONDS: Record<Exclude<ProgramStage, 'commitment' | 'summary'>, number> = {
  position_setup: 60,
  pelvic_check: 60,
  stage1: 5 * 60,
  stage2: 20 * 60,
  cooldown: 2 * 60,
}

function createSessionClientId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `program-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getStageDurationSeconds(phase: number, stage: ProgramStage) {
  if (stage === 'commitment' || stage === 'summary') {
    return 0
  }

  // Phase 8 has suggested freeform structure of 5m warm-up + 15m freeform.
  if (phase === 8 && stage === 'stage2') {
    return 15 * 60
  }

  return STAGE_DURATIONS_SECONDS[stage]
}

function getStageDurationSecondsForConfig(phase: number, stage: ProgramStage, phase8Config: Phase8Config) {
  if (stage === 'commitment' || stage === 'summary') {
    return 0
  }

  if (phase !== 8) {
    return getStageDurationSeconds(phase, stage)
  }

  if (stage === 'position_setup') {
    return phase8Config.includePositionSetup ? 60 : 0
  }
  if (stage === 'pelvic_check') {
    return phase8Config.includePelvicCheck ? 60 : 0
  }
  if (stage === 'stage1') {
    return phase8Config.warmupSeconds
  }
  if (stage === 'stage2') {
    return phase8Config.mainSessionSeconds
  }
  if (stage === 'cooldown') {
    return phase8Config.includeCooldown ? 120 : 0
  }

  return 0
}

function clampArousal(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)))
}

const initialCommitments: CommitmentState = {
  privateSpace: false,
  noPorn: false,
  understandEarlyEndRule: false,
}

export function useProgramSession(phase: number) {
  const sessionClientIdRef = useRef(createSessionClientId())
  const cueFlagsRef = useRef<Record<string, boolean>>({})
  const stage2StartedAtRef = useRef<number | null>(null)
  const stageEndAtMsRef = useRef<number | null>(null)

  const [phase8Config, setPhase8Config] = useState<Phase8Config>({
    includePositionSetup: true,
    includePelvicCheck: true,
    includeCooldown: true,
    warmupSeconds: 5 * 60,
    mainSessionSeconds: 15 * 60,
  })

  const [stage, setStage] = useState<ProgramStage>('commitment')
  const [stageRemainingSec, setStageRemainingSec] = useState(0)
  const [isStageRunning, setIsStageRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [latestCue, setLatestCue] = useState<string | null>(null)

  const [commitments, setCommitments] = useState<CommitmentState>(initialCommitments)
  const [rkPracticeRemainingSec, setRkPracticeRemainingSec] = useState(0)

  const [arousalRating, setArousalRatingState] = useState(1)
  const [highestArousalReached, setHighestArousalReached] = useState(1)
  const [arousalHistory, setArousalHistory] = useState<ArousalSample[]>([])
  const [stage1HighArousalFlag, setStage1HighArousalFlag] = useState(false)

  const [buildState, setBuildState] = useState<BuildState>('build')
  const [regulationRemainingSec, setRegulationRemainingSec] = useState(0)

  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [cycleTimestamps, setCycleTimestamps] = useState<number[]>([])
  const [completeStops, setCompleteStops] = useState(0)
  const [timeInZoneMs, setTimeInZoneMs] = useState(0)
  const [firstTimeToNineMs, setFirstTimeToNineMs] = useState<number | null>(null)

  const [accidentallyFinished, setAccidentallyFinished] = useState(false)
  const [endedEarly, setEndedEarly] = useState(false)

  const [lubeUsed, setLubeUsed] = useState(false)
  const [toyUsed, setToyUsed] = useState(phase >= 6)
  const [positionsUsed, setPositionsUsed] = useState<string[]>([])

  const allCommitmentsChecked = useMemo(
    () => commitments.privateSpace && commitments.noPorn && commitments.understandEarlyEndRule,
    [commitments]
  )

  const stageDurationSec = useMemo(
    () => getStageDurationSecondsForConfig(phase, stage, phase8Config),
    [phase, phase8Config, stage]
  )

  const stageElapsedSec = useMemo(() => {
    if (stageDurationSec <= 0) {
      return 0
    }
    return Math.max(0, stageDurationSec - stageRemainingSec)
  }, [stageDurationSec, stageRemainingSec])

  const markCueOnce = useCallback((key: string, message: string) => {
    if (cueFlagsRef.current[key]) {
      return
    }
    cueFlagsRef.current[key] = true
    setLatestCue(message)
  }, [])

  const enterStage = useCallback(
    (nextStage: ProgramStage) => {
      setStage(nextStage)
      cueFlagsRef.current = {}
      setLatestCue(null)

      if (nextStage === 'summary') {
        stageEndAtMsRef.current = null
        setCompletedAt((prev) => prev ?? new Date().toISOString())
        setIsStageRunning(false)
        setStageRemainingSec(0)
        return
      }

      const duration = getStageDurationSecondsForConfig(phase, nextStage, phase8Config)
      stageEndAtMsRef.current = duration > 0 ? Date.now() + duration * 1000 : null
      setStageRemainingSec(duration)
      setIsStageRunning(duration > 0)

      if (nextStage === 'stage2') {
        setLubeUsed(true)
        stage2StartedAtRef.current = Date.now()
        setFirstTimeToNineMs(null)
      }
    },
    [phase, phase8Config]
  )

  const advanceStage = useCallback(() => {
    if (stage === 'position_setup') {
      enterStage('pelvic_check')
      return
    }
    if (stage === 'pelvic_check') {
      enterStage('stage1')
      return
    }
    if (stage === 'stage1') {
      enterStage('stage2')
      return
    }
    if (stage === 'stage2') {
      enterStage('cooldown')
      return
    }
    if (stage === 'cooldown') {
      enterStage('summary')
    }
  }, [enterStage, stage])

  const startProgram = useCallback(() => {
    if (!allCommitmentsChecked) {
      return
    }

    const nowIso = new Date().toISOString()
    setStartedAt(nowIso)
    setCompletedAt(null)
    setEndedEarly(false)
    setAccidentallyFinished(false)
    setCyclesCompleted(0)
    setCompleteStops(0)
    setTimeInZoneMs(0)
    setHighestArousalReached(1)
    setArousalRatingState(1)
    setArousalHistory([])
    setStage1HighArousalFlag(false)
    setBuildState('build')
    setRegulationRemainingSec(0)
    setPositionsUsed([])
    setToyUsed(phase >= 6)
    setLubeUsed(false)
    setCycleTimestamps([])
    setFirstTimeToNineMs(null)
    stage2StartedAtRef.current = null
    enterStage('position_setup')
  }, [allCommitmentsChecked, enterStage, phase])

  const toggleCommitment = useCallback((key: keyof CommitmentState) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const startRkPractice = useCallback(() => {
    setRkPracticeRemainingSec(10)
  }, [])

  const setArousalRating = useCallback(
    (value: number) => {
      const next = clampArousal(value)
      setArousalRatingState(next)
      setHighestArousalReached((prev) => Math.max(prev, next))

      const sessionStartMs = startedAt ? new Date(startedAt).getTime() : Date.now()
      setArousalHistory((prev) => [
        ...prev,
        {
          atMs: Math.max(0, Date.now() - sessionStartMs),
          rating: next,
          stage,
        },
      ])

      if (stage === 'stage1' && next >= 7) {
        setStage1HighArousalFlag(true)
        setLatestCue(
          'You are climbing too fast. Remove your hand completely and breathe. Target 4-5 for this stage.'
        )
      }

      if (stage === 'stage2') {
        if (next >= 9 && firstTimeToNineMs === null && stage2StartedAtRef.current !== null) {
          setFirstTimeToNineMs(Date.now() - stage2StartedAtRef.current)
        }
        if (phase <= 3 && next >= 7) {
          setLatestCue(
            "You're at 7+. Trigger STOP now: remove your hand and breathe 4 in, 6 out until arousal returns to 4-5."
          )
        }
        if (phase >= 4 && next === 9) {
          setLatestCue('Back off immediately. Lighten grip, slow to 20%, and use a long exhale.')
        }
        if (phase >= 4 && next >= 7 && next <= 8) {
          setLatestCue("You're in The Zone. Stay here and modulate speed, grip, and breath.")
        }
      }
    },
    [firstTimeToNineMs, phase, stage, startedAt]
  )

  const triggerBuildStop = useCallback(() => {
    if (stage !== 'stage2' || phase > 3) {
      return
    }
    setBuildState('stop')
    setRegulationRemainingSec(60)
    setLatestCue('STOP state: remove your hand completely and breathe. Wait for arousal to drop to 4-5.')
  }, [phase, stage])

  const triggerCompleteStop = useCallback(() => {
    if (stage !== 'stage2' || phase < 4) {
      return
    }

    const minimumRest = phase >= 5 ? 30 : 45
    const mode: BuildState = phase >= 5 ? 'freeze' : 'stop'
    setBuildState(mode)
    setRegulationRemainingSec(minimumRest)
    setCompleteStops((prev) => prev + 1)

    if (phase >= 5) {
      setLatestCue(
        'FREEZE: keep hand in place with no movement. Breathe 4 in, 6 out, relax jaw, and resume only after timer.'
      )
    } else {
      setLatestCue(
        'Complete stop: remove stimulation, breathe with long exhales, and resume at minimal intensity after timer.'
      )
    }
  }, [phase, stage])

  const resumeFromRegulation = useCallback(() => {
    if (regulationRemainingSec > 0 || stage !== 'stage2') {
      return
    }

    if (phase <= 3) {
      setCyclesCompleted((prev) => prev + 1)
      setCycleTimestamps((prev) => [...prev, Date.now()])
      setLatestCue('Resume BUILD when your arousal is back to 4-5.')
    } else {
      setLatestCue('Resume at minimal stimulation and modulate back into control.')
    }

    setBuildState('build')
  }, [phase, regulationRemainingSec, stage])

  const markAccidentalFinish = useCallback(() => {
    if (!startedAt) {
      setStartedAt(new Date().toISOString())
    }
    stageEndAtMsRef.current = null
    setAccidentallyFinished(true)
    setEndedEarly(true)
    setCompletedAt(new Date().toISOString())
    setIsStageRunning(false)
    setStage('summary')
  }, [startedAt])

  const markEndedEarly = useCallback(() => {
    if (!startedAt) {
      setStartedAt(new Date().toISOString())
    }
    stageEndAtMsRef.current = null
    setEndedEarly(true)
    setCompletedAt(new Date().toISOString())
    setIsStageRunning(false)
    setStage('summary')
  }, [startedAt])

  const togglePositionUsed = useCallback((position: string) => {
    setPositionsUsed((prev) => {
      if (prev.includes(position)) {
        return prev.filter((value) => value !== position)
      }
      return [...prev, position]
    })
  }, [])

  // Stage countdown timer
  // Uses absolute end timestamps to avoid drift when browsers throttle intervals
  // in background tabs or when device screens turn off.
  useEffect(() => {
    if (!isStageRunning) {
      return
    }

    if (stageDurationSec <= 0) {
      return
    }

    const tick = () => {
      const endAtMs = stageEndAtMsRef.current
      if (!endAtMs) {
        return
      }

      const remainingMs = Math.max(0, endAtMs - Date.now())
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
      setStageRemainingSec((prev) => (prev === remainingSec ? prev : remainingSec))
    }

    tick()
    const intervalId = window.setInterval(() => {
      tick()
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isStageRunning, stage, stageDurationSec])

  // Automatic stage advance when timer reaches zero
  useEffect(() => {
    if (!isStageRunning || stageDurationSec <= 0) {
      return
    }
    if (stageRemainingSec > 0) {
      return
    }
    advanceStage()
  }, [advanceStage, isStageRunning, stageDurationSec, stageRemainingSec])

  // RK guided practice timer
  useEffect(() => {
    if (rkPracticeRemainingSec <= 0) {
      return
    }
    const intervalId = window.setInterval(() => {
      setRkPracticeRemainingSec((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [rkPracticeRemainingSec])

  // STOP/FREEZE regulation timer
  useEffect(() => {
    if (stage !== 'stage2' || buildState === 'build' || regulationRemainingSec <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setRegulationRemainingSec((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [buildState, regulationRemainingSec, stage])

  // For optional Phase 8 stages, auto-advance through zero-duration stages.
  useEffect(() => {
    if (stage === 'commitment' || stage === 'summary') {
      return
    }
    if (stageDurationSec !== 0) {
      return
    }
    advanceStage()
  }, [advanceStage, stage, stageDurationSec])

  // Time in The Zone tracking for phase 4+
  useEffect(() => {
    if (phase < 4 || stage !== 'stage2' || buildState !== 'build' || !isStageRunning) {
      return
    }
    if (arousalRating < 7 || arousalRating > 8) {
      return
    }
    const intervalId = window.setInterval(() => {
      setTimeInZoneMs((prev) => prev + 1000)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [arousalRating, buildState, isStageRunning, phase, stage])

  // Timed cue scheduling for Stage 1
  useEffect(() => {
    if (stage !== 'stage1') {
      return
    }

    if (stageElapsedSec >= 120) {
      markCueOnce('stage1-2m', '2-minute check-in: where are you on the arousal scale?')
    }
    if (stageElapsedSec >= 240) {
      markCueOnce('stage1-4m', '4-minute check-in: stay in the 4-5 range.')
    }
    if (stageElapsedSec >= 270) {
      markCueOnce(
        'stage1-4m30',
        '30 seconds left in warm-up. Stay light and keep your pelvic floor open.'
      )
    }

    const rkBucket = Math.floor(stageElapsedSec / 90)
    if (rkBucket >= 1 && stageElapsedSec < stageDurationSec) {
      markCueOnce(
        `stage1-rk-${rkBucket}`,
        'Reverse kegel reminder: check your pelvic floor and push out gently.'
      )
    }
  }, [markCueOnce, stage, stageDurationSec, stageElapsedSec])

  // Timed cue scheduling for Stage 2
  useEffect(() => {
    if (stage !== 'stage2') {
      return
    }

    if (phase === 1) {
      if (stageElapsedSec >= 180) {
        markCueOnce('p1-3m', 'Grip check: loosen slightly.')
      }
      if (stageElapsedSec >= 360) {
        markCueOnce('p1-6m', 'Slow down by about 30%.')
      }
      if (stageElapsedSec >= 600) {
        markCueOnce(
          'p1-10m',
          'Halfway. The first 5-8 minutes are often the hardest while the reflex is strongest.'
        )
      }
      if (stageElapsedSec >= 900) {
        markCueOnce(
          'p1-15m',
          'Conditioning window: your system is learning that arousal does not require immediate resolution.'
        )
      }
    }

    if (phase === 2 && stageElapsedSec >= 480) {
      markCueOnce(
        'p2-8m',
        'Jaw check: unclench your jaw, let your mouth open slightly, and notice pelvic floor release.'
      )
    }

    if (phase === 3) {
      if (stageElapsedSec >= 300) {
        markCueOnce(
          'p3-5m',
          'Return to your intention: let imagery generate arousal, not just mechanical stimulation.'
        )
      }
      if (stageElapsedSec >= 600) {
        markCueOnce('p3-10m', 'Stay present with the person/scenario from your intention.')
      }
      if (stageElapsedSec >= 900) {
        markCueOnce('p3-15m', 'Presence amplifies sensation. Keep imagery active and specific.')
      }
    }

    if (phase === 7) {
      if (stageElapsedSec >= 600) {
        markCueOnce(
          'p7-10m',
          'Sprint 1: 10 seconds around 70% pace, then freeze and breathe back down.'
        )
      }
      if (stageElapsedSec >= 840) {
        markCueOnce(
          'p7-14m',
          'Sprint 2: repeat the 10-second burst, then recover with slow thrusting.'
        )
      }
    }

    if (phase === 5) {
      if (stageElapsedSec >= 300) {
        markCueOnce(
          'p5-5m',
          'Grip progression: move from very light to medium pressure now.'
        )
      }
      if (stageElapsedSec >= 600) {
        markCueOnce(
          'p5-10m',
          'Use a slightly firmer 30-second interval, then return to medium.'
        )
      }
      if (stageElapsedSec >= 720) {
        markCueOnce(
          'p5-12m',
          'Speed burst window: one 10-second burst at normal pace, then regulate down before 9.'
        )
      }
    }
  }, [markCueOnce, phase, stage, stageElapsedSec])

  const cycleIntervalsMs = useMemo(() => {
    if (cycleTimestamps.length < 2) {
      return []
    }
    return cycleTimestamps
      .slice(1)
      .map((timestamp, index) => timestamp - cycleTimestamps[index])
      .filter((value) => value >= 0)
  }, [cycleTimestamps])

  const averageCycleIntervalMs = useMemo(() => {
    if (cycleIntervalsMs.length === 0) {
      return null
    }
    const total = cycleIntervalsMs.reduce((sum, value) => sum + value, 0)
    return Math.round(total / cycleIntervalsMs.length)
  }, [cycleIntervalsMs])

  const sessionDurationMs = useMemo(() => {
    if (!startedAt) {
      return 0
    }
    const start = new Date(startedAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() : Date.now()
    return Math.max(0, end - start)
  }, [completedAt, startedAt])

  return {
    sessionClientId: sessionClientIdRef.current,
    phase,
    stage,
    stageDurationSec,
    stageRemainingSec,
    stageElapsedSec,
    isStageRunning,
    latestCue,

    commitments,
    allCommitmentsChecked,
    toggleCommitment,
    startProgram,
    phase8Config,
    setPhase8Config,

    rkPracticeRemainingSec,
    startRkPractice,

    arousalRating,
    highestArousalReached,
    arousalHistory,
    setArousalRating,
    stage1HighArousalFlag,

    buildState,
    regulationRemainingSec,
    triggerBuildStop,
    triggerCompleteStop,
    resumeFromRegulation,

    cyclesCompleted,
    cycleIntervalsMs,
    averageCycleIntervalMs,
    completeStops,
    timeInZoneMs,
    firstTimeToNineMs,

    accidentallyFinished,
    endedEarly,
    markAccidentalFinish,
    markEndedEarly,

    lubeUsed,
    setLubeUsed,
    toyUsed,
    setToyUsed,

    positionsUsed,
    togglePositionUsed,

    startedAt,
    completedAt,
    sessionDurationMs,

    advanceStage,
    setLatestCue,
  }
}
