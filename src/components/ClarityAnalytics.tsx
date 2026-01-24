'use client'

import { useEffect, useRef } from 'react'

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

export function ClarityAnalytics() {
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize in production with a valid project ID
    if (!CLARITY_PROJECT_ID || process.env.NODE_ENV !== 'production') {
      return
    }

    // Prevent double initialization
    if (initialized.current) return
    initialized.current = true

    // Defer Clarity initialization until after page is interactive
    // This prevents blocking the main thread during initial render
    const initClarity = async () => {
      // Dynamically import Clarity and Supabase only when needed
      const [{ default: Clarity }, { supabase }] = await Promise.all([
        import('@microsoft/clarity'),
        import('@/lib/supabase/client'),
      ])

      // Initialize Clarity
      Clarity.init(CLARITY_PROJECT_ID)

      // Identify user if logged in (without exposing PII)
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        // Use hashed user ID for privacy - Clarity will hash this again
        Clarity.identify(user.id)
      }

      // Listen for auth changes to update identity
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.id) {
          Clarity.identify(session.user.id)
        }
      })
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    // This ensures Clarity loads after the main thread is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initClarity(), { timeout: 3000 })
    } else {
      setTimeout(initClarity, 2000)
    }
  }, [])

  // This component doesn't render anything
  return null
}
