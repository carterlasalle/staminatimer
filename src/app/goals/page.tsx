'use client'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  Calendar, 
  CheckCircle,
  Plus,
  Settings,
  Zap,
  Brain,
  Dumbbell
} from 'lucide-react'
import { useState } from 'react'

type Goal = {
  id: string
  title: string
  description: string
  type: 'duration' | 'frequency' | 'streak' | 'skill'
  target: number
  current: number
  unit: string
  deadline: Date
  priority: 'low' | 'medium' | 'high'
  category: 'stamina' | 'mental' | 'kegels' | 'overall'
}

type Program = {
  id: string
  name: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  focus: string[]
  activities: string[]
  progress: number
}

const sampleGoals: Goal[] = [
  {
    id: '1',
    title: 'Daily Practice Streak',
    description: 'Maintain consistent daily practice for better long-term results',
    type: 'streak',
    target: 30,
    current: 12,
    unit: 'days',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    priority: 'high',
    category: 'overall'
  },
  {
    id: '2',
    title: 'Session Duration Goal',
    description: 'Gradually increase average session length',
    type: 'duration',
    target: 15,
    current: 8.5,
    unit: 'minutes',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    category: 'stamina'
  },
  {
    id: '3',
    title: 'Kegel Strength',
    description: 'Complete advanced kegel exercise program',
    type: 'skill',
    target: 100,
    current: 65,
    unit: '%',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    category: 'kegels'
  }
]

const trainingPrograms: Program[] = [
  {
    id: 'beginner_30',
    name: '30-Day Beginner Foundation',
    description: 'Build basic control and awareness over 4 weeks',
    duration: '30 days',
    difficulty: 'beginner',
    focus: ['Basic Control', 'Awareness', 'Consistency'],
    activities: ['Daily 10-min sessions', 'Basic kegels', 'Breathing exercises'],
    progress: 0
  },
  {
    id: 'stamina_builder',
    name: 'Stamina Builder Program',
    description: 'Systematic approach to building lasting endurance',
    duration: '8 weeks',
    difficulty: 'intermediate',
    focus: ['Endurance', 'Edge Control', 'Mental Skills'],
    activities: ['Progressive sessions', 'Advanced kegels', 'Visualization'],
    progress: 34
  },
  {
    id: 'mastery_path',
    name: 'Complete Mastery Path',
    description: 'Comprehensive program for advanced practitioners',
    duration: '12 weeks',
    difficulty: 'advanced',
    focus: ['Complete Control', 'Advanced Techniques', 'Mastery'],
    activities: ['Complex sessions', 'Mental training', 'Habit optimization'],
    progress: 0
  }
]

export default function GoalsPage(): JSX.Element {
  const [goals] = useState<Goal[]>(sampleGoals)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stamina': return <Zap className="h-4 w-4" />
      case 'mental': return <Brain className="h-4 w-4" />
      case 'kegels': return <Dumbbell className="h-4 w-4" />
      case 'overall': return <Target className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
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

  const formatDeadline = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return `${days} days left`
  }

  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Goals & Planning</h1>
          <p className="text-muted-foreground">
            Set personalized goals and follow structured programs to achieve your targets.
          </p>
        </div>

        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Personal Goals
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Training Programs
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Habit Tracking
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Current Goals */}
              <div className="xl:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Your Goals</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(goal.category)}
                            <h4 className="font-semibold">{goal.title}</h4>
                          </div>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.current} / {goal.target} {goal.unit}</span>
                          </div>
                          <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{formatDeadline(goal.deadline)}</span>
                          <span>{Math.round((goal.current / goal.target) * 100)}% complete</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Goal Creation & Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Add Goal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      placeholder="Goal title"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline">Duration</Button>
                      <Button size="sm" variant="outline">Frequency</Button>
                      <Button size="sm" variant="outline">Streak</Button>
                      <Button size="sm" variant="outline">Skill</Button>
                    </div>
                    <Button className="w-full">Create Goal</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Goal Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Goals</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Completed This Month</span>
                      <span className="font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium text-green-500">85%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {trainingPrograms.map((program) => (
                <Card 
                  key={program.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProgram?.id === program.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedProgram(program)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Badge className={getDifficultyColor(program.difficulty)}>
                        {program.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Duration</span>
                        <span className="font-medium">{program.duration}</span>
                      </div>
                      {program.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{program.progress}%</span>
                          </div>
                          <Progress value={program.progress} className="h-1" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Focus Areas</h5>
                      <div className="flex flex-wrap gap-1">
                        {program.focus.map((focus) => (
                          <Badge key={focus} variant="secondary" className="text-xs">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Activities</h5>
                      <div className="space-y-1">
                        {program.activities.map((activity, index) => (
                          <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            {activity}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">
                      {program.progress > 0 ? 'Continue Program' : 'Start Program'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Habits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: 'Morning Kegels', completed: true },
                      { name: 'Training Session', completed: true },
                      { name: 'Evening Breathing', completed: false },
                      { name: 'Progress Review', completed: false }
                    ].map((habit, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            habit.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                          }`}>
                            {habit.completed && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <span className={habit.completed ? 'line-through text-muted-foreground' : ''}>
                            {habit.name}
                          </span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Habit Streaks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: 'Daily Practice', streak: 12, target: 30 },
                      { name: 'Kegel Exercises', streak: 8, target: 21 },
                      { name: 'Mental Training', streak: 5, target: 14 }
                    ].map((habit, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{habit.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {habit.streak}/{habit.target} days
                          </span>
                        </div>
                        <Progress value={(habit.streak / habit.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppNavigation>
  )
}