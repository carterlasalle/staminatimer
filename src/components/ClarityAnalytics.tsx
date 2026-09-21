'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef } from 'react'

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
const CLARITY_ENABLED = Boolean(CLARITY_PROJECT_ID) && process.env.NODE_ENV === 'production'

/**
 * Optional session analytics.
 *
 * Identity comes from `AuthContext` rather than a direct `supabase.auth.getUser()`
 * call: that call was one of several concurrent auth reads competing for the same
 * navigator lock on every page load, and each one cost a round trip to the auth
 * server. There is one source of auth state in this app, so this consumes it.
 */
export function ClarityAnalytics() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (!CLARITY_ENABLED || !user?.id) {
      return
    }

    let cancelled = false

    const identify = async () => {
      const { default: Clarity } = await import('@microsoft/clarity')
      if (!cancelled) {
        // Clarity hashes whatever it is given; we pass the opaque auth id, never
        // an email or any training content.
        Clarity.identify(user.id)
      }
    }

    void identify()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  return null
}
