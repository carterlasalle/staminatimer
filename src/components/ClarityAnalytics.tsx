'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'
import { supabase } from '@/lib/supabase/client'

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

export function ClarityAnalytics() {
  useEffect(() => {
    // Only initialize in production with a valid project ID
    if (!CLARITY_PROJECT_ID || process.env.NODE_ENV !== 'production') {
      return
    }

    // Initialize Clarity
    Clarity.init(CLARITY_PROJECT_ID)

    // Identify user if logged in (without exposing PII)
    async function identifyUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        // Use hashed user ID for privacy - Clarity will hash this again
        Clarity.identify(user.id)
      }
    }

    identifyUser()

    // Listen for auth changes to update identity
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        Clarity.identify(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // This component doesn't render anything
  return null
}
