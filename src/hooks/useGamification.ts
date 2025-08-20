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
  // Assumes sessions are sorted newest first in state
  let streak = 0
  for (const s of sessions) {
    if (!s.finished_during_edge) streak++
    else break
  }
  return streak
}

