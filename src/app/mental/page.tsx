'use client'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Brain,
  Heart,
  Wind,
  Focus,
  Clock,
  Target,
  Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'

type MentalExercise = {
  id: string
  name: string
  description: string
  duration: number
  category: 'breathing' | 'mindfulness' | 'visualization' | 'focus'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  benefits: string[]
  instructions: string[]
}

const mentalExercises: MentalExercise[] = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Four-count breathing for calm control',
    duration: 300, // 5 minutes
    category: 'breathing',
    difficulty: 'beginner',
    benefits: ['Reduces anxiety', 'Improves focus', 'Enhances control'],
    instructions: [
      'Inhale for 4 counts',
      'Hold for 4 counts', 
      'Exhale for 4 counts',
      'Hold for 4 counts',
      'Repeat the cycle'
    ]
  },
  {
    id: 'body_scan',
    name: 'Body Awareness Scan',
    description: 'Progressive body awareness meditation',
    duration: 600, // 10 minutes
    category: 'mindfulness',
    difficulty: 'intermediate',
    benefits: ['Body awareness', 'Tension release', 'Present moment focus'],
    instructions: [
      'Start with your toes',
      'Notice sensations without judgment',
      'Move attention up your body',
      'Include pelvic area mindfully',
      'End with full body awareness'
    ]
  },
  {
    id: 'stamina_visualization',
    name: 'Control Visualization',
    description: 'Mental rehearsal for enhanced control',
    duration: 480, // 8 minutes
    category: 'visualization',
    difficulty: 'advanced',
    benefits: ['Mental preparation', 'Confidence building', 'Performance enhancement'],
    instructions: [
      'Visualize successful control',
      'Imagine calm, confident responses',
      'Picture ideal outcomes',
      'Feel the sensations of mastery',
      'Anchor positive feelings'
    ]
  },
  {
    id: 'present_moment',
    name: 'Present Moment Anchor',
    description: 'Grounding technique for staying present',
    duration: 180, // 3 minutes
    category: 'focus',
    difficulty: 'beginner',
    benefits: ['Prevents overthinking', 'Reduces performance anxiety', 'Improves awareness'],
    instructions: [
      'Notice 5 things you can see',
      'Notice 4 things you can touch',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste'
    ]
  }
]

type MentalSession = {
  exercise: MentalExercise
  timeRemaining: number
  currentStep: number
  isActive: boolean
  totalDuration: number
}

export default function MentalPage(): JSX.Element {
  const [selectedExercise, setSelectedExercise] = useState<MentalExercise | null>(null)
  const [session, setSession] = useState<MentalSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Timer logic
  useEffect(() => {
    if (!session || !isRunning) return

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev) return null
        
        if (prev.timeRemaining > 1) {
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        } else {
          // Session complete
          setIsRunning(false)
          return prev
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [session, isRunning])

  const startSession = (exercise: MentalExercise) => {
    setSession({
      exercise,
      timeRemaining: exercise.duration,
      currentStep: 0,
      isActive: true,
      totalDuration: exercise.duration
    })
    setIsRunning(true)
  }

  const pauseSession = () => {
    setIsRunning(!isRunning)
  }

  const resetSession = () => {
    setSession(null)
    setIsRunning(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breathing': return <Wind className="h-5 w-5" />
      case 'mindfulness': return <Brain className="h-5 w-5" />
      case 'visualization': return <Sparkles className="h-5 w-5" />
      case 'focus': return <Target className="h-5 w-5" />
      default: return <Heart className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breathing': return 'text-blue-500'
      case 'mindfulness': return 'text-purple-500'
      case 'visualization': return 'text-pink-500'
      case 'focus': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const progress = session 
    ? ((session.totalDuration - session.timeRemaining) / session.totalDuration) * 100
    : 0

  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Mental Skills Training</h1>
          <p className="text-muted-foreground">
            Develop mental techniques and mindfulness practices for better control and confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Session Interface */}
          <div className="xl:col-span-2 space-y-6">
            {session ? (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className={getCategoryColor(session.exercise.category)}>
                        {getCategoryIcon(session.exercise.category)}
                      </div>
                      {session.exercise.name}
                    </CardTitle>
                    <Badge className={getDifficultyColor(session.exercise.difficulty)}>
                      {session.exercise.difficulty}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Session Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timer Display */}
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2 text-primary">
                      {formatTime(session.timeRemaining)}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">
                      {isRunning ? 'In Session' : 'Paused'}
                    </div>
                  </div>

                  {/* Current Instructions */}
                  <div className="p-6 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-4 text-center">Follow Along</h4>
                    <div className="space-y-2">
                      {session.exercise.instructions.map((instruction, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-2 rounded"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Controls */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={pauseSession}
                      size="lg"
                      variant={isRunning ? "secondary" : "default"}
                    >
                      {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button onClick={resetSession} size="lg" variant="outline">
                      <RotateCcw className="h-5 w-5 mr-2" />
                      End Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Begin?</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a mental training exercise to start developing your mental skills.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mental Training Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Mental Training Principles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Focus className="h-5 w-5 text-blue-500" />
                      Mindful Awareness
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Stay present and aware of sensations</p>
                      <p>• Notice thoughts without judgment</p>
                      <p>• Practice observing rather than reacting</p>
                      <p>• Develop body-mind connection</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Emotional Regulation
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Manage performance anxiety</p>
                      <p>• Build confidence through practice</p>
                      <p>• Use breathing to stay calm</p>
                      <p>• Visualize successful outcomes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Library Sidebar */}
          <div className="space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="breathing">Breathing</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Exercises</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mentalExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                          selectedExercise?.id === exercise.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={getCategoryColor(exercise.category)}>
                              {getCategoryIcon(exercise.category)}
                            </div>
                            <h4 className="font-semibold">{exercise.name}</h4>
                          </div>
                          <Badge className={getDifficultyColor(exercise.difficulty)}>
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {exercise.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          {Math.floor(exercise.duration / 60)} minutes
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {exercise.benefits.slice(0, 2).map((benefit) => (
                            <Badge key={benefit} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            startSession(exercise)
                          }}
                          className="w-full"
                          size="sm"
                          disabled={!!session}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="breathing" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Breathing Exercises</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mentalExercises
                      .filter(ex => ex.category === 'breathing')
                      .map((exercise) => (
                        <div
                          key={exercise.id}
                          className="p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50"
                          onClick={() => setSelectedExercise(exercise)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Wind className="h-5 w-5 text-blue-500" />
                            <h4 className="font-semibold">{exercise.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {exercise.description}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              startSession(exercise)
                            }}
                            className="w-full"
                            size="sm"
                            disabled={!!session}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Daily Practice Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-muted-foreground">minutes practiced today</div>
                  </div>
                  <Progress value={40} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Goal: 30 minutes daily
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