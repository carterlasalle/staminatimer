'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type StrokeTimingLevel = 'beginner' | 'intermediate' | 'advanced'
export type SessionInterval = '20s/40s' | '30s/60s' | '45s/90s' | '60s/120s'

export type StrokeTimingConfig = {
  level: StrokeTimingLevel
  upCount: number
  downCount: number
  totalDuration: number // in seconds
  bpm: number // beats per minute
}

export type GuidedSessionConfig = {
  interval: SessionInterval
  onDuration: number // in seconds
  offDuration: number // in seconds
}

const strokeTimingConfigs: Record<StrokeTimingLevel, StrokeTimingConfig> = {
  beginner: {
    level: 'beginner',
    upCount: 3,
    downCount: 3,
    totalDuration: 6,
    bpm: 10 // 10 strokes per minute
  },
  intermediate: {
    level: 'intermediate',
    upCount: 2,
    downCount: 2,
    totalDuration: 4,
    bpm: 15 // 15 strokes per minute
  },
  advanced: {
    level: 'advanced',
    upCount: 1,
    downCount: 1,
    totalDuration: 2,
    bpm: 30 // 30 strokes per minute
  }
}

const guidedSessionConfigs: Record<SessionInterval, GuidedSessionConfig> = {
  '20s/40s': { interval: '20s/40s', onDuration: 20, offDuration: 40 },
  '30s/60s': { interval: '30s/60s', onDuration: 30, offDuration: 60 },
  '45s/90s': { interval: '45s/90s', onDuration: 45, offDuration: 90 },
  '60s/120s': { interval: '60s/120s', onDuration: 60, offDuration: 120 }
}

export function useTimingGuide() {
  const [isStrokeGuideEnabled, setIsStrokeGuideEnabled] = useState(false)
  const [isGuidedSessionEnabled, setIsGuidedSessionEnabled] = useState(false)
  const [currentStrokeLevel, setCurrentStrokeLevel] = useState<StrokeTimingLevel>('beginner')
  const [currentSessionInterval, setCurrentSessionInterval] = useState<SessionInterval>('30s/60s')
  
  // Stroke timing state
  const [strokePhase, setStrokePhase] = useState<'up' | 'down'>('up')
  const [strokeCount, setStrokeCount] = useState(1)
  
  // Guided session state
  const [sessionPhase, setSessionPhase] = useState<'on' | 'off'>('on')
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)
  const [sessionCycleCount, setSessionCycleCount] = useState(0)
  
  const strokeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const strokeConfig = strokeTimingConfigs[currentStrokeLevel]
  const sessionConfig = guidedSessionConfigs[currentSessionInterval]

  // Calculate timing for stroke phases
  const getStrokePhaseInfo = useCallback(() => {
    const isUpPhase = strokePhase === 'up'
    const currentCount = strokeCount
    const maxCount = isUpPhase ? strokeConfig.upCount : strokeConfig.downCount
    const secondsPerCount = strokeConfig.totalDuration / (strokeConfig.upCount + strokeConfig.downCount)
    
    return {
      phase: strokePhase,
      count: currentCount,
      maxCount,
      progress: (currentCount / maxCount) * 100,
      instruction: `${strokePhase.toUpperCase()} ${currentCount}`,
      nextInstruction: currentCount < maxCount 
        ? `${strokePhase.toUpperCase()} ${currentCount + 1}`
        : `${strokePhase === 'up' ? 'DOWN' : 'UP'} 1`,
      secondsPerCount
    }
  }, [strokePhase, strokeCount, strokeConfig])

  // Stroke timing main loop
  useEffect(() => {
    if (!isStrokeGuideEnabled) {
      if (strokeIntervalRef.current) {
        clearInterval(strokeIntervalRef.current)
        strokeIntervalRef.current = null
      }
      return
    }

    const secondsPerCount = strokeConfig.totalDuration / (strokeConfig.upCount + strokeConfig.downCount)
    const intervalMs = secondsPerCount * 1000

    strokeIntervalRef.current = setInterval(() => {
      setStrokeCount(prev => {
        const isUpPhase = strokePhase === 'up'
        const maxCount = isUpPhase ? strokeConfig.upCount : strokeConfig.downCount
        
        if (prev < maxCount) {
          return prev + 1
        } else {
          // Switch phases
          setStrokePhase(current => current === 'up' ? 'down' : 'up')
          return 1
        }
      })
    }, intervalMs)

    return () => {
      if (strokeIntervalRef.current) {
        clearInterval(strokeIntervalRef.current)
        strokeIntervalRef.current = null
      }
    }
  }, [isStrokeGuideEnabled, strokePhase, strokeConfig])

  // Guided session main loop
  useEffect(() => {
    if (!isGuidedSessionEnabled) {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
      setSessionTimeRemaining(0)
      return
    }

    // Initialize with first phase
    const initialDuration = sessionPhase === 'on' ? sessionConfig.onDuration : sessionConfig.offDuration
    setSessionTimeRemaining(initialDuration)

    sessionIntervalRef.current = setInterval(() => {
      setSessionTimeRemaining(prev => {
        if (prev <= 1) {
          // Switch phases
          setSessionPhase(current => {
            const newPhase = current === 'on' ? 'off' : 'on'
            
            if (newPhase === 'on') {
              setSessionCycleCount(count => count + 1)
            }
            
            return newPhase
          })
          
          return sessionPhase === 'on' ? sessionConfig.offDuration : sessionConfig.onDuration
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
    }
  }, [isGuidedSessionEnabled, sessionPhase, sessionConfig])

  // Reset functions
  const resetStrokeGuide = useCallback(() => {
    setStrokePhase('up')
    setStrokeCount(1)
  }, [])

  const resetGuidedSession = useCallback(() => {
    setSessionPhase('on')
    setSessionTimeRemaining(sessionConfig.onDuration)
    setSessionCycleCount(0)
  }, [sessionConfig.onDuration])

  // Control functions
  const toggleStrokeGuide = useCallback(() => {
    setIsStrokeGuideEnabled(prev => {
      if (prev) {
        resetStrokeGuide()
      }
      return !prev
    })
  }, [resetStrokeGuide])

  const toggleGuidedSession = useCallback(() => {
    setIsGuidedSessionEnabled(prev => {
      if (prev) {
        resetGuidedSession()
      }
      return !prev
    })
  }, [resetGuidedSession])

  const changeStrokeLevel = useCallback((level: StrokeTimingLevel) => {
    setCurrentStrokeLevel(level)
    resetStrokeGuide()
  }, [resetStrokeGuide])

  const changeSessionInterval = useCallback((interval: SessionInterval) => {
    setCurrentSessionInterval(interval)
    resetGuidedSession()
  }, [resetGuidedSession])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (strokeIntervalRef.current) clearInterval(strokeIntervalRef.current)
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current)
    }
  }, [])

  return {
    // Stroke timing
    isStrokeGuideEnabled,
    strokeConfig,
    strokePhase: getStrokePhaseInfo(),
    toggleStrokeGuide,
    changeStrokeLevel,
    resetStrokeGuide,
    currentStrokeLevel,
    
    // Guided sessions
    isGuidedSessionEnabled,
    sessionConfig,
    sessionPhase,
    sessionTimeRemaining,
    sessionCycleCount,
    toggleGuidedSession,
    changeSessionInterval,
    resetGuidedSession,
    currentSessionInterval,
    
    // Available options
    strokeLevels: Object.keys(strokeTimingConfigs) as StrokeTimingLevel[],
    sessionIntervals: Object.keys(guidedSessionConfigs) as SessionInterval[]
  }
}