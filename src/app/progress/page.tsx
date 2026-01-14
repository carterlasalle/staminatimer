'use client'

export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { SessionHistory } from '@/components/SessionHistory'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExportButton } from '@/components/ExportButton'
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
import { formatDuration } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Target,
  Activity,
  Plus,
  Zap,
  Brain,
  Dumbbell,
  Trash2,
  Trophy,
  Flame
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

const CUSTOM_GOALS_KEY = 'stamina-timer-custom-goals'

export default function ProgressPage() {
  const { analytics, loading: analyticsLoading } = useAnalytics()
  const { streakCount, level } = useGamification()
  const { recentSessions } = useGlobal()

  // Goal dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDescription, setNewGoalDescription] = useState('')
  const [newGoalType, setNewGoalType] = useState<'duration' | 'frequency' | 'streak' | 'skill'>('duration')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalPriority, setNewGoalPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newGoalCategory, setNewGoalCategory] = useState<'stamina' | 'mental' | 'kegels' | 'overall'>('stamina')
  const [newGoalDays, setNewGoalDays] = useState('30')
  const [customGoals, setCustomGoals] = useState<Goal[]>([])

  // Load custom goals
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_GOALS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const goalsWithDates = parsed.map((g: Goal) => ({
          ...g,
          deadline: new Date(g.deadline)
        }))
        setCustomGoals(goalsWithDates)
      }
    } catch {
      // Ignore errors
    }
  }, [])

  const saveCustomGoals = useCallback((goals: Goal[]) => {
    try {
      localStorage.setItem(CUSTOM_GOALS_KEY, JSON.stringify(goals))
      setCustomGoals(goals)
    } catch {
      // Ignore errors
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
    toast.success('Goal created!')

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

  // Calculate stats
  const stats = useMemo(() => {
    if (!analytics || !recentSessions.length) {
      return { totalSessions: 0, totalTime: 0, averageSession: 0, weekSessions: 0 }
    }

    const totalTime = recentSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)
    const averageSession = recentSessions.length > 0 ? totalTime / recentSessions.length : 0

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const weekSessions = recentSessions.filter(s => new Date(s.created_at) >= weekStart).length

    return {
      totalSessions: analytics.totalSessions,
      totalTime,
      averageSession,
      weekSessions
    }
  }, [analytics, recentSessions])

  // Generate dynamic goals
  const dynamicGoals = useMemo((): Goal[] => {
    if (!analytics || !recentSessions.length) return []

    const goals: Goal[] = []
    const now = new Date()

    // Streak goal
    const streakTarget = Math.max(7, Math.ceil(streakCount * 1.5))
    goals.push({
      id: 'streak_goal',
      title: 'Daily Practice Streak',
      description: 'Maintain consistent daily practice',
      type: 'streak',
      target: streakTarget,
      current: streakCount,
      unit: 'days',
      deadline: new Date(now.getTime() + (streakTarget - streakCount) * 24 * 60 * 60 * 1000),
      priority: 'high',
      category: 'overall'
    })

    // Duration goal
    const avgDuration = analytics.averageSessionDuration
    const durationTarget = Math.max(600000, Math.ceil(avgDuration * 1.3))
    goals.push({
      id: 'duration_goal',
      title: 'Session Duration Goal',
      description: 'Increase average session length',
      type: 'duration',
      target: durationTarget / 60000,
      current: avgDuration / 60000,
      unit: 'minutes',
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      category: 'stamina'
    })

    // Level goal
    goals.push({
      id: 'level_goal',
      title: `Reach Level ${level.level + 1}`,
      description: 'Build experience and unlock achievements',
      type: 'skill',
      target: 100,
      current: level.currentLevelXp,
      unit: 'XP',
      deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      priority: 'low',
      category: 'overall'
    })

    return goals
  }, [analytics, recentSessions, streakCount, level])

  // Calculate current progress for custom goals based on their type
  const calculateGoalProgress = useCallback((goal: Goal): number => {
    switch (goal.type) {
      case 'duration':
        // Total minutes trained (all sessions)
        const totalMinutes = recentSessions.reduce(
          (acc, s) => acc + (s.total_duration || 0) / 60000,
          0
        )
        return Math.round(totalMinutes * 10) / 10

      case 'frequency':
        // Number of sessions
        return recentSessions.length

      case 'streak':
        // Current streak (reuse existing logic from gamification)
        return streakCount

      case 'skill':
        // XP/points earned
        return level.currentLevelXp + (level.level - 1) * 100

      default:
        return 0
    }
  }, [recentSessions, streakCount, level])

  // Update custom goals with calculated progress
  const customGoalsWithProgress = useMemo(() => {
    return customGoals.map(goal => ({
      ...goal,
      current: calculateGoalProgress(goal)
    }))
  }, [customGoals, calculateGoalProgress])

  const allGoals = useMemo(() => [...dynamicGoals, ...customGoalsWithProgress], [dynamicGoals, customGoalsWithProgress])

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
      default: return <Target className="h-4 w-4" />
    }
  }

  const formatDeadline = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Due today'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  if (analyticsLoading) {
    return (
      <AppNavigation>
        <div className="max-w-6xl mx-auto p-4 sm:p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
            </div>
          </div>
        </div>
      </AppNavigation>
    )
  }

  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium">Progress</h1>
            <p className="text-muted-foreground mt-1">Track your training journey</p>
          </div>
          <ExportButton />
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-light">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-light">{formatDuration(stats.totalTime)}</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-light">{formatDuration(stats.averageSession)}</div>
              <div className="text-xs text-muted-foreground">Avg Session</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-light">{streakCount}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Analytics />
          </ErrorBoundary>
          <ErrorBoundary>
            <Charts />
          </ErrorBoundary>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Your Goals</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Create Goal</DialogTitle>
                  <DialogDescription>Set a custom goal to track</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Reach 20 minute sessions"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select value={newGoalType} onValueChange={(v) => setNewGoalType(v as typeof newGoalType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="duration">Duration</SelectItem>
                          <SelectItem value="frequency">Frequency</SelectItem>
                          <SelectItem value="streak">Streak</SelectItem>
                          <SelectItem value="skill">Skill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="target">Target</Label>
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
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Days</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={newGoalDays}
                        onChange={(e) => setNewGoalDays(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateGoal}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGoals.map((goal) => (
              <Card key={goal.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(goal.category)}
                      <span className="font-medium text-sm">{goal.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </Badge>
                      {goal.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={Math.min(100, (goal.current / goal.target) * 100)} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(goal.current)}/{goal.target} {goal.unit}</span>
                      <span>{formatDeadline(goal.deadline)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Level {level.level}</span>
                    <span className="text-xs text-muted-foreground">{level.currentLevelXp}/100 XP</span>
                  </div>
                  <Progress value={level.progressPct} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{streakCount} Day Streak</span>
                    <span className="text-xs text-muted-foreground">Goal: 30</span>
                  </div>
                  <Progress value={Math.min(100, (streakCount / 30) * 100)} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stats.weekSessions} This Week</span>
                    <span className="text-xs text-muted-foreground">Goal: 5</span>
                  </div>
                  <Progress value={Math.min(100, (stats.weekSessions / 5) * 100)} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        <div>
          <h2 className="text-lg font-medium mb-4">Recent Sessions</h2>
          <ErrorBoundary>
            <SessionHistory />
          </ErrorBoundary>
        </div>
      </div>
    </AppNavigation>
  )
}
