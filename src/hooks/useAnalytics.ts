'use client'

import { useMemo } from 'react'
import { useGlobal } from '@/contexts/GlobalContext'
import { calculateDetailedAnalytics } from '@/lib/analytics'
import type { DetailedAnalytics } from '@/lib/analytics'
import type { DBSession } from '@/lib/types'

/**
 * Session statistics derived from the sessions `GlobalProvider` already fetched.
 *
 * This used to run its own `select * from sessions ... limit 20` with no
 * `user_id` filter and no auth check, relying entirely on row-level security
 * to scope it. That was safe — RLS is the real boundary — but it duplicated an
 * identical query on every page that also reads `recentSessions`, and it meant
 * a page could show statistics computed from a different snapshot than the
 * lists beside them. `GlobalContext` already filters by `user_id` as well as
 * relying on RLS, so this is strictly more defensive and always consistent.
 */
export function useAnalytics(): {
  analytics: DetailedAnalytics | null
  loading: boolean
  error: Error | null
} {
  const { recentSessions, loading, error } = useGlobal()

  const analytics = useMemo(
    () => (loading ? null : calculateDetailedAnalytics(recentSessions as DBSession[])),
    [recentSessions, loading]
  )

  return { analytics, loading, error }
}
