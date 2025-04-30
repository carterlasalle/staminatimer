import type { DBSession } from './types'

export type DetailedAnalytics = {
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

  // Handle potential null/undefined values
  const validSessions = sessions.filter(s => 
    typeof s.total_duration === 'number' && 
    typeof s.edge_duration === 'number'
  )

  if (!validSessions.length) return {
    averageSessionDuration: 0,
    averageEdgeDuration: 0,
    averageTimeBetweenEdges: 0,
    averageEdgesPerSession: 0,
    longestSession: 0,
    shortestSession: 0,
    successRate: 0,
    totalSessions: sessions.length,
    totalEdges,
    improvementRate: 0,
    streakCount
  }

  return {
    averageSessionDuration: validSessions.reduce((acc, s) => acc + s.total_duration, 0) / validSessions.length,
    averageEdgeDuration: validSessions.reduce((acc, s) => acc + s.edge_duration, 0) / totalEdges,
    averageTimeBetweenEdges: calculateAverageTimeBetweenEdges(validSessions),
    averageEdgesPerSession: totalEdges / validSessions.length,
    longestSession: Math.max(...validSessions.map(s => s.total_duration)),
    shortestSession: Math.min(...validSessions.map(s => s.total_duration)),
    successRate: (successfulSessions.length / sessions.length) * 100,
    totalSessions: sessions.length,
    totalEdges,
    improvementRate: calculateImprovementRate(validSessions),
    streakCount
  }
}

function calculateAverageTimeBetweenEdges(sessions: DBSession[]): number {
  let totalTime = 0
  let count = 0

  sessions.forEach(session => {
    const events = session.edge_events ?? []
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i-1]
      const currEvent = events[i]
      // Only calculate if both timestamps exist
      if (prevEvent.end_time && currEvent.start_time) {
        const endTime = new Date(prevEvent.end_time).getTime()
        const startTime = new Date(currEvent.start_time).getTime()
        if (!isNaN(endTime) && !isNaN(startTime)) {
          totalTime += startTime - endTime
          count++
        }
      }
    }
  })

  return count > 0 ? totalTime / count : 0
}

function calculateImprovementRate(sessions: DBSession[]): number {
  // Need at least 6 sessions to compare two groups of 3
  if (sessions.length < 6) return 0
  
  // Assumes sessions are sorted newest first
  const recent3Sessions = sessions.slice(0, 3)
  const previous3Sessions = sessions.slice(3, 6)
  
  // Calculate average total duration for recent 3 sessions
  const recentAvgDuration = recent3Sessions.reduce((acc, s) => acc + (s.total_duration ?? 0), 0) / recent3Sessions.length

  // Calculate average total duration for previous 3 sessions
  const previousAvgDuration = previous3Sessions.reduce((acc, s) => acc + (s.total_duration ?? 0), 0) / previous3Sessions.length

  // Prevent division by zero if the previous average is 0
  if (previousAvgDuration === 0) return 0 // Cannot calculate percentage change from zero

  // Calculate percentage improvement in average duration
  const durationImprovement = ((recentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100

  // Return the percentage change, rounded to one decimal place
  // A positive value means recent sessions are longer on average than the previous ones.
  return parseFloat(durationImprovement.toFixed(1))
} 