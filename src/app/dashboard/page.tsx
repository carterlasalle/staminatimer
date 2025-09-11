'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Timer, 
  TrendingUp, 
  Target,
  ArrowRight,
  Activity
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

  const lastSession = recentSessions[0]

  return (
    <AppNavigation>
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">Ready to continue your progress?</p>
        </div>

        {/* Primary Action */}
        <div className="text-center">
          <Link href="/training">
            <Button size="lg" className="px-8 py-6 text-lg font-medium rounded-full">
              <Timer className="mr-3 h-5 w-5" />
              Start Training Session
            </Button>
          </Link>
        </div>

        {/* Today's Progress - Simple */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Today's Goal</span>
            <span className="text-2xl font-light">{goalPct}%</span>
          </div>
          <Progress value={goalPct} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatDuration(todayMs)}</span>
            <span>{formatDuration(goalMs)}</span>
          </div>
        </div>

        {/* Key Stats - Minimal */}
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-light">{level.level}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-light">{streakCount}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-light">{recentSessions.length}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
        </div>

        {/* Last Session */}
        {lastSession && (
          <div className="border-t pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Last Session</h3>
                <p className="text-muted-foreground">
                  {formatDuration(lastSession.total_duration)} • {lastSession.edge_events?.length || 0} edges
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(lastSession.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Secondary Actions */}
        <div className="border-t pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/kegels" className="group">
              <div className="p-6 text-center hover:bg-accent/50 rounded-lg transition-colors">
                <Activity className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-foreground" />
                <div className="font-medium group-hover:text-foreground">Kegel Exercises</div>
              </div>
            </Link>
            
            <Link href="/mental" className="group">
              <div className="p-6 text-center hover:bg-accent/50 rounded-lg transition-colors">
                <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-foreground" />
                <div className="font-medium group-hover:text-foreground">Mental Training</div>
              </div>
            </Link>
            
            <Link href="/analytics" className="group">
              <div className="p-6 text-center hover:bg-accent/50 rounded-lg transition-colors">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-foreground" />
                <div className="font-medium group-hover:text-foreground">View Progress</div>
              </div>
            </Link>
          </div>
        </div>

        {/* View All Sessions Link */}
        <div className="text-center pt-4">
          <Link href="/analytics">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              View all sessions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppNavigation>
  )
}