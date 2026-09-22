'use client'

import { CLARITY_ENABLED, CLARITY_PROJECT_ID } from '@/components/ClarityAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

/**
 * Clarity's snippet installs `window.clarity` as a queue stub that buffers calls
 * until the real script loads. Declaring it here keeps the readiness check typed
 * instead of asserting a shape onto `window`.
 */
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
  }
}

/**
 * Links a Clarity recording to the signed-in user's opaque auth id, so a
 * reported problem can be found in a recording.
 *
 * This lives in the application layout rather than the analytics component in
 * the root layout, because the identity only exists when there is a session. The
 * root component is mounted on marketing pages too, and reading auth state there
 * meant `AuthProvider` — and with it `supabase-js` — had to load on every public
 * page for the benefit of a single telemetry call.
 *
 * Only the opaque auth id is sent; never an email, and never anything about a
 * session. Clarity hashes whatever it is given.
 */
export function ClarityIdentify() {
  const { user } = useAuth()

  useEffect(() => {
    if (!CLARITY_ENABLED || !CLARITY_PROJECT_ID || !user?.id) return

    let cancelled = false

    void (async () => {
      const { default: Clarity } = await import('@microsoft/clarity')

      if (cancelled) return

      // `identify` forwards straight to `window.clarity(...)`, and that stub only
      // exists once `init` has run — calling it first throws. `injectScript`
      // returns early when its tag is already present, so this is idempotent and
      // only backfills the stub when the root layout has not reached its idle
      // callback yet.
      if (!('clarity' in window)) {
        Clarity.init(CLARITY_PROJECT_ID)
      }

      Clarity.identify(user.id)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  return null
}
