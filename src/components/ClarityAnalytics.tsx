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

      // The product states plainly that there is no advertising and no data
      // broker, and `/privacy` discloses Clarity for usage analytics only. Its
      // default consent runs a cross-domain advertising sync (the `c.bing.com`
      // request) that sets third-party cookies. Denying ad storage while keeping
      // analytics makes the behaviour match what the policy already promises,
      // and it is what stops Clarity failing Lighthouse's third-party-cookie
      // audit on a site whose subject matter makes that a real concern.
      Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'granted' })
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
