'use client'

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import { toast } from 'sonner'

export function useAchievements(): { checkAchievements: (session: DBSession) => Promise<void> } {
  const checkAchievements = useCallback(async (session: DBSession) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')

    if (!achievements) return

    // Get user's current achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)

    const unlockedIds = new Set(userAchievements?.map((ua: any) => ua.achievement_id))

    // Get historical sessions for progress calculations
    const { data: historicalSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue

      let progress = 0
      let unlocked = false

      switch (achievement.condition_type) {
        case 'duration':
          progress = Math.round(Math.min(100, (session.total_duration / achievement.condition_value) * 100))
          unlocked = achievement.condition_comparison === 'greater' 
            ? session.total_duration >= achievement.condition_value
            : session.total_duration <= achievement.condition_value
          break

        case 'edge_count': {
          const edgeCount = session.edge_events?.length ?? 0
          progress = achievement.condition_value === 0 
            ? edgeCount === 0 ? 100 : 0
            : Math.round(Math.min(100, (edgeCount / achievement.condition_value) * 100))
          unlocked = edgeCount === achievement.condition_value
          break
        }

        case 'edge_duration': {
          const maxEdgeDuration = Math.max(...(session.edge_events?.map(e => e.duration ?? 0) ?? [0]))
          progress = Math.round(Math.min(100, (achievement.condition_value / maxEdgeDuration) * 100))
          unlocked = achievement.condition_comparison === 'less'
            ? maxEdgeDuration <= achievement.condition_value
            : maxEdgeDuration >= achievement.condition_value
          break
        }

        case 'streak':
          if (historicalSessions) {
            let currentStreak = 0
            for (const s of historicalSessions) {
              if (!s.finished_during_edge) {
                currentStreak++
              } else {
                break
              }
            }
            progress = Math.round(Math.min(100, (currentStreak / achievement.condition_value) * 100))
            unlocked = currentStreak >= achievement.condition_value
          }
          break

        case 'custom': {
          // Get achievement name from the database record
          const achievementName = achievement.name.toLowerCase().replace(/\s+/g, '_')
          switch (achievementName) {
            case 'minimal_pause': {
              const edgeTimePercent = (session.edge_duration / session.total_duration) * 100
              progress = Math.round(Math.min(100, (10 / edgeTimePercent) * 100))
              unlocked = edgeTimePercent <= 10
              break
            }

            case 'straight_through':
              if (session.total_duration >= 900000 && (session.edge_events?.length ?? 0) === 0) {
                progress = 100
                unlocked = true
              }
              break

            case 'getting_stronger':
              if (historicalSessions && historicalSessions.length > 1) {
                const oldAvg = historicalSessions.slice(1).reduce((acc: number, s: any) => acc + s.active_duration, 0) / (historicalSessions.length - 1)
                const improvement = ((session.active_duration - oldAvg) / oldAvg) * 100
                progress = Math.round(Math.min(100, (improvement / 25) * 100))
                unlocked = improvement >= 25
              }
              break
          }
          break
        }
      }

      // Update or create user achievement
      if (progress > 0 || unlocked) {
        const { error } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: unlocked ? 100 : Math.round(progress),
            unlocked_at: unlocked ? new Date().toISOString() : null
          })

        if (error) {
          console.error('Error updating achievement:', error)
          continue
        }

        if (unlocked) {
          toast.success(`Achievement Unlocked: ${achievement.name}!`, {
            description: achievement.description,
            duration: 5000,
          })
        }
      }
    }
  }, [])

  return { checkAchievements }
}