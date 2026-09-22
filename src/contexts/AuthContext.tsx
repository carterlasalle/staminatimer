'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set once the auth server has spoken; the stored session must never
    // overwrite a validated answer with a stale one.
    let validated = false

    // The stored session is a local read, so a user id is available on the first
    // tick. Actions that need one — starting a timer session, saving one — must
    // not be blocked behind a network round-trip, and someone who just landed on
    // a page should not be told they are signed out.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (validated) return

      // Keep the previous object when it is the same user: a new reference here
      // would re-run every `[user]`-dependent effect after the validated call
      // below and double every data fetch on the page.
      setUser((prev) => (prev?.id === session?.user?.id ? prev : (session?.user ?? null)))
      setLoading(false)
    })

    // `getUser()` asks the auth server to validate that session, replacing the
    // optimistic value above if the token is expired or revoked. This is the
    // app's one validated auth call — thirteen components used to make their
    // own, and because each awaited its own round-trip they ran in series and
    // dominated every authenticated page load.
    supabase.auth.getUser().then(({ data: { user } }) => {
      validated = true
      setUser((prev) => (prev?.id === user?.id ? prev : (user ?? null)))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // `INITIAL_SESSION` carries the unvalidated stored session, which would
      // race the validated result above. Real transitions update immediately.
      if (event === 'INITIAL_SESSION') return

      validated = true
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // `loading` starts true and effects do not run while rendering on the server,
  // so gating `children` on it left every page with an empty <body>: no content
  // for crawlers, and nothing for non-JS agents to read. Route protection is
  // already enforced by the middleware, so there is nothing to withhold here.
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
