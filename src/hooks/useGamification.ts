'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGlobal } from '@/contexts/GlobalContext'
import type { UserAchievement } from '@/lib/types/achievements'
import type { DBSession } from '@/lib/types'

export function useGamification() {
  const { recentSessions } = useGlobal()
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUserAchievements([])
          return
        }
        const { data } = await supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', user.id)
        setUserAchievements((data as UserAchievement[]) || [])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const points = useMemo(() => {
    return userAchievements.reduce((acc, ua) => acc + (ua.progress === 100 ? (ua.achievement.points || 0) : 0), 0)
  }, [userAchievements])

  const level = useMemo(() => {
    // Simple level curve: 100 XP per level
    const lvl = Math.floor(points / 100) + 1
    const currentLevelXp = points % 100
    const progressPct = Math.min(100, Math.round((currentLevelXp / 100) * 100))
    return { level: lvl, progressPct, currentLevelXp }
  }, [points])

  const streakCount = useMemo(() => computeStreak(recentSessions), [recentSessions])

  return { loading, userAchievements, points, level, streakCount }
}

function computeStreak(sessions: DBSession[]): number {
  if (!sessions.length) return 0
  
  // Group sessions by date and filter successful ones
  const successfulSessionsByDate = new Map<string, boolean>()
  
  for (const session of sessions) {
    if (!session.finished_during_edge) {
      const dateKey = new Date(session.created_at).toDateString()
      successfulSessionsByDate.set(dateKey, true)
    }
  }
  
  if (successfulSessionsByDate.size === 0) return 0
  
  // Find the most recent session date
  const sortedDates = Array.from(successfulSessionsByDate.keys())
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  const startDate = new Date(sortedDates[0]) // Start from most recent successful session
  
  // Count consecutive days backwards from most recent session
  for (let i = 0; i < successfulSessionsByDate.size; i++) {
    const checkDate = new Date(startDate)
    checkDate.setDate(startDate.getDate() - i)
    
    if (successfulSessionsByDate.has(checkDate.toDateString())) {
      streak++
    } else {
      break // Streak is broken
    }
  }
  
  return streak
}

