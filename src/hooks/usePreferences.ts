'use client'

import { useEffect, useState } from 'react'

const KEY = 'stamina.preferences'

type Preferences = {
  dailyGoalMinutes: number
}

const defaultPrefs: Preferences = {
  dailyGoalMinutes: 20,
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs])

  return {
    prefs,
    setDailyGoalMinutes(mins: number) {
      setPrefs((p) => ({ ...p, dailyGoalMinutes: Math.max(5, Math.min(240, Math.round(mins))) }))
    },
  }
}

