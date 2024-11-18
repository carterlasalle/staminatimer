'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Session } from '@/lib/supabase/schema'

type Analytics = {
  averageSessionDuration: number
  averageEdgeDuration: number
  averageTimeBetweenEdges: number
  totalSessions: number
  improvementRate: number
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function calculateAnalytics() {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          edge_events (*)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching analytics data:', error)
        return
      }

      const stats = sessions.reduce((acc, session) => {
        acc.totalDuration += session.total_duration
        acc.totalEdges += session.edge_events?.length ?? 0
        
        // Calculate time between edges
        if (session.edge_events && session.edge_events.length > 1) {
          let previousEdge = session.edge_events[0]
          for (let i = 1; i < session.edge_events.length; i++) {
            const currentEdge = session.edge_events[i]
            acc.totalTimeBetweenEdges += new Date(currentEdge.start_time).getTime() - 
              new Date(previousEdge.end_time).getTime()
            acc.edgeIntervalCount++
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
        averageSessionDuration: stats.totalDuration / sessions.length,
        averageEdgeDuration: sessions.reduce((acc, s) => acc + s.edge_duration, 0) / stats.totalEdges,
        averageTimeBetweenEdges: stats.totalTimeBetweenEdges / stats.edgeIntervalCount,
        totalSessions: sessions.length,
        improvementRate: calculateImprovementRate(sessions)
      })
      
      setLoading(false)
    }

    calculateAnalytics()
  }, [])

  function calculateImprovementRate(sessions: Session[]): number {
    if (sessions.length < 2) return 0
    
    const recentSessions = sessions.slice(0, 5)
    const olderSessions = sessions.slice(-5)
    
    const recentAvg = recentSessions.reduce((acc, s) => acc + s.total_duration, 0) / recentSessions.length
    const olderAvg = olderSessions.reduce((acc, s) => acc + s.total_duration, 0) / olderSessions.length
    
    return ((recentAvg - olderAvg) / olderAvg) * 100
  }

  if (loading) return <div>Calculating analytics...</div>

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="font-medium text-gray-600">Average Session Duration</div>
          <div className="text-xl">{formatDuration(analytics?.averageSessionDuration ?? 0)}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Average Edge Duration</div>
          <div className="text-xl">{formatDuration(analytics?.averageEdgeDuration ?? 0)}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Average Time Between Edges</div>
          <div className="text-xl">{formatDuration(analytics?.averageTimeBetweenEdges ?? 0)}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Improvement Rate</div>
          <div className="text-xl">{analytics?.improvementRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 