'use client'

import { AppNavigation } from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Timer, 
  Calendar, 
  TrendingUp, 
  Target, 
  Award, 
  Zap,
  ArrowRight,
  Activity,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useGamification } from '@/hooks/useGamification'
import { useGlobal } from '@/contexts/GlobalContext'
import { usePreferences } from '@/hooks/usePreferences'
import { formatDuration } from '@/lib/utils'

export default function Dashboard(): JSX.Element {
  const { level, streakCount } = useGamification()
  const { recentSessions } = useGlobal()
  const { prefs } = usePreferences()

  // Today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const todayMs = recentSessions
    .filter((s) => {
      const t = new Date(s.created_at)
      return t >= today && t < tomorrow
    })
    .reduce((acc, s) => acc + (s.total_duration || 0), 0)

  const goalMs = prefs.dailyGoalMinutes * 60 * 1000
  const goalPct = Math.min(100, Math.round((todayMs / goalMs) * 100))

  // Weekly stats
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 7)
  const weekSessions = recentSessions.filter(s => new Date(s.created_at) >= weekStart)
  const weekTotal = weekSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)

  const quickActions = [
    {
      title: 'Start Training Session',
      description: 'Begin a stamina building session',
      href: '/training',
      icon: Timer,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Kegel Workout',
      description: 'Strengthen your pelvic floor',
      href: '/kegels',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Mental Training',
      description: 'Practice mindfulness techniques',
      href: '/mental',
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'View Analytics',
      description: 'Deep dive into your progress',
      href: '/analytics',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ]

  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's your progress overview and quick access to training tools.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{level.level}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-2">
                <Progress value={level.progressPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - level.currentLevelXp} XP to next level
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Goal</p>
                  <p className="text-2xl font-bold">{goalPct}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Progress value={goalPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDuration(todayMs)} / {formatDuration(goalMs)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{streakCount}</p>
                </div>
                <div className="text-orange-500">
                  🔥
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {streakCount > 0 ? 'Days in a row' : 'Start your streak today'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{weekSessions.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(weekTotal)} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
                      <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all">
                        Get started
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Sessions</span>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.slice(0, 3).length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">{formatDuration(session.total_duration)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{session.edge_events?.length || 0} edges</p>
                        <div className={`text-xs px-2 py-1 rounded ${
                          session.finished_during_edge 
                            ? 'bg-orange-500/20 text-orange-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {session.finished_during_edge ? 'Edge finish' : 'Complete'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sessions yet</p>
                  <p className="text-xs">Start your first training session!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Goal</span>
                    <span>{goalPct}%</span>
                  </div>
                  <Progress value={goalPct} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDuration(todayMs)} of {formatDuration(goalMs)}
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Quick Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Consistency is key - aim for regular short sessions rather than sporadic long ones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppNavigation>
  )
}
