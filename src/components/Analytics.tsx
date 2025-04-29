'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types' // Use consolidated type
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { calculateDetailedAnalytics } from '@/lib/analytics' // Use centralized calculation
import { formatDuration } from '@/lib/utils' // Use utility function
import { Loading } from '@/components/ui/loading'

type Analytics = {
  averageSessionDuration: number
  averageEdgeDuration: number
  averageTimeBetweenEdges: number
  totalSessions: number
  improvementRate: number
}

type AnalyticsProps = {
  externalData?: DBSession[] // Use correct type
}

export function Analytics({ data: externalData }: AnalyticsProps = {}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function calculateAnalytics() {
      try {
        // If external data is provided, use it instead of fetching
        let sessionsToAnalyze: DBSession[];

        if (externalData) {
          sessionsToAnalyze = externalData;
        } else {
          // Fetch data only if externalData is not provided
          const { data: { user } } = await supabase.auth.getUser();
          setLoading(false)
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select(`
            *,
            edge_events!fk_session (*)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20); // Limit for performance

        if (error) {
          console.error('Error fetching analytics data:', error)
          setLoading(false);
          return
        }
        sessionsToAnalyze = sessions as DBSession[];
        }

        // Use centralized calculation function
        const calculatedStats = calculateDetailedAnalytics(sessionsToAnalyze);

        setAnalytics({
          averageSessionDuration: calculatedStats.averageSessionDuration,
          averageEdgeDuration: calculatedStats.averageEdgeDuration,
          averageTimeBetweenEdges: calculatedStats.averageTimeBetweenEdges,
          totalSessions: calculatedStats.totalSessions, // Assuming totalSessions is part of DetailedAnalytics
          improvementRate: calculatedStats.improvementRate
        });
        setLoading(false)
      } catch (err) {
        console.error('Error calculating analytics:', err)
        setLoading(false)
      }
    }

    calculateAnalytics()

    // Only set up polling if we're not using external data
    if (!externalData) {
      // Consider alternatives to polling if possible
      const interval = setInterval(calculateAnalytics, 5000)
      return () => clearInterval(interval)
    }
    // No return needed if externalData is provided, as useEffect runs once
  }, [externalData]) // Depend only on externalData


  if (loading) return <Loading text="Calculating analytics..." className="mt-8" />;

  if (!analytics) return <div className="mt-8 text-center text-muted-foreground">No analytics data available.</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Avg Session Duration</div>
            <div className="text-xl">{formatDuration(analytics.averageSessionDuration)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Edge Duration</div>
            <div className="text-xl">{formatDuration(analytics.averageEdgeDuration)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Time Between Edges</div>
            <div className="text-xl">{formatDuration(analytics.averageTimeBetweenEdges)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Improvement Rate</div>
            <div className={`text-xl ${analytics.improvementRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>{analytics.improvementRate.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}