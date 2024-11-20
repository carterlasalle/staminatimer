import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'

export class AnalyticsService {
  private static instance: AnalyticsService

  private constructor() {}

  static getInstance() {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  async calculateSessionStats(userId: string) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*, edge_events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!sessions) return null

    return {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((acc, s) => acc + (s.total_duration ?? 0), 0),
      averageSessionDuration: sessions.reduce((acc, s) => acc + (s.total_duration ?? 0), 0) / sessions.length,
      totalEdges: sessions.reduce((acc, s) => acc + (s.edge_events?.length ?? 0), 0),
      averageEdgesPerSession: sessions.reduce((acc, s) => acc + (s.edge_events?.length ?? 0), 0) / sessions.length,
      successRate: (sessions.filter(s => !s.finished_during_edge).length / sessions.length) * 100,
      improvementRate: this.calculateImprovementRate(sessions),
    }
  }

  private calculateImprovementRate(sessions: DBSession[]) {
    if (sessions.length < 2) return 0
    
    const recentSessions = sessions.slice(0, 5)
    const olderSessions = sessions.slice(-5)
    
    const recentAvg = recentSessions.reduce((acc, s) => acc + s.total_duration, 0) / recentSessions.length
    const olderAvg = olderSessions.reduce((acc, s) => acc + s.total_duration, 0) / olderSessions.length
    
    return ((recentAvg - olderAvg) / olderAvg) * 100
  }
} 