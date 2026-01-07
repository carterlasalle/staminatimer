'use client'

import { useState, useCallback } from 'react'
import { generateAIResponse } from '@/lib/gemini'
import { useGlobal } from '@/contexts/GlobalContext'
import { useGamification } from '@/hooks/useGamification'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { DBSession } from '@/lib/types'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useAICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { recentSessions } = useGlobal()
  const { userAchievements, points, level, streakCount } = useGamification()
  const { analytics } = useAnalytics()

  const generateComprehensivePrompt = useCallback((userMessage: string) => {
    // Calculate advanced analytics from sessions
    const sessionStats = calculateAdvancedStats(recentSessions)
    
    return `You are a performance coach specializing in sexual stamina training. Analyze the provided training data and deliver practical, actionable insights.

## USER DATA SUMMARY

**Training Metrics:**
- Sessions Completed: ${analytics?.totalSessions || 0}
- Current Level: ${level.level} (${points} points, ${level.currentLevelXp}/100 to next level)
- Current Streak: ${streakCount} days
- Achievements: ${userAchievements.filter(ua => ua.progress === 100).length}/${userAchievements.length} unlocked

**Recent Session Analysis:**
${recentSessions.slice(0, 8).map((session, i) => `
${i + 1}. ${new Date(session.created_at).toLocaleDateString()} - ${Math.round((session.total_duration || 0) / 60000)}m ${Math.round(((session.total_duration || 0) % 60000) / 1000)}s | ${session.edge_events?.length || 0} edges | ${!session.finished_during_edge ? 'Success' : 'Edge finish'}`).join('')}

**Performance Analytics:**
- Average Duration: ${sessionStats.avgDuration}
- Success Rate: ${sessionStats.successRate}%
- Training Frequency: ${sessionStats.frequency}
- Current Trend: ${sessionStats.controlTrend}
- Edge Control: ${sessionStats.edgeManagement}
- Consistency: ${sessionStats.consistencyScore}%

**Identified Patterns:**
${sessionStats.patterns}

## COACHING INSTRUCTIONS

Provide analysis that is:
- **Direct and actionable** - No fluff, focus on what needs to be done
- **Data-driven** - Base recommendations on the specific patterns you see in their data
- **Progressive** - Give them the next logical step based on current performance
- **Measurable** - Include specific targets and timeframes

Structure your response as:
1. **Current Status** (1-2 sentences on where they are now)
2. **Key Findings** (2-3 main insights from their data)  
3. **Action Plan** (Specific recommendations with clear steps)
4. **Training Protocol** (Concrete exercises/techniques for their level)
5. **Goals** (Measurable targets for next 2 weeks)

Keep language professional and coaching-focused. Avoid overly clinical or overly casual tone.

**User Question:** "${userMessage}"

**Your Analysis:**`
  }, [recentSessions, analytics, userAchievements, points, level, streakCount])

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const prompt = generateComprehensivePrompt(userMessage)
      const response = await generateAIResponse(prompt)
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (error: unknown) {
      let errorContent = 'I apologize, but I encountered an error while analyzing your data. Please try again.'
      const errorMessage = error instanceof Error ? error.message : ''

      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        errorContent = '⚠️ **API Rate Limit Exceeded**\n\nI\'ve hit the rate limit for requests. Please wait a moment and try again. The free tier has limited requests per minute.\n\n*Tip: Try asking simpler questions to use fewer tokens per request.*'
      } else if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        errorContent = '🔑 **API Authentication Issue**\n\nThere seems to be an issue with the API configuration. Please contact support if this persists.'
      }
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [generateComprehensivePrompt])

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  const generateInitialInsights = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const prompt = generateComprehensivePrompt("Please analyze my complete training data and provide a comprehensive performance assessment with personalized recommendations for improvement. I want to understand my progress patterns, areas for improvement, and get specific next steps for advancing my stamina training.")
      const response = await generateAIResponse(prompt)
      
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages([assistantMsg])
    } catch (error: unknown) {
      let errorContent = 'I encountered an error while analyzing your training data. Please try again.'
      const errorMessage = error instanceof Error ? error.message : ''

      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        errorContent = '⚠️ **API Rate Limit Exceeded**\n\nI\'ve hit the rate limit for analyzing your complete training data. Please wait a moment and try again, or ask a more specific question to use fewer API tokens.'
      }
      
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages([errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [generateComprehensivePrompt])

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    generateInitialInsights
  }
}

function calculateAdvancedStats(sessions: DBSession[]) {
  if (!sessions.length) {
    return {
      avgDuration: '0m 0s',
      successRate: 0,
      controlTrend: 'No data available',
      edgeManagement: 'No data available',
      consistencyScore: 0,
      progression: 'Beginning journey',
      peakSessions: 0,
      frequency: 'No sessions recorded',
      performanceComparison: 'Insufficient data',
      patterns: 'Insufficient data for pattern analysis. Complete more training sessions for detailed insights.'
    }
  }

  // Calculate average duration
  const avgDurationMs = sessions.reduce((acc, s) => acc + (s.total_duration || 0), 0) / sessions.length
  const avgMinutes = Math.floor(avgDurationMs / 60000)
  const avgSeconds = Math.floor((avgDurationMs % 60000) / 1000)

  // Calculate success rate (sessions that didn't finish during edge)
  const successfulSessions = sessions.filter(s => !s.finished_during_edge).length
  const successRate = Math.round((successfulSessions / sessions.length) * 100)

  // Calculate control trend (recent 3 vs previous 3)
  const recentThree = sessions.slice(0, 3)
  const previousThree = sessions.slice(3, 6)
  
  let controlTrend = 'Stable'
  if (recentThree.length >= 3 && previousThree.length >= 3) {
    const recentSuccess = recentThree.filter(s => !s.finished_during_edge).length
    const previousSuccess = previousThree.filter(s => !s.finished_during_edge).length
    
    if (recentSuccess > previousSuccess) controlTrend = 'Improving'
    else if (recentSuccess < previousSuccess) controlTrend = 'Declining'
  }

  // Edge management analysis
  const avgEdgeTime = sessions.reduce((acc, s) => acc + (s.edge_duration || 0), 0) / sessions.length / 1000
  let edgeManagement = 'Developing'
  if (avgEdgeTime < 30) edgeManagement = 'Excellent edge control'
  else if (avgEdgeTime < 60) edgeManagement = 'Good edge management'
  else if (avgEdgeTime < 120) edgeManagement = 'Moderate edge control'
  else edgeManagement = 'Needs improvement in edge management'

  // Consistency score (how regular are training sessions)
  const daysBetweenSessions = []
  for (let i = 0; i < sessions.length - 1; i++) {
    const diff = new Date(sessions[i].created_at).getTime() - new Date(sessions[i + 1].created_at).getTime()
    daysBetweenSessions.push(Math.floor(diff / (1000 * 60 * 60 * 24)))
  }
  const avgDaysBetween = daysBetweenSessions.reduce((acc, days) => acc + days, 0) / daysBetweenSessions.length
  let consistencyScore = 100
  if (avgDaysBetween > 7) consistencyScore = 30
  else if (avgDaysBetween > 3) consistencyScore = 60
  else if (avgDaysBetween > 1) consistencyScore = 85

  // Performance progression
  let progression = 'Building foundation'
  if (sessions.length > 20 && successRate > 80) progression = 'Advanced performer'
  else if (sessions.length > 10 && successRate > 70) progression = 'Intermediate level'
  else if (sessions.length > 5 && successRate > 50) progression = 'Developing control'

  // Peak performance sessions
  const peakSessions = sessions.filter(s => 
    (s.total_duration || 0) > avgDurationMs * 1.5 && !s.finished_during_edge
  ).length

  // Training frequency
  const firstSession = new Date(sessions[sessions.length - 1].created_at)
  const lastSession = new Date(sessions[0].created_at)
  const totalDays = Math.ceil((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24))
  const sessionsPerWeek = totalDays > 0 ? Math.round((sessions.length / totalDays) * 7 * 10) / 10 : 0

  // Pattern analysis
  const patterns = []
  if (successRate < 50) patterns.push('Pattern: Frequent edge finishes indicate need for enhanced edge recognition and control techniques')
  if (avgEdgeTime > 90) patterns.push('Pattern: Extended edge periods suggest need for breathing and mindfulness technique refinement')
  if (consistencyScore < 60) patterns.push('Pattern: Irregular training frequency may be limiting progress - consistency is key for neuroplasticity development')
  if (sessions.some(s => (s.edge_events?.length || 0) > 5)) patterns.push('Pattern: High number of edge events in some sessions indicate good awareness but may suggest training intensity adjustments needed')
  
  return {
    avgDuration: `${avgMinutes}m ${avgSeconds}s`,
    successRate,
    controlTrend,
    edgeManagement,
    consistencyScore: Math.round(consistencyScore),
    progression,
    peakSessions,
    frequency: `${sessionsPerWeek} sessions/week`,
    performanceComparison: recentThree.length >= 3 ? `Recent performance: ${Math.round((recentThree.filter(s => !s.finished_during_edge).length / 3) * 100)}% success rate` : 'Need more sessions for comparison',
    patterns: patterns.length > 0 ? patterns.join('\n') : 'Positive training patterns emerging. Continue current approach with focus on consistency.'
  }
}