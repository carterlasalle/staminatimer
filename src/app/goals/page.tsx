'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useGamification } from '@/hooks/useGamification'
import { useGlobal } from '@/contexts/GlobalContext'
import { usePreferences } from '@/hooks/usePreferences'
import { formatDuration } from '@/lib/utils'
import {
  Target,
  CheckCircle,
  Plus,
  Zap,
  Brain,
  Dumbbell,
  Trash2
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

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
  isCustom?: boolean
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

const CUSTOM_GOALS_KEY = 'stamina-timer-custom-goals'

export default function GoalsPage() {
  const { analytics } = useAnalytics()
  const { streakCount, level } = useGamification()
  const { recentSessions } = useGlobal()
  const { prefs } = usePreferences()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDescription, setNewGoalDescription] = useState('')
  const [newGoalType, setNewGoalType] = useState<'duration' | 'frequency' | 'streak' | 'skill'>('duration')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalPriority, setNewGoalPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newGoalCategory, setNewGoalCategory] = useState<'stamina' | 'mental' | 'kegels' | 'overall'>('stamina')
  const [newGoalDays, setNewGoalDays] = useState('30')

  // Custom goals from localStorage
  const [customGoals, setCustomGoals] = useState<Goal[]>([])

  // Load custom goals from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_GOALS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert deadline strings back to Date objects
        const goalsWithDates = parsed.map((g: Goal) => ({
          ...g,
          deadline: new Date(g.deadline)
        }))
        setCustomGoals(goalsWithDates)
      }
    } catch {
      console.error('Failed to load custom goals')
    }
  }, [])

  // Save custom goals to localStorage
  const saveCustomGoals = useCallback((goals: Goal[]) => {
    try {
      localStorage.setItem(CUSTOM_GOALS_KEY, JSON.stringify(goals))
      setCustomGoals(goals)
    } catch {
      console.error('Failed to save custom goals')
    }
  }, [])

  const getUnitForType = (type: string) => {
    switch (type) {
      case 'duration': return 'minutes'
      case 'frequency': return 'sessions'
      case 'streak': return 'days'
      case 'skill': return 'points'
      default: return 'units'
    }
  }

  const handleCreateGoal = () => {
    if (!newGoalTitle.trim() || !newGoalTarget) {
      toast.error('Please fill in title and target')
      return
    }

    const deadline = new Date()
    deadline.setDate(deadline.getDate() + parseInt(newGoalDays))

    const newGoal: Goal = {
      id: `custom_${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim() || `Custom ${newGoalType} goal`,
      type: newGoalType,
      target: parseFloat(newGoalTarget),
      current: 0,
      unit: getUnitForType(newGoalType),
      deadline,
      priority: newGoalPriority,
      category: newGoalCategory,
      isCustom: true
    }

    saveCustomGoals([...customGoals, newGoal])
    toast.success('Goal created successfully!')

    // Reset form
    setNewGoalTitle('')
    setNewGoalDescription('')
    setNewGoalTarget('')
    setNewGoalType('duration')
    setNewGoalPriority('medium')
    setNewGoalCategory('stamina')
    setNewGoalDays('30')
    setDialogOpen(false)
  }

  const handleDeleteGoal = (goalId: string) => {
    const updated = customGoals.filter(g => g.id !== goalId)
    saveCustomGoals(updated)
    toast.success('Goal deleted')
  }

  // Generate dynamic goals based on user's actual data
  const dynamicGoals = useMemo((): Goal[] => {
    if (!analytics || !recentSessions.length) return []

    const goals: Goal[] = []
    const now = new Date()

    // Goal 1: Daily streak goal based on current streak
    const streakTarget = Math.max(7, Math.ceil(streakCount * 1.5))
    goals.push({
      id: 'streak_goal',
      title: 'Daily Practice Streak',
      description: 'Maintain consistent daily practice for better long-term results',
      type: 'streak',
      target: streakTarget,
      current: streakCount,
      unit: 'days',
      deadline: new Date(now.getTime() + (streakTarget - streakCount) * 24 * 60 * 60 * 1000),
      priority: 'high',
      category: 'overall'
    })

    // Goal 2: Session duration goal based on current average
    const avgDuration = analytics.averageSessionDuration
    const durationTarget = Math.max(600000, Math.ceil(avgDuration * 1.3)) // At least 10 min, or 30% more
    goals.push({
      id: 'duration_goal',
      title: 'Session Duration Goal',
      description: 'Gradually increase average session length',
      type: 'duration',
      target: durationTarget / 60000, // Convert to minutes for display
      current: avgDuration / 60000,
      unit: 'minutes',
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      priority: 'medium',
      category: 'stamina'
    })

    // Goal 3: Weekly frequency goal
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const thisWeekSessions = recentSessions.filter(s => new Date(s.created_at) >= weekStart).length
    const frequencyTarget = Math.max(5, thisWeekSessions + 2)
    goals.push({
      id: 'frequency_goal',
      title: 'Weekly Training Frequency',
      description: 'Maintain regular training schedule',
      type: 'frequency',
      target: frequencyTarget,
      current: thisWeekSessions,
      unit: 'sessions/week',
      deadline: new Date(weekStart.getTime() + 14 * 24 * 60 * 60 * 1000), // Next week
      priority: 'medium',
      category: 'overall'
    })

    // Goal 4: Level progression goal
    const nextLevelTarget = level.level + 1
    goals.push({
      id: 'level_goal',
      title: `Reach Level ${nextLevelTarget}`,
      description: 'Continue building experience and unlock achievements',
      type: 'skill',
      target: 100,
      current: level.currentLevelXp,
      unit: 'XP',
      deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      priority: 'low',
      category: 'overall'
    })

    return goals
  }, [analytics, recentSessions, streakCount, level])

  // Combine dynamic and custom goals
  const allGoals = useMemo(() => [...dynamicGoals, ...customGoals], [dynamicGoals, customGoals])

  // Generate training programs based on user level and experience
  const trainingPrograms = useMemo((): Program[] => {
    const programs: Program[] = []
    const totalSessions = analytics?.totalSessions || 0

    // Beginner program
    programs.push({
      id: 'beginner_foundation',
      name: '30-Day Foundation',
      description: 'Build basic control and awareness',
      duration: '30 days',
      difficulty: 'beginner',
      focus: ['Basic Control', 'Awareness', 'Consistency'],
      activities: ['Daily 10-min sessions', 'Basic kegels', 'Breathing exercises'],
      progress: totalSessions < 10 ? (totalSessions * 10) : 100
    })

    // Intermediate program
    if (totalSessions >= 5) {
      programs.push({
        id: 'stamina_builder',
        name: 'Stamina Builder',
        description: 'Systematic approach to building endurance',
        duration: '8 weeks',
        difficulty: 'intermediate',
        focus: ['Endurance', 'Edge Control', 'Mental Skills'],
        activities: ['Progressive sessions', 'Advanced kegels', 'Visualization'],
        progress: totalSessions >= 10 ? Math.min(100, (totalSessions - 10) * 5) : 0
      })
    }

    // Advanced program
    if (totalSessions >= 15) {
      programs.push({
        id: 'mastery_path',
        name: 'Complete Mastery',
        description: 'Comprehensive advanced program',
        duration: '12 weeks',
        difficulty: 'advanced',
        focus: ['Complete Control', 'Advanced Techniques', 'Mastery'],
        activities: ['Complex sessions', 'Mental training', 'Habit optimization'],
        progress: totalSessions >= 20 ? Math.min(100, (totalSessions - 20) * 3) : 0
      })
    }

    return programs
  }, [analytics])

  // Calculate today's habits based on actual user data
  const todaysHabits = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todaysSessions = recentSessions.filter(s => {
      const date = new Date(s.created_at)
      return date >= today && date < tomorrow
    })

    const dailyGoalMs = prefs.dailyGoalMinutes * 60 * 1000
    const todayMs = todaysSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)

    return [
      { name: 'Morning Kegels', completed: false }, // Could be tracked separately
      { name: 'Training Session', completed: todaysSessions.length > 0 },
      { name: 'Daily Goal Progress', completed: todayMs >= dailyGoalMs },
      { name: 'Progress Review', completed: false } // Could be tracked separately
    ]
  }, [recentSessions, prefs])

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
    if (days <= 0) return 'Due today'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium">Goals & Planning</h1>
          <p className="text-muted-foreground mt-1">
            Set goals and follow structured programs to achieve your targets
          </p>
        </div>

        {/* Current Goals */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Your Goals</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>
                    Set a custom goal to track your progress
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Reach 20 minute sessions"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="Describe your goal..."
                      value={newGoalDescription}
                      onChange={(e) => setNewGoalDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select value={newGoalType} onValueChange={(v) => setNewGoalType(v as typeof newGoalType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="duration">Duration</SelectItem>
                          <SelectItem value="frequency">Frequency</SelectItem>
                          <SelectItem value="streak">Streak</SelectItem>
                          <SelectItem value="skill">Skill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="target">Target ({getUnitForType(newGoalType)})</Label>
                      <Input
                        id="target"
                        type="number"
                        placeholder="e.g., 20"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <Select value={newGoalPriority} onValueChange={(v) => setNewGoalPriority(v as typeof newGoalPriority)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={newGoalCategory} onValueChange={(v) => setNewGoalCategory(v as typeof newGoalCategory)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stamina">Stamina</SelectItem>
                          <SelectItem value="mental">Mental</SelectItem>
                          <SelectItem value="kegels">Kegels</SelectItem>
                          <SelectItem value="overall">Overall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="days">Deadline (days from now)</Label>
                    <Input
                      id="days"
                      type="number"
                      placeholder="30"
                      value={newGoalDays}
                      onChange={(e) => setNewGoalDays(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal}>Create Goal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allGoals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(goal.category)}
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.isCustom && (
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      {goal.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {goal.unit === 'minutes' ? formatDuration(goal.current * 60000) : goal.current.toFixed(goal.unit === 'minutes' ? 1 : 0)} /
                        {goal.unit === 'minutes' ? formatDuration(goal.target * 60000) : goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={Math.min(100, (goal.current / goal.target) * 100)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{formatDeadline(goal.deadline)}</span>
                    <span>{Math.min(100, Math.round((goal.current / goal.target) * 100))}% complete</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Training Programs */}
        <div>
          <h2 className="text-lg font-medium mb-6">Training Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                  <Button className="w-full">
                    {program.progress > 0 ? 'Continue Program' : 'Start Program'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Daily Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Habits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysHabits.map((habit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    habit.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                  }`}>
                    {habit.completed && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className={habit.completed ? 'line-through text-muted-foreground' : ''}>
                    {habit.name}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Current Level</span>
                  <span className="text-sm text-muted-foreground">Level {level.level}</span>
                </div>
                <Progress value={level.progressPct} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {level.currentLevelXp} / 100 XP
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Current Streak</span>
                  <span className="text-sm text-muted-foreground">{streakCount} days</span>
                </div>
                <Progress value={Math.min(100, (streakCount / 30) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Goal: 30 day streak
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total Sessions</span>
                  <span className="text-sm text-muted-foreground">{analytics?.totalSessions || 0}</span>
                </div>
                <Progress value={Math.min(100, ((analytics?.totalSessions || 0) / 50) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Goal: 50 sessions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppNavigation>
  )
}
