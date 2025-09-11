'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTimingGuide, type StrokeTimingLevel, type SessionInterval } from '@/hooks/useTimingGuide'
import { 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Pause,
  RotateCcw,
  Timer,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TimingGuide() {
  const {
    // Stroke timing
    isStrokeGuideEnabled,
    strokeConfig,
    strokePhase,
    toggleStrokeGuide,
    changeStrokeLevel,
    resetStrokeGuide,
    currentStrokeLevel,
    strokeLevels,
    
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
    sessionIntervals
  } = useTimingGuide()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  const getStrokeLevelInfo = (level: StrokeTimingLevel) => {
    switch (level) {
      case 'beginner':
        return { label: 'Beginner', description: '3 up, 3 down (~6s per stroke)', color: 'text-green-600' }
      case 'intermediate':
        return { label: 'Intermediate', description: '2 up, 2 down (~4s per stroke)', color: 'text-orange-600' }
      case 'advanced':
        return { label: 'Advanced', description: '1 up, 1 down (~2s per stroke)', color: 'text-red-600' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Stroke Timing Guide */}
      <Card className={cn(
        "transition-all duration-300",
        isStrokeGuideEnabled && "ring-2 ring-primary/20 bg-primary/5"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Stroke Timing Guide
            </CardTitle>
            <Switch
              checked={isStrokeGuideEnabled}
              onCheckedChange={toggleStrokeGuide}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Timing Level</label>
            <Select
              value={currentStrokeLevel}
              onValueChange={(value) => changeStrokeLevel(value as StrokeTimingLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strokeLevels.map((level) => {
                  const info = getStrokeLevelInfo(level)
                  return (
                    <SelectItem key={level} value={level}>
                      <div className="flex flex-col">
                        <span className={info.color}>{info.label}</span>
                        <span className="text-xs text-muted-foreground">{info.description}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Configuration Display */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{strokeConfig.upCount}</div>
              <div className="text-xs text-muted-foreground">Up Count</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{strokeConfig.downCount}</div>
              <div className="text-xs text-muted-foreground">Down Count</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{strokeConfig.totalDuration}s</div>
              <div className="text-xs text-muted-foreground">Full Stroke</div>
            </div>
          </div>

          {/* Active Timing Display */}
          {isStrokeGuideEnabled && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {strokePhase.phase === 'up' ? (
                    <ArrowUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <ArrowDown className="h-8 w-8 text-blue-500" />
                  )}
                  <div className="text-3xl font-bold text-primary">
                    {strokePhase.instruction}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3">
                  Next: {strokePhase.nextInstruction}
                </div>
                
                <Progress 
                  value={strokePhase.progress} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetStrokeGuide}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guided Session Intervals */}
      <Card className={cn(
        "transition-all duration-300",
        isGuidedSessionEnabled && "ring-2 ring-orange-500/20 bg-orange-500/5"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Guided Session Intervals
            </CardTitle>
            <Switch
              checked={isGuidedSessionEnabled}
              onCheckedChange={toggleGuidedSession}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Interval Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Pattern</label>
            <Select
              value={currentSessionInterval}
              onValueChange={(value) => changeSessionInterval(value as SessionInterval)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionIntervals.map((interval) => {
                  const config = { '20s/40s': { on: 20, off: 40 }, '30s/60s': { on: 30, off: 60 }, '45s/90s': { on: 45, off: 90 }, '60s/120s': { on: 60, off: 120 } }[interval]
                  return (
                    <SelectItem key={interval} value={interval}>
                      <div className="flex flex-col">
                        <span>{interval}</span>
                        <span className="text-xs text-muted-foreground">
                          {config.on}s active, {config.off}s rest
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Pattern Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">{sessionConfig.onDuration}s</div>
              <div className="text-xs text-muted-foreground">Active Time</div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{sessionConfig.offDuration}s</div>
              <div className="text-xs text-muted-foreground">Rest Time</div>
            </div>
          </div>

          {/* Active Session Display */}
          {isGuidedSessionEnabled && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-orange-500/5 to-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {sessionPhase === 'on' ? (
                    <Play className="h-8 w-8 text-green-500" />
                  ) : (
                    <Pause className="h-8 w-8 text-blue-500" />
                  )}
                  <div className="text-3xl font-bold text-orange-600">
                    {sessionPhase === 'on' ? 'ACTIVE' : 'REST'}
                  </div>
                </div>
                
                <div className="text-2xl font-mono mb-2">
                  {formatTime(sessionTimeRemaining)}
                </div>
                
                <Badge variant="secondary" className="mb-3">
                  Cycle {sessionCycleCount + 1}
                </Badge>
                
                <Progress 
                  value={sessionPhase === 'on' 
                    ? ((sessionConfig.onDuration - sessionTimeRemaining) / sessionConfig.onDuration) * 100
                    : ((sessionConfig.offDuration - sessionTimeRemaining) / sessionConfig.offDuration) * 100
                  } 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetGuidedSession}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            How to Use Timing Guides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-1">Stroke Timing Guide:</h4>
            <p className="text-muted-foreground">
              Follow the up/down count to maintain consistent rhythm. Start with beginner (3 up, 3 down) 
              and progress to advanced (1 up, 1 down) as your control improves.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Guided Sessions:</h4>
            <p className="text-muted-foreground">
              Alternate between active stimulation and rest periods. Use 30s/60s for building endurance, 
              or 20s/40s for control training.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}