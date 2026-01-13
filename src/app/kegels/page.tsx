'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useGlobal } from '@/contexts/GlobalContext'
import { 
  Calendar, 
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Dumbbell
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

type Exercise = {
  id: string
  name: string
  description: string
  hold_time: number // seconds
  rest_time: number // seconds  
  reps: number
  sets: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  focus: string[]
}

const kegelExercises: Exercise[] = [
  {
    id: 'basic_hold',
    name: 'Basic Hold',
    description: 'Fundamental pelvic floor contraction',
    hold_time: 3,
    rest_time: 3,
    reps: 10,
    sets: 3,
    difficulty: 'beginner',
    focus: ['strength', 'awareness']
  },
  {
    id: 'quick_pulse',
    name: 'Quick Pulses',
    description: 'Rapid contractions for responsiveness',
    hold_time: 1,
    rest_time: 1,
    reps: 20,
    sets: 2,
    difficulty: 'beginner',
    focus: ['responsiveness', 'coordination']
  },
  {
    id: 'endurance_hold',
    name: 'Endurance Hold',
    description: 'Extended contractions for stamina',
    hold_time: 10,
    rest_time: 10,
    reps: 5,
    sets: 3,
    difficulty: 'intermediate',
    focus: ['endurance', 'control']
  },
  {
    id: 'elevator_exercise',
    name: 'Elevator Exercise',
    description: 'Progressive intensity contractions',
    hold_time: 15,
    rest_time: 5,
    reps: 5,
    sets: 2,
    difficulty: 'advanced',
    focus: ['control', 'precision']
  }
]

type WorkoutSession = {
  exercise: Exercise
  currentSet: number
  currentRep: number
  isActive: boolean
  isResting: boolean
  timeRemaining: number
  totalSets: number
  totalReps: number
}

export default function KegelsPage() {
  const { recentSessions } = useGlobal()
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Calculate weekly progress from actual sessions
  const weeklyProgress = useMemo(() => {
    const today = new Date()
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)
    
    // Get sessions from the last 7 days
    const weekSessions = recentSessions.filter(s => {
      const sessionDate = new Date(s.created_at)
      return sessionDate >= oneWeekAgo && sessionDate <= today
    })
    
    // Group by day of week (0 = Sunday, 1 = Monday, etc.)
    const sessionsByDay = new Map<number, boolean>()
    weekSessions.forEach(session => {
      const dayOfWeek = new Date(session.created_at).getDay()
      sessionsByDay.set(dayOfWeek, true)
    })
    
    // Map to week starting Monday (1,2,3,4,5,6,0)
    const weekOrder = [1, 2, 3, 4, 5, 6, 0] // Mon-Sun
    const completedDays = weekOrder.filter(day => sessionsByDay.has(day))
    
    return {
      completedDays: completedDays.length,
      totalDays: 7,
      dayStatuses: weekOrder.map(day => sessionsByDay.has(day))
    }
  }, [recentSessions])

  // Timer logic
  useEffect(() => {
    if (!workoutSession || !isRunning) return

    const timer = setInterval(() => {
      setWorkoutSession(prev => {
        if (!prev) return null

        if (prev.timeRemaining > 1) {
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        }

        // Time's up - switch phase or move to next rep/set
        if (prev.isActive) {
          // Switch to rest
          return {
            ...prev,
            isActive: false,
            isResting: true,
            timeRemaining: prev.exercise.rest_time
          }
        } else {
          // Rest is over, move to next rep or set
          if (prev.currentRep < prev.exercise.reps) {
            return {
              ...prev,
              currentRep: prev.currentRep + 1,
              isActive: true,
              isResting: false,
              timeRemaining: prev.exercise.hold_time
            }
          } else if (prev.currentSet < prev.exercise.sets) {
            // Move to next set
            return {
              ...prev,
              currentSet: prev.currentSet + 1,
              currentRep: 1,
              isActive: true,
              isResting: false,
              timeRemaining: prev.exercise.hold_time
            }
          } else {
            // Workout complete
            setIsRunning(false)
            return null
          }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [workoutSession, isRunning])

  const startWorkout = (exercise: Exercise) => {
    setWorkoutSession({
      exercise,
      currentSet: 1,
      currentRep: 1,
      isActive: true,
      isResting: false,
      timeRemaining: exercise.hold_time,
      totalSets: exercise.sets,
      totalReps: exercise.reps
    })
    setIsRunning(true)
  }

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  const resetWorkout = () => {
    setWorkoutSession(null)
    setIsRunning(false)
  }

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20'
    }
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-medium">Kegel Exercises</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Strengthen your pelvic floor muscles for better control and endurance
          </p>
        </div>

        {/* Active Workout Session */}
        {workoutSession && (
          <Card className="border-primary">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-base md:text-lg">Active: {workoutSession.exercise.name}</span>
                <div className="flex gap-2">
                  <Button onClick={togglePause} variant="outline" size="sm">
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button onClick={resetWorkout} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-4">
              <div className="grid grid-cols-3 gap-2 md:gap-6">
                <div className="text-center">
                  <div className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
                    {formatTime(workoutSession.timeRemaining)}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {workoutSession.isActive ? 'Hold' : 'Rest'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
                    Rep {workoutSession.currentRep}/{workoutSession.exercise.reps}
                  </div>
                  <Progress
                    value={(workoutSession.currentRep / workoutSession.exercise.reps) * 100}
                    className="h-1.5 md:h-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
                    Set {workoutSession.currentSet}/{workoutSession.exercise.sets}
                  </div>
                  <Progress
                    value={(workoutSession.currentSet / workoutSession.exercise.sets) * 100}
                    className="h-1.5 md:h-2"
                  />
                </div>
              </div>

              <div className="mt-4 md:mt-6 text-center">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {workoutSession.isActive ?
                    'Contract your pelvic floor muscles and hold' :
                    'Relax and breathe normally'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Library */}
        <div>
          <h2 className="text-lg font-medium mb-6">Exercise Library</h2>
          
          {!workoutSession ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kegelExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hold: </span>
                        <span className="font-medium">{exercise.hold_time}s</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rest: </span>
                        <span className="font-medium">{exercise.rest_time}s</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reps: </span>
                        <span className="font-medium">{exercise.reps}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sets: </span>
                        <span className="font-medium">{exercise.sets}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Focus Areas</h5>
                      <div className="flex flex-wrap gap-1">
                        {exercise.focus.map((focus) => (
                          <Badge key={focus} variant="secondary" className="text-xs">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => startWorkout(exercise)}
                    >
                      Start Exercise
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Complete your current workout to start a new exercise
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-lg font-semibold">4</div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-lg font-semibold">{weeklyProgress.completedDays}</div>
                  <div className="text-xs text-muted-foreground">Days This Week</div>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-lg font-semibold">
                    {Math.round((weeklyProgress.completedDays / weeklyProgress.totalDays) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Weekly Goal</div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                      <div key={i} className="text-xs text-muted-foreground mb-1">{day}</div>
                    ))}
                    {weeklyProgress.dayStatuses.map((completed, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded ${
                          completed ? 'bg-green-500/20' : 'bg-secondary'
                        } flex items-center justify-center`}
                      >
                        {completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-sm">
                    <div className="font-semibold">
                      {weeklyProgress.completedDays}/{weeklyProgress.totalDays} days completed
                    </div>
                    <div className="text-muted-foreground">
                      {weeklyProgress.completedDays === 0 ? 'Start your weekly routine!' :
                       weeklyProgress.completedDays >= 5 ? 'Excellent consistency!' :
                       weeklyProgress.completedDays >= 3 ? 'Good progress, keep it up!' :
                       'Building a habit takes time'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppNavigation>
  )
}