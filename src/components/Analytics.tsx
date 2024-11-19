'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Session } from '@/lib/supabase/schema'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type DBSession = {
  id: string
  start_time: string
  end_time: string
  total_duration: number
  active_duration: number
  edge_duration: number
  finished_during_edge: boolean
  created_at: string
  edge_events: Array<{
    id: string
    start_time: string
    end_time: string
    duration: number
  }>
}

type Analytics = {
  averageSessionDuration: number
  averageEdgeDuration: number
  averageTimeBetweenEdges: number
  totalSessions: number
  improvementRate: number
}

interface AnalyticsProps {
  data?: any[] // Add proper typing based on your data structure
}

export function Analytics({ data: externalData }: AnalyticsProps = {}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function calculateAnalytics() {
      try {
        // If external data is provided, use it instead of fetching
        if (externalData) {
          const typedSessions = externalData as DBSession[]
          
          const stats = typedSessions.reduce((acc, session) => {
            acc.totalDuration += session.total_duration ?? 0
            acc.totalEdges += session.edge_events?.length ?? 0
            
            // Calculate time between edges
            if (session.edge_events && session.edge_events.length > 1) {
              let previousEdge = session.edge_events[0]
              for (let i = 1; i < session.edge_events.length; i++) {
                const currentEdge = session.edge_events[i]
                if (previousEdge.end_time && currentEdge.start_time) {
                  acc.totalTimeBetweenEdges += new Date(currentEdge.start_time).getTime() - 
                    new Date(previousEdge.end_time).getTime()
                  acc.edgeIntervalCount++
                }
                previousEdge = currentEdge
              }
            }
            
            return acc
          }, {
            totalDuration: 0,
            totalEdges: 0,
            totalTimeBetweenEdges: 0,
            edgeIntervalCount: 0
          })

          setAnalytics({
            averageSessionDuration: stats.totalDuration / typedSessions.length || 0,
            averageEdgeDuration: typedSessions.reduce((acc, s) => acc + (s.edge_duration ?? 0), 0) / (stats.totalEdges || 1),
            averageTimeBetweenEdges: stats.edgeIntervalCount > 0 ? stats.totalTimeBetweenEdges / stats.edgeIntervalCount : 0,
            totalSessions: typedSessions.length,
            improvementRate: calculateImprovementRate(typedSessions)
          })
          
          setLoading(false)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select(`
            *,
            edge_events!fk_session (*)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('Error fetching analytics data:', error)
          return
        }

        const typedSessions = sessions as DBSession[]
        
        const stats = typedSessions.reduce((acc, session) => {
          acc.totalDuration += session.total_duration ?? 0
          acc.totalEdges += session.edge_events?.length ?? 0
          
          // Calculate time between edges
          if (session.edge_events && session.edge_events.length > 1) {
            let previousEdge = session.edge_events[0]
            for (let i = 1; i < session.edge_events.length; i++) {
              const currentEdge = session.edge_events[i]
              if (previousEdge.end_time && currentEdge.start_time) {
                acc.totalTimeBetweenEdges += new Date(currentEdge.start_time).getTime() - 
                  new Date(previousEdge.end_time).getTime()
                acc.edgeIntervalCount++
              }
              previousEdge = currentEdge
            }
          }
          
          return acc
        }, {
          totalDuration: 0,
          totalEdges: 0,
          totalTimeBetweenEdges: 0,
          edgeIntervalCount: 0
        })

        setAnalytics({
          averageSessionDuration: stats.totalDuration / typedSessions.length || 0,
          averageEdgeDuration: typedSessions.reduce((acc, s) => acc + (s.edge_duration ?? 0), 0) / (stats.totalEdges || 1),
          averageTimeBetweenEdges: stats.edgeIntervalCount > 0 ? stats.totalTimeBetweenEdges / stats.edgeIntervalCount : 0,
          totalSessions: typedSessions.length,
          improvementRate: calculateImprovementRate(typedSessions)
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error calculating analytics:', err)
        setLoading(false)
      }
    }

    calculateAnalytics()
    // Only set up polling if we're not using external data
    if (!externalData) {
      const interval = setInterval(calculateAnalytics, 5000)
      return () => clearInterval(interval)
    }
  }, [externalData])

  function calculateImprovementRate(sessions: DBSession[]): number {
    if (sessions.length < 2) return 0
    
    // Get the most recent 5 sessions and oldest 5 sessions
    const recentSessions = sessions.slice(0, 5)
    const olderSessions = sessions.slice(-5)
    
    // Calculate average duration and edge count for recent sessions
    const recentStats = recentSessions.reduce((acc, s) => ({
      totalDuration: acc.totalDuration + (s.total_duration ?? 0),
      edgeCount: acc.edgeCount + (s.edge_events?.length ?? 0)
    }), { totalDuration: 0, edgeCount: 0 })

    // Calculate average duration and edge count for older sessions
    const olderStats = olderSessions.reduce((acc, s) => ({
      totalDuration: acc.totalDuration + (s.total_duration ?? 0),
      edgeCount: acc.edgeCount + (s.edge_events?.length ?? 0)
    }), { totalDuration: 0, edgeCount: 0 })

    // Calculate improvement metrics
    const recentAvgDuration = recentStats.totalDuration / recentSessions.length
    const olderAvgDuration = olderStats.totalDuration / olderSessions.length
    const recentAvgEdges = recentStats.edgeCount / recentSessions.length
    const olderAvgEdges = olderStats.edgeCount / olderSessions.length

    // Calculate overall improvement (considering both duration and edge count)
    const durationImprovement = ((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100
    const edgeImprovement = ((recentAvgEdges - olderAvgEdges) / olderAvgEdges) * 100

    // Return weighted average of improvements
    return (durationImprovement + edgeImprovement) / 2
  }

  if (loading) return <div>Calculating analytics...</div>

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Average Session Duration</div>
            <div className="text-xl">{formatDuration(analytics?.averageSessionDuration ?? 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Average Edge Duration</div>
            <div className="text-xl">{formatDuration(analytics?.averageEdgeDuration ?? 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Average Time Between Edges</div>
            <div className="text-xl">{formatDuration(analytics?.averageTimeBetweenEdges ?? 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Improvement Rate</div>
            <div className="text-xl">{analytics?.improvementRate.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 