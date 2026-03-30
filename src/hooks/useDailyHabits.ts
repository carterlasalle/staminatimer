'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useState } from 'react'

type DailyHabitsState = {
  squatDoneDate: string | null
  squatStreak: number
  kegelComboDoneDate: string | null
}

const DAILY_HABITS_STORAGE_KEY = 'program_daily_habits_v1'

const defaultState: DailyHabitsState = {
  squatDoneDate: null,
  squatStreak: 0,
  kegelComboDoneDate: null,
}

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterdayLocalDateString(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return getLocalDateString(date)
}

export function useDailyHabits() {
  const { user } = useAuth()
  const [state, setState] = useState<DailyHabitsState>(defaultState)

  const today = useMemo(() => getLocalDateString(), [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAILY_HABITS_STORAGE_KEY)
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw) as DailyHabitsState
      setState({
        squatDoneDate: parsed.squatDoneDate ?? null,
        squatStreak: Number.isFinite(parsed.squatStreak) ? parsed.squatStreak : 0,
        kegelComboDoneDate: parsed.kegelComboDoneDate ?? null,
      })
    } catch {
      setState(defaultState)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_HABITS_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }, [state])

  const markSquatDone = useCallback(async () => {
    setState((prev) => {
      if (prev.squatDoneDate === today) {
        return prev
      }

      const yesterday = getYesterdayLocalDateString()
      const nextStreak = prev.squatDoneDate === yesterday ? prev.squatStreak + 1 : 1

      const next = {
        ...prev,
        squatDoneDate: today,
        squatStreak: nextStreak,
      }

      if (user) {
        void supabase
          .from('program_progress')
          .update({
            daily_squat_streak: nextStreak,
            last_squat_date: today,
          })
          .eq('user_id', user.id)
      }

      return next
    })
  }, [today, user])

  const markKegelComboDone = useCallback(() => {
    setState((prev) => {
      if (prev.kegelComboDoneDate === today) {
        return prev
      }
      return {
        ...prev,
        kegelComboDoneDate: today,
      }
    })
  }, [today])

  return {
    squatDoneToday: state.squatDoneDate === today,
    squatStreak: state.squatStreak,
    kegelComboDoneToday: state.kegelComboDoneDate === today,
    markSquatDone,
    markKegelComboDone,
  }
}
