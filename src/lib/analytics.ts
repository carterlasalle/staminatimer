import type { DBSession } from './types'

export interface DetailedAnalytics {
  averageSessionDuration: number
  averageEdgeDuration: number
  averageTimeBetweenEdges: number
  averageEdgesPerSession: number
  longestSession: number
  shortestSession: number
  successRate: number
  totalSessions: number
  totalEdges: number
  improvementRate: number
  streakCount: number
}

export function calculateDetailedAnalytics(sessions: DBSession[]): DetailedAnalytics {
  if (!sessions.length) {
    return {
      averageSessionDuration: 0,
      averageEdgeDuration: 0,
      averageTimeBetweenEdges: 0,
      averageEdgesPerSession: 0,
      longestSession: 0,
      shortestSession: 0,
      successRate: 0,
      totalSessions: 0,
      totalEdges: 0,
      improvementRate: 0,
      streakCount: 0
    }
  }

  const totalEdges = sessions.reduce((acc, s) => acc + (s.edge_events?.length ?? 0), 0)
  const successfulSessions = sessions.filter(s => !s.finished_during_edge)
  
  // Calculate current streak
  let streakCount = 0
  for (let i = 0; i < sessions.length; i++) {
    if (!sessions[i].finished_during_edge) {
      streakCount++
    } else {
      break
    }
  }

  return {
    averageSessionDuration: sessions.reduce((acc, s) => acc + s.total_duration, 0) / sessions.length,
    averageEdgeDuration: sessions.reduce((acc, s) => acc + s.edge_duration, 0) / totalEdges,
    averageTimeBetweenEdges: calculateAverageTimeBetweenEdges(sessions),
    averageEdgesPerSession: totalEdges / sessions.length,
    longestSession: Math.max(...sessions.map(s => s.total_duration)),
    shortestSession: Math.min(...sessions.map(s => s.total_duration)),
    successRate: (successfulSessions.length / sessions.length) * 100,
    totalSessions: sessions.length,
    totalEdges,
    improvementRate: calculateImprovementRate(sessions),
    streakCount
  }
}

function calculateAverageTimeBetweenEdges(sessions: DBSession[]): number {
  let totalTime = 0
  let count = 0

  sessions.forEach(session => {
    const events = session.edge_events ?? []
    for (let i = 1; i < events.length; i++) {
      if (events[i-1].end_time && events[i].start_time) {
        totalTime += new Date(events[i].start_time).getTime() - 
                    new Date(events[i-1].end_time).getTime()
        count++
      }
    }
  })

  return count > 0 ? totalTime / count : 0
}

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