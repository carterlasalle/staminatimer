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

  // Use UTC dates to avoid timezone issues
  const getUTCDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Get unique dates with successful sessions (not finished during edge)
  const successfulDates = new Set<string>()
  for (const session of sessions) {
    if (!session.finished_during_edge) {
      const dateStr = getUTCDateString(new Date(session.created_at))
      successfulDates.add(dateStr)
    }
  }

  if (successfulDates.size === 0) return 0

  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(successfulDates).sort().reverse()

  // Check if the most recent successful session is today or yesterday
  // to allow a grace period for maintaining the streak
  const today = getUTCDateString(new Date())
  const yesterday = getUTCDateString(new Date(Date.now() - 86400000))

  const mostRecent = sortedDates[0]
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0 // Streak is broken - no activity in the grace period
  }

  // Count consecutive days starting from the most recent session
  let streak = 0
  let expectedDate = new Date(mostRecent + 'T00:00:00Z')

  for (const dateStr of sortedDates) {
    const expectedDateStr = getUTCDateString(expectedDate)

    if (dateStr === expectedDateStr) {
      streak++
      // Move to previous day
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1)
    } else if (dateStr < expectedDateStr) {
      // Gap in dates - streak is broken
      break
    } else {
      // dateStr > expectedDateStr: date is newer than expected
      // This indicates data inconsistency or sorting issue
      console.error(`Unexpected date order in streak calculation: ${dateStr} > ${expectedDateStr}`)
      break
    }
  }

  return streak
}

