'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { Progress } from '@/components/ui/progress'
import { calculateDetailedAnalytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import { formatDuration } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { 
  Clock, 
  Zap, 
  Timer, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Brain,
  Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Analytics = {
  averageSessionDuration: number
  averageEdgeDuration: number
  averageTimeBetweenEdges: number
  totalSessions: number
  improvementRate: number
}

type AnalyticsProps = {
  externalData?: DBSession[]
}

export function Analytics({ externalData }: AnalyticsProps = {}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function calculateAnalytics(): Promise<void> {
      setLoading(true)
      try {
        let sessionsToAnalyze: DBSession[]

        if (externalData) {
          sessionsToAnalyze = externalData
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user?.id) {
            setAnalytics(null)
            return
          }
          const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
              *,
              edge_events!fk_session (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) {
            console.error('Error fetching analytics data:', error)
            setAnalytics(null)
            return
          }
          sessionsToAnalyze = sessions as DBSession[]
        }

        const calculatedStats = calculateDetailedAnalytics(sessionsToAnalyze)

        setAnalytics({
          averageSessionDuration: calculatedStats.averageSessionDuration,
          averageEdgeDuration: calculatedStats.averageEdgeDuration,
          averageTimeBetweenEdges: calculatedStats.averageTimeBetweenEdges,
          totalSessions: calculatedStats.totalSessions,
          improvementRate: calculatedStats.improvementRate
        })
      } catch (err) {
        console.error('Error calculating analytics:', err)
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }

    calculateAnalytics()
  }, [externalData])

  if (loading) return (
    <Card>
      <CardContent className="p-6">
        <Loading text="Analyzing performance..." className="text-center" />
      </CardContent>
    </Card>
  )

  if (!analytics) return (
    <Card>
      <CardContent className="p-6 text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No analytics data available.</p>
        <p className="text-xs mt-1">Complete some training sessions to see your performance insights.</p>
      </CardContent>
    </Card>
  )

  const getImprovementStatus = () => {
    if (analytics.improvementRate >= 10) return {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Excellent Progress!'
    }
    if (analytics.improvementRate >= 0) return {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      label: 'Steady Improvement'
    }
    return {
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      label: 'Focus Needed'
    }
  }

  const improvementStatus = getImprovementStatus()
  
  // Calculate efficiency metrics
  const edgeRatio = analytics.averageSessionDuration > 0 
    ? (analytics.averageEdgeDuration / analytics.averageSessionDuration) * 100 
    : 0
  
  const sessionEfficiency = Math.min(100, Math.max(0, 100 - edgeRatio))

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Performance Analytics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your last {analytics.totalSessions} training sessions
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Average Session Duration */}
          <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatDuration(analytics.averageSessionDuration)}
                </p>
              </div>
            </div>
          </div>

          {/* Average Edge Duration */}
          <div className="p-4 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-lg border border-orange-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Edge</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatDuration(analytics.averageEdgeDuration)}
                </p>
              </div>
            </div>
          </div>

          {/* Time Between Edges */}
          <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-lg border border-purple-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Timer className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Between Edges</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatDuration(analytics.averageTimeBetweenEdges)}
                </p>
              </div>
            </div>
          </div>

          {/* Improvement Rate */}
          <div className={cn(
            "p-4 rounded-lg border transition-all duration-300",
            improvementStatus.bgColor,
            improvementStatus.borderColor
          )}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-full", improvementStatus.bgColor)}>
                <div className={improvementStatus.color}>
                  {improvementStatus.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                <p className={cn("text-lg font-bold", improvementStatus.color)}>
                  {analytics.improvementRate >= 0 ? '+' : ''}{analytics.improvementRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className={cn("text-xs font-medium", improvementStatus.color)}>
              {improvementStatus.label}
            </p>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance Insights
          </h4>
          
          {/* Session Efficiency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Training Efficiency</span>
              <span className="text-sm text-muted-foreground">
                {sessionEfficiency.toFixed(0)}%
              </span>
            </div>
            <Progress value={sessionEfficiency} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Higher efficiency means more active training time vs edge time
            </p>
          </div>

          {/* Edge Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Edge Control</span>
              <span className="text-sm text-muted-foreground">
                {edgeRatio.toFixed(1)}% edge time
              </span>
            </div>
            <Progress value={edgeRatio} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Optimal edge control balances challenge with progress
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{analytics.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {analytics.averageTimeBetweenEdges > 0 ? 
                  Math.round(analytics.averageSessionDuration / analytics.averageTimeBetweenEdges) 
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">Avg Edges</div>
            </div>
            <div>
              <div className={cn("text-2xl font-bold", improvementStatus.color)}>
                {analytics.improvementRate >= 0 ? '↗' : '↘'}
              </div>
              <div className="text-xs text-muted-foreground">Trend</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
