'use client'

import { useEffect, useRef } from 'react'

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

export const CLARITY_ENABLED = Boolean(CLARITY_PROJECT_ID) && process.env.NODE_ENV === 'production'

/**
 * Optional session analytics.
 *
 * This deliberately has no auth dependency. It used to read `AuthContext` to
 * call `Clarity.identify()`, which meant `AuthProvider` — and with it
 * `supabase-js` — had to be mounted in the root layout, putting ~85-100 KiB of
 * application JavaScript on every marketing and guide page for the sake of one
 * telemetry call. Identity now lives in `ClarityIdentify`, which is mounted in
 * the application layout where a session actually exists. Recordings on public
 * pages stay anonymous.
 */
export function ClarityAnalytics() {
  const initialized = useRef(false)

  useEffect(() => {
    const projectId = CLARITY_PROJECT_ID

    if (!CLARITY_ENABLED || !projectId || initialized.current) {
      return
    }
    initialized.current = true

    const loadClarity = async () => {
      const { default: Clarity } = await import('@microsoft/clarity')
      Clarity.init(projectId)
    }

    // Load after the page is interactive so it never competes with first paint.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => void loadClarity(), { timeout: 3000 })
    } else {
      setTimeout(() => void loadClarity(), 2000)
    }
  }, [])

  return null
}
