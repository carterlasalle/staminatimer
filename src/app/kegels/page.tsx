'use client'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar,
  CheckCircle,
  Dumbbell
} from 'lucide-react'
import { useState, useEffect } from 'react'

type Exercise = {
  id: string
  name: string
  description: string
  hold_time: number
  rest_time: number
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

export default function KegelsPage(): JSX.Element {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)

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
            return prev
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

  const pauseWorkout = () => {
    setIsRunning(!isRunning)
  }

  const resetWorkout = () => {
    setWorkoutSession(null)
    setIsRunning(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const workoutProgress = workoutSession 
    ? ((workoutSession.currentSet - 1) * workoutSession.exercise.reps + workoutSession.currentRep) / 
      (workoutSession.exercise.sets * workoutSession.exercise.reps) * 100
    : 0

  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Kegel Exercises</h1>
          <p className="text-muted-foreground">
            Strengthen your pelvic floor muscles for better control and stamina.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Workout Interface */}
          <div className="xl:col-span-2 space-y-6">
            {workoutSession ? (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="h-6 w-6 text-primary" />
                      {workoutSession.exercise.name}
                    </CardTitle>
                    <Badge className={getDifficultyColor(workoutSession.exercise.difficulty)}>
                      {workoutSession.exercise.difficulty}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round(workoutProgress)}%</span>
                    </div>
                    <Progress value={workoutProgress} className="h-3" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Phase */}
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${
                      workoutSession.isActive ? 'text-green-500' : 'text-blue-500'
                    }`}>
                      {workoutSession.timeRemaining}
                    </div>
                    <div className="text-lg font-medium mb-1">
                      {workoutSession.isActive ? 'SQUEEZE & HOLD' : 'REST & RELAX'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Set {workoutSession.currentSet} of {workoutSession.totalSets} • 
                      Rep {workoutSession.currentRep} of {workoutSession.totalReps}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {workoutSession.isActive ? 'Contract Phase' : 'Relaxation Phase'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {workoutSession.isActive 
                        ? 'Gently contract your pelvic floor muscles as if stopping urine flow. Breathe normally and maintain the contraction.'
                        : 'Completely relax your pelvic floor muscles. Focus on releasing all tension and breathing deeply.'
                      }
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={pauseWorkout}
                      size="lg"
                      variant={isRunning ? "secondary" : "default"}
                    >
                      {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button onClick={resetWorkout} size="lg" variant="outline">
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-muted-foreground mb-6">
                    Select an exercise from the sidebar to begin your kegel workout.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Exercise Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Proper Technique Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h4 className="font-semibold mb-2">Identify the Muscles</h4>
                    <p className="text-sm text-muted-foreground">
                      Contract the muscles you would use to stop urination midstream or prevent passing gas.
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💨</span>
                    </div>
                    <h4 className="font-semibold mb-2">Breathe Normally</h4>
                    <p className="text-sm text-muted-foreground">
                      Don't hold your breath. Continue breathing naturally throughout the exercise.
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🧘</span>
                    </div>
                    <h4 className="font-semibold mb-2">Stay Relaxed</h4>
                    <p className="text-sm text-muted-foreground">
                      Keep your buttocks, thighs, and abdominal muscles relaxed during the exercise.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Selection Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kegelExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                      selectedExercise?.id === exercise.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{exercise.name}</h4>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exercise.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>Hold: {exercise.hold_time}s</div>
                      <div>Rest: {exercise.rest_time}s</div>
                      <div>Reps: {exercise.reps}</div>
                      <div>Sets: {exercise.sets}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {exercise.focus.map((focus) => (
                        <Badge key={focus} variant="secondary" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        startWorkout(exercise)
                      }}
                      className="w-full"
                      size="sm"
                      disabled={!!workoutSession}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                  </div>
                ))}
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
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded ${
                          i < 4 ? 'bg-green-500/20' : 'bg-secondary'
                        } flex items-center justify-center`}
                      >
                        {i < 4 && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-sm">
                    <div className="font-semibold">4/7 days completed</div>
                    <div className="text-muted-foreground">Keep up the great work!</div>
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