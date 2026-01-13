'use client'

export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Timer } from '@/components/Timer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Timer as TimerIcon,
  Dumbbell,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Wind,
  Heart,
  Eye,
  Focus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Kegel Exercises Data
type KegelExercise = {
  id: string
  name: string
  description: string
  hold_time: number
  rest_time: number
  reps: number
  sets: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const kegelExercises: KegelExercise[] = [
  {
    id: 'basic_hold',
    name: 'Basic Hold',
    description: 'Fundamental pelvic floor contraction',
    hold_time: 3,
    rest_time: 3,
    reps: 10,
    sets: 3,
    difficulty: 'beginner'
  },
  {
    id: 'quick_pulse',
    name: 'Quick Pulses',
    description: 'Rapid contractions for responsiveness',
    hold_time: 1,
    rest_time: 1,
    reps: 20,
    sets: 2,
    difficulty: 'beginner'
  },
  {
    id: 'endurance_hold',
    name: 'Endurance Hold',
    description: 'Extended contractions for stamina',
    hold_time: 10,
    rest_time: 10,
    reps: 5,
    sets: 3,
    difficulty: 'intermediate'
  },
  {
    id: 'elevator_exercise',
    name: 'Elevator Exercise',
    description: 'Progressive intensity contractions',
    hold_time: 15,
    rest_time: 5,
    reps: 5,
    sets: 2,
    difficulty: 'advanced'
  }
]

// Mental Exercises Data
type MentalExercise = {
  id: string
  name: string
  description: string
  duration: number
  category: 'breathing' | 'mindfulness' | 'visualization' | 'focus'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
}

const mentalExercises: MentalExercise[] = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Calming 4-4-4-4 breathing pattern',
    duration: 5,
    category: 'breathing',
    difficulty: 'beginner',
    instructions: [
      'Sit comfortably with your back straight',
      'Breathe in through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale through your mouth for 4 counts',
      'Hold empty for 4 counts',
      'Repeat this cycle'
    ]
  },
  {
    id: 'body_scan',
    name: 'Body Awareness Scan',
    description: 'Develop awareness of physical sensations',
    duration: 10,
    category: 'mindfulness',
    difficulty: 'beginner',
    instructions: [
      'Lie down or sit comfortably',
      'Close your eyes and breathe naturally',
      'Start at the top of your head',
      'Slowly scan down through your body',
      'Notice any tension or sensations',
      'Breathe into areas of tension'
    ]
  },
  {
    id: 'controlled_breathing',
    name: 'Extended Exhale',
    description: 'Longer exhales activate relaxation',
    duration: 8,
    category: 'breathing',
    difficulty: 'intermediate',
    instructions: [
      'Find a comfortable position',
      'Breathe in naturally for 4 counts',
      'Exhale slowly for 8 counts',
      'Pause briefly before the next inhale',
      'Focus on making the exhale smooth',
      'Continue for the full duration'
    ]
  },
  {
    id: 'control_visualization',
    name: 'Control Visualization',
    description: 'Mental rehearsal for improved control',
    duration: 12,
    category: 'visualization',
    difficulty: 'intermediate',
    instructions: [
      'Sit quietly and close your eyes',
      'Visualize yourself in a challenging moment',
      'See yourself remaining calm and in control',
      'Feel the sensations of mastery',
      'Practice pausing and breathing',
      'Reinforce your mental strength'
    ]
  }
]

// Kegel Workout State
type KegelWorkout = {
  exercise: KegelExercise
  currentSet: number
  currentRep: number
  isHolding: boolean
  timeRemaining: number
}

// Mental Session State
type MentalSession = {
  exercise: MentalExercise
  currentStep: number
  timeRemaining: number
}

export default function TrainingPage() {
  const [showGuidance, setShowGuidance] = useState(false)

  // Kegel state
  const [kegelWorkout, setKegelWorkout] = useState<KegelWorkout | null>(null)
  const [kegelRunning, setKegelRunning] = useState(false)

  // Mental state
  const [mentalSession, setMentalSession] = useState<MentalSession | null>(null)
  const [mentalRunning, setMentalRunning] = useState(false)

  // Kegel timer logic
  useEffect(() => {
    if (!kegelWorkout || !kegelRunning) return

    const timer = setInterval(() => {
      setKegelWorkout(prev => {
        if (!prev) return null

        if (prev.timeRemaining > 1) {
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        }

        // Switch phase
        if (prev.isHolding) {
          return {
            ...prev,
            isHolding: false,
            timeRemaining: prev.exercise.rest_time
          }
        } else {
          // Rest done, next rep or set
          if (prev.currentRep < prev.exercise.reps) {
            return {
              ...prev,
              currentRep: prev.currentRep + 1,
              isHolding: true,
              timeRemaining: prev.exercise.hold_time
            }
          } else if (prev.currentSet < prev.exercise.sets) {
            return {
              ...prev,
              currentSet: prev.currentSet + 1,
              currentRep: 1,
              isHolding: true,
              timeRemaining: prev.exercise.hold_time
            }
          } else {
            // Complete
            setKegelRunning(false)
            toast.success('Kegel workout complete!')
            return null
          }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [kegelWorkout, kegelRunning])

  // Mental timer logic
  useEffect(() => {
    if (!mentalSession || !mentalRunning) return

    const timer = setInterval(() => {
      setMentalSession(prev => {
        if (!prev) return null

        if (prev.timeRemaining > 1) {
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        }

        // Next step
        if (prev.currentStep < prev.exercise.instructions.length - 1) {
          const timePerStep = Math.floor((prev.exercise.duration * 60) / prev.exercise.instructions.length)
          return {
            ...prev,
            currentStep: prev.currentStep + 1,
            timeRemaining: timePerStep
          }
        } else {
          setMentalRunning(false)
          toast.success('Mental exercise complete!')
          return null
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mentalSession, mentalRunning])

  const startKegel = (exercise: KegelExercise) => {
    setKegelWorkout({
      exercise,
      currentSet: 1,
      currentRep: 1,
      isHolding: true,
      timeRemaining: exercise.hold_time
    })
    setKegelRunning(true)
  }

  const startMental = (exercise: MentalExercise) => {
    const timePerStep = Math.floor((exercise.duration * 60) / exercise.instructions.length)
    setMentalSession({
      exercise,
      currentStep: 0,
      timeRemaining: timePerStep
    })
    setMentalRunning(true)
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600'
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600'
      case 'advanced': return 'bg-red-500/10 text-red-600'
      default: return 'bg-gray-500/10 text-gray-600'
    }
  }

  const getCategoryIcon = (category: MentalExercise['category']) => {
    switch (category) {
      case 'breathing': return <Wind className="h-4 w-4" />
      case 'mindfulness': return <Heart className="h-4 w-4" />
      case 'visualization': return <Eye className="h-4 w-4" />
      case 'focus': return <Focus className="h-4 w-4" />
    }
  }

  return (
    <AppNavigation>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="timer" className="gap-2">
              <TimerIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="kegels" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Kegels</span>
            </TabsTrigger>
            <TabsTrigger value="mental" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Mental</span>
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="space-y-6">
            <ErrorBoundary>
              <Timer />
            </ErrorBoundary>

            {/* Collapsible Guidance */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setShowGuidance(!showGuidance)}
              >
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Session Guidance</span>
                  {showGuidance ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
              {showGuidance && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-2">Before</h4>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• Find a private space</li>
                        <li>• Take deep breaths</li>
                        <li>• Set a time goal</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-2">During</h4>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• Focus on breathing</li>
                        <li>• Relax muscles</li>
                        <li>• Stay mindful</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <h4 className="font-semibold text-green-600 mb-2">After</h4>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• Review progress</li>
                        <li>• Note what worked</li>
                        <li>• Plan next session</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Kegels Tab */}
          <TabsContent value="kegels" className="space-y-6">
            {/* Active Workout */}
            {kegelWorkout && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{kegelWorkout.exercise.name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setKegelRunning(!kegelRunning)}
                      >
                        {kegelRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setKegelWorkout(null); setKegelRunning(false) }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold">{formatTime(kegelWorkout.timeRemaining)}</div>
                    <div className={`text-lg font-medium ${kegelWorkout.isHolding ? 'text-orange-500' : 'text-green-500'}`}>
                      {kegelWorkout.isHolding ? 'HOLD' : 'REST'}
                    </div>
                    <div className="flex justify-center gap-8 text-sm text-muted-foreground">
                      <div>Rep {kegelWorkout.currentRep}/{kegelWorkout.exercise.reps}</div>
                      <div>Set {kegelWorkout.currentSet}/{kegelWorkout.exercise.sets}</div>
                    </div>
                    <Progress
                      value={(kegelWorkout.currentRep / kegelWorkout.exercise.reps) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exercise List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kegelExercises.map((exercise) => (
                <Card key={exercise.id} className={kegelWorkout ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{exercise.name}</h3>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-3">
                      <div>Hold: {exercise.hold_time}s</div>
                      <div>Rest: {exercise.rest_time}s</div>
                      <div>Reps: {exercise.reps}</div>
                      <div>Sets: {exercise.sets}</div>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={!!kegelWorkout}
                      onClick={() => startKegel(exercise)}
                    >
                      Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mental Tab */}
          <TabsContent value="mental" className="space-y-6">
            {/* Active Session */}
            {mentalSession && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{mentalSession.exercise.name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMentalRunning(!mentalRunning)}
                      >
                        {mentalRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setMentalSession(null); setMentalRunning(false) }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold">{formatTime(mentalSession.timeRemaining)}</div>
                    <div className="text-sm text-muted-foreground">
                      Step {mentalSession.currentStep + 1} of {mentalSession.exercise.instructions.length}
                    </div>
                    <Progress
                      value={((mentalSession.currentStep + 1) / mentalSession.exercise.instructions.length) * 100}
                      className="h-2"
                    />
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm">{mentalSession.exercise.instructions[mentalSession.currentStep]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exercise List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentalExercises.map((exercise) => (
                <Card key={exercise.id} className={mentalSession ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(exercise.category)}
                        <h3 className="font-medium">{exercise.name}</h3>
                      </div>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>{exercise.duration} min</span>
                      <span className="capitalize">{exercise.category}</span>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={!!mentalSession}
                      onClick={() => startMental(exercise)}
                    >
                      Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppNavigation>
  )
}
