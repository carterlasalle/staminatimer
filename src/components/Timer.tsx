'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTimer } from '@/hooks/useTimer'
import { TimingGuide } from '@/components/TimingGuide'
import { formatDuration } from '@/lib/utils'
import { Play, Square, Zap, CheckCircle, RotateCcw, Keyboard, Settings, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIMER_CONSTANTS } from '@/lib/constants'

export function Timer() {
  const {
    state,
    activeTime,
    edgeTime,
    edgeLaps,
    startSession,
    startEdge,
    endEdge,
    finishSession,
    resetTimer
  } = useTimer()

  const [showKeyboardHints, setShowKeyboardHints] = useState(false)
  const [showTimingGuide, setShowTimingGuide] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  // Handler for finish button - shows confirmation for longer sessions
  const handleFinishClick = useCallback(() => {
    const totalTime = activeTime + edgeTime
    if (totalTime >= TIMER_CONSTANTS.CONFIRMATION_THRESHOLD_MS) {
      setShowFinishConfirm(true)
    } else {
      // Short session - finish immediately without confirmation
      finishSession()
    }
  }, [activeTime, edgeTime, finishSession])

  // Confirm finish and close dialog
  const confirmFinish = useCallback(() => {
    setShowFinishConfirm(false)
    finishSession()
  }, [finishSession])

  // Pulse animation for state changes
  useEffect(() => {
    setPulseAnimation(true)
    const timeout = setTimeout(() => setPulseAnimation(false), 600)
    return () => clearTimeout(timeout)
  }, [state])

  // Keyboard shortcuts for flow control
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't trigger shortcuts when user is interacting with form elements or dialogs
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          e.target.closest('[role="dialog"]') ||
          e.target.closest('[role="alertdialog"]') ||
          e.target.getAttribute('role') === 'textbox')
      ) {
        return
      }
      const key = e.key.toLowerCase()
      if (key === 's' && state === 'idle') startSession()
      if (key === 'e' && state === 'active') startEdge()
      if (key === 'x' && state === 'edging') endEdge()
      if (key === 'f' && (state === 'active' || state === 'edging')) handleFinishClick()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, startSession, startEdge, endEdge, handleFinishClick])

  const getStateConfig = () => {
    switch (state) {
      case 'idle':
        return {
          title: 'Ready to Begin',
          subtitle: 'Start your stamina training session',
          icon: <Play className="h-6 w-6" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        }
      case 'active':
        return {
          title: 'Session Active',
          subtitle: 'Focus on control, edge when ready',
          icon: <Zap className="h-6 w-6" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        }
      case 'edging':
        return {
          title: 'Edge Zone',
          subtitle: 'Hold the line, master your control',
          icon: <Square className="h-6 w-6" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20'
        }
      case 'finished':
        return {
          title: 'Session Complete!',
          subtitle: 'Excellent work, review your performance',
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20'
        }
    }
  }

  const stateConfig = getStateConfig()
  const totalTime = activeTime + edgeTime
  const edgePercentage = totalTime > 0 ? (edgeTime / totalTime) * 100 : 0

  return (
    <div className="space-y-6">
      <Card className={cn(
        "w-full transition-all duration-300 hover:shadow-lg",
        stateConfig.borderColor,
        pulseAnimation && "animate-pulse"
      )}>
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 md:gap-3">
              <div className={cn(
                "p-1.5 md:p-2 rounded-full transition-all duration-300 shrink-0",
                stateConfig.bgColor
              )}>
                <div className={stateConfig.color}>
                  {stateConfig.icon}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-base md:text-xl font-bold truncate">{stateConfig.title}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-normal line-clamp-1">
                  {stateConfig.subtitle}
                </div>
              </div>
            </CardTitle>

            <div className="flex gap-1 md:gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTimingGuide(!showTimingGuide)}
                className={cn(
                  "h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground",
                  showTimingGuide && "text-primary bg-primary/10"
                )}
                title="Timing guides"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeyboardHints(!showKeyboardHints)}
                className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground hidden sm:flex"
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 md:space-y-6">
          {/* Enhanced Time Display */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="text-center p-3 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg md:rounded-xl border border-primary/10">
              <p className="text-[10px] md:text-sm font-medium text-muted-foreground mb-0.5 md:mb-1">Total</p>
              <p className="text-lg md:text-3xl font-bold text-primary">
                {formatDuration(totalTime)}
              </p>
            </div>

            <div className="text-center p-3 md:p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg md:rounded-xl border border-green-500/10">
              <p className="text-[10px] md:text-sm font-medium text-muted-foreground mb-0.5 md:mb-1">Active</p>
              <p className="text-lg md:text-3xl font-bold text-green-600">
                {formatDuration(activeTime)}
              </p>
            </div>

            <div className="text-center p-3 md:p-6 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-lg md:rounded-xl border border-orange-500/10">
              <p className="text-[10px] md:text-sm font-medium text-muted-foreground mb-0.5 md:mb-1">Edge</p>
              <p className="text-lg md:text-3xl font-bold text-orange-600">
                {formatDuration(edgeTime)}
              </p>
            </div>
          </div>

          {/* Progress Visualization */}
          {totalTime > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Edge Time Ratio</span>
                <span>{edgePercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={edgePercentage} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Active: {((100 - edgePercentage)).toFixed(1)}%</span>
                <span>Edge: {edgePercentage.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Edge Laps */}
          {edgeLaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Square className="h-5 w-5 text-orange-500" />
                Edge Laps ({edgeLaps.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {edgeLaps.map((lap, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-500/5 to-orange-500/10 rounded-lg border border-orange-500/10 hover:border-orange-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="font-medium">Edge {index + 1}</span>
                    </div>
                    <span className="font-mono text-sm">
                      {lap.duration ? formatDuration(lap.duration) : (
                        <span className="text-orange-500 animate-pulse">In Progress...</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          {showKeyboardHints && (
            <div className="p-4 bg-muted/50 rounded-lg border border-muted">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="px-2 py-1 bg-background rounded text-xs">S</kbd> Start Session</div>
                <div><kbd className="px-2 py-1 bg-background rounded text-xs">E</kbd> Begin Edge</div>
                <div><kbd className="px-2 py-1 bg-background rounded text-xs">X</kbd> End Edge</div>
                <div><kbd className="px-2 py-1 bg-background rounded text-xs">F</kbd> Finish Session</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center pt-4">
            {state === 'idle' && (
              <Button
                onClick={startSession}
                size="lg"
                className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base font-semibold hover:scale-105 transition-transform"
              >
                <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Start Session
              </Button>
            )}

            {state === 'active' && (
              <Button
                onClick={startEdge}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base font-semibold border-orange-500 text-orange-600 hover:bg-orange-500/10 hover:scale-105 transition-all"
                title="Shortcut: E"
              >
                <Square className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Begin Edge
              </Button>
            )}

            {state === 'edging' && (
              <Button
                onClick={endEdge}
                size="lg"
                className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base font-semibold bg-orange-500 hover:bg-orange-600 hover:scale-105 transition-all"
                title="Shortcut: X"
              >
                <Square className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                End Edge
              </Button>
            )}

            {(state === 'active' || state === 'edging') && (
              <Button
                onClick={handleFinishClick}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base font-semibold hover:scale-105 transition-transform"
                title="Shortcut: F"
              >
                <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Finish
              </Button>
            )}

            {state === 'finished' && (
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base font-semibold hover:scale-105 transition-transform"
              >
                <RotateCcw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                New Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timing Guide Panel */}
      {showTimingGuide && (
        <TimingGuide />
      )}

      {/* Finish Session Confirmation Dialog */}
      <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <DialogContent className="sm:max-w-md" role="alertdialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Finish Session?
            </DialogTitle>
            <DialogDescription>
              You have been training for <span className="font-semibold text-foreground">{formatDuration(totalTime)}</span>.
              Are you sure you want to end your session now? Your progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-2 bg-muted rounded-lg">
                <div className="font-medium">{formatDuration(totalTime)}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="font-medium text-green-600">{formatDuration(activeTime)}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="font-medium text-orange-600">{formatDuration(edgeTime)}</div>
                <div className="text-xs text-muted-foreground">Edge</div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFinishConfirm(false)}
              className="w-full sm:w-auto"
            >
              Continue Training
            </Button>
            <Button
              variant="destructive"
              onClick={confirmFinish}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finish Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
