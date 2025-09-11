'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { SessionHistory } from '@/components/SessionHistory'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ExportButton'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useGamification } from '@/hooks/useGamification'
import { useGlobal } from '@/contexts/GlobalContext'
import { formatDuration } from '@/lib/utils'
import { 
  Calendar, 
  Clock,
  Target,
  Activity,
  Download
} from 'lucide-react'
import { useMemo } from 'react'

export default function AnalyticsPage(): JSX.Element {
  const { analytics, loading: analyticsLoading } = useAnalytics()
  const { streakCount } = useGamification()
  const { recentSessions } = useGlobal()

  // Calculate real stats from database
  const stats = useMemo(() => {
    if (!analytics || !recentSessions.length) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageSession: 0,
        weekSessions: 0,
        weekTime: 0,
        bestSession: 0,
        recentAvgDuration: 0,
        previousAvgDuration: 0
      }
    }

    const totalTime = recentSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)
    const averageSession = recentSessions.length > 0 ? totalTime / recentSessions.length : 0

    // Calculate this week's stats
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const weekSessions = recentSessions.filter(s => new Date(s.created_at) >= weekStart)
    const weekTime = weekSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)
    const bestSession = weekSessions.length > 0 ? Math.max(...weekSessions.map(s => s.total_duration || 0)) : 0

    // Calculate trend data (recent 3 vs previous 3)
    const recentAvgDuration = recentSessions.length >= 3 
      ? recentSessions.slice(0, 3).reduce((acc, s) => acc + (s.total_duration || 0), 0) / 3
      : 0
    const previousAvgDuration = recentSessions.length >= 6
      ? recentSessions.slice(3, 6).reduce((acc, s) => acc + (s.total_duration || 0), 0) / 3
      : 0

    return {
      totalSessions: analytics.totalSessions,
      totalTime,
      averageSession,
      weekSessions: weekSessions.length,
      weekTime,
      bestSession,
      recentAvgDuration,
      previousAvgDuration
    }
  }, [analytics, recentSessions])

  // Calculate trend percentages
  const trends = useMemo(() => {
    if (stats.previousAvgDuration === 0) {
      return {
        sessionDuration: 0,
        edgeControl: 0,
        frequency: 0
      }
    }

    const sessionDurationTrend = ((stats.recentAvgDuration - stats.previousAvgDuration) / stats.previousAvgDuration) * 100
    
    // Calculate edge control improvement (less edge time = better)
    const recentEdgeRatio = recentSessions.length >= 3
      ? recentSessions.slice(0, 3).reduce((acc, s) => acc + ((s.edge_duration || 0) / (s.total_duration || 1)), 0) / 3
      : 0
    const previousEdgeRatio = recentSessions.length >= 6
      ? recentSessions.slice(3, 6).reduce((acc, s) => acc + ((s.edge_duration || 0) / (s.total_duration || 1)), 0) / 3
      : 0
    const edgeControlTrend = previousEdgeRatio > 0 ? ((previousEdgeRatio - recentEdgeRatio) / previousEdgeRatio) * 100 : 0

    // Frequency trend (sessions per week)
    const thisWeekCount = stats.weekSessions
    const lastWeekStart = new Date()
    lastWeekStart.setDate(lastWeekStart.getDate() - 14)
    const lastWeekEnd = new Date()
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
    const lastWeekSessions = recentSessions.filter(s => {
      const date = new Date(s.created_at)
      return date >= lastWeekStart && date < lastWeekEnd
    }).length
    const frequencyTrend = lastWeekSessions > 0 ? ((thisWeekCount - lastWeekSessions) / lastWeekSessions) * 100 : 0

    return {
      sessionDuration: Math.round(sessionDurationTrend * 10) / 10,
      edgeControl: Math.round(edgeControlTrend * 10) / 10,
      frequency: Math.round(frequencyTrend * 10) / 10
    }
  }, [stats, recentSessions])

  if (analyticsLoading) {
    return (
      <AppNavigation>
        <div className="max-w-6xl mx-auto p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppNavigation>
    )
  }

  const formatTrend = (value: number) => {
    if (value === 0) return '0%'
    return `${value > 0 ? '+' : ''}${value}%`
  }

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium">Progress & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your training progress and performance trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <div className="text-2xl font-light mb-1">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <div className="text-2xl font-light mb-1">{formatDuration(stats.totalTime)}</div>
              <div className="text-sm text-muted-foreground">Total Practice</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-3 text-orange-500" />
              <div className="text-2xl font-light mb-1">{formatDuration(stats.averageSession)}</div>
              <div className="text-sm text-muted-foreground">Average Session</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <div className="text-2xl font-light mb-1">{streakCount}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-medium mb-4">Performance Overview</h2>
            <ErrorBoundary>
              <Analytics />
            </ErrorBoundary>
          </div>
          <div>
            <h2 className="text-lg font-medium mb-4">Progress Charts</h2>
            <ErrorBoundary>
              <Charts />
            </ErrorBoundary>
          </div>
        </div>

        {/* Session History */}
        <div>
          <h2 className="text-lg font-medium mb-4">Recent Sessions</h2>
          <ErrorBoundary>
            <SessionHistory />
          </ErrorBoundary>
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sessions</span>
                <span className="font-medium">{stats.weekSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total time</span>
                <span className="font-medium">{formatDuration(stats.weekTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Best session</span>
                <span className="font-medium">{formatDuration(stats.bestSession)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Session duration</span>
                <span className={`text-sm ${getTrendColor(trends.sessionDuration)}`}>
                  {formatTrend(trends.sessionDuration)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Edge control</span>
                <span className={`text-sm ${getTrendColor(trends.edgeControl)}`}>
                  {formatTrend(trends.edgeControl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <span className={`text-sm ${getTrendColor(trends.frequency)}`}>
                  {formatTrend(trends.frequency)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppNavigation>
  )
}