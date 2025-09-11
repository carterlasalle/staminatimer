'use client'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useGlobal } from '@/contexts/GlobalContext'
import { 
  Brain, 
  Play, 
  Pause, 
  RotateCcw,
  Heart,
  Focus,
  Wind,
  Eye,
  Timer,
  CheckCircle
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

type MentalExercise = {
  id: string
  name: string
  description: string
  duration: number // minutes
  category: 'breathing' | 'mindfulness' | 'visualization' | 'focus'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
}

const mentalExercises: MentalExercise[] = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Calming 4-4-4-4 breathing pattern for focus and control',
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
    description: 'Develop awareness of physical sensations and tension',
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
    description: 'Longer exhales activate the parasympathetic nervous system',
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
    description: 'Mental rehearsal for improved control and confidence',
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
  },
  {
    id: 'mindful_awareness',
    name: 'Present Moment Awareness',
    description: 'Develop mindful awareness of thoughts and sensations',
    duration: 15,
    category: 'mindfulness',
    difficulty: 'advanced',
    instructions: [
      'Sit in meditation posture',
      'Focus on your breath without controlling it',
      'Notice thoughts and sensations as they arise',
      'Observe without judgment',
      'Return attention to breath when distracted',
      'Cultivate accepting awareness'
    ]
  }
]

type MentalSession = {
  exercise: MentalExercise
  currentStep: number
  timeRemaining: number
  isActive: boolean
  totalSteps: number
}

export default function MentalPage(): JSX.Element {
  const { recentSessions } = useGlobal()
  const [mentalSession, setMentalSession] = useState<MentalSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Calculate today's mental practice time (we don't track mental exercises separately, 
  // so we'll estimate based on training sessions)
  const todayStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todaysSessions = recentSessions.filter(s => {
      const date = new Date(s.created_at)
      return date >= today && date < tomorrow
    })

    // Estimate mental practice time (assume 20% of training time is mental preparation)
    const todayTrainingTime = todaysSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)
    const estimatedMentalTime = Math.floor(todayTrainingTime * 0.2 / 60000) // Convert to minutes
    
    const dailyGoalMinutes = 30 // Default mental training goal
    const progressPct = Math.min(100, Math.round((estimatedMentalTime / dailyGoalMinutes) * 100))

    return {
      practiceMinutes: estimatedMentalTime,
      goalMinutes: dailyGoalMinutes,
      progressPct,
      hasPracticed: todaysSessions.length > 0
    }
  }, [recentSessions])

  // Timer logic for mental exercises
  useEffect(() => {
    if (!mentalSession || !isRunning) return

    const timer = setInterval(() => {
      setMentalSession(prev => {
        if (!prev) return null

        if (prev.timeRemaining > 1) {
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        }

        // Move to next step or complete
        if (prev.currentStep < prev.totalSteps - 1) {
          return {
            ...prev,
            currentStep: prev.currentStep + 1,
            timeRemaining: Math.floor((prev.exercise.duration * 60) / prev.totalSteps)
          }
        } else {
          // Session complete
          setIsRunning(false)
          return null
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mentalSession, isRunning])

  const startMentalExercise = (exercise: MentalExercise) => {
    const timePerStep = Math.floor((exercise.duration * 60) / exercise.instructions.length)
    
    setMentalSession({
      exercise,
      currentStep: 0,
      timeRemaining: timePerStep,
      isActive: true,
      totalSteps: exercise.instructions.length
    })
    setIsRunning(true)
  }

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  const resetSession = () => {
    setMentalSession(null)
    setIsRunning(false)
  }

  const getCategoryIcon = (category: MentalExercise['category']) => {
    switch (category) {
      case 'breathing': return <Wind className="h-4 w-4" />
      case 'mindfulness': return <Heart className="h-4 w-4" />
      case 'visualization': return <Eye className="h-4 w-4" />
      case 'focus': return <Focus className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: MentalExercise['difficulty']) => {
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
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium">Mental Skills Training</h1>
          <p className="text-muted-foreground mt-1">
            Develop mindfulness, breathing techniques, and mental control
          </p>
        </div>

        {/* Active Mental Session */}
        {mentalSession && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Session: {mentalSession.exercise.name}</span>
                <div className="flex gap-2">
                  <Button onClick={togglePause} variant="outline" size="sm">
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button onClick={resetSession} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatTime(mentalSession.timeRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Step {mentalSession.currentStep + 1} of {mentalSession.totalSteps}
                  </div>
                  <Progress 
                    value={((mentalSession.currentStep + 1) / mentalSession.totalSteps) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Current Instruction:</h4>
                  <p className="text-sm text-muted-foreground">
                    {mentalSession.exercise.instructions[mentalSession.currentStep]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Library */}
        <div>
          <h2 className="text-lg font-medium mb-6">Exercise Library</h2>
          
          {!mentalSession ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentalExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(exercise.category)}
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      </div>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{exercise.duration} min</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium capitalize">{exercise.category}</span>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => startMentalExercise(exercise)}
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
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Complete your current session to start a new exercise
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todayStats.practiceMinutes}</div>
                    <div className="text-sm text-muted-foreground">minutes practiced today</div>
                  </div>
                  <Progress value={todayStats.progressPct} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Goal: {todayStats.goalMinutes} minutes daily
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-lg font-semibold">{mentalExercises.length}</div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Timer className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-lg font-semibold">{todayStats.practiceMinutes}</div>
                  <div className="text-xs text-muted-foreground">Minutes Today</div>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-lg font-semibold">
                    {todayStats.progressPct}%
                  </div>
                  <div className="text-xs text-muted-foreground">Daily Goal</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Benefits of Mental Training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Wind className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Breathing Control</h4>
                    <p className="text-xs text-muted-foreground">
                      Regulated breathing activates the parasympathetic nervous system
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Mindful Awareness</h4>
                    <p className="text-xs text-muted-foreground">
                      Develop awareness of physical sensations and arousal levels
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Mental Rehearsal</h4>
                    <p className="text-xs text-muted-foreground">
                      Visualization builds confidence and mental control patterns
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Focus className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Focus Training</h4>
                    <p className="text-xs text-muted-foreground">
                      Improved concentration and present-moment awareness
                    </p>
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