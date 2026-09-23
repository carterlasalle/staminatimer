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
    let active = true

    // The browser client initializes itself. `INITIAL_SESSION` is the one
    // authoritative read of its persisted session, so issuing `getSession()`
    // and `getUser()` alongside it only contends for GoTrue's storage lock.
    // Subsequent server-validated changes arrive through the same subscription.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return
      setUser((previous) =>
        previous?.id === session?.user?.id ? previous : (session?.user ?? null)
      )
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // `loading` starts true and effects do not run while rendering on the server,
  // so gating `children` on it left every page with an empty <body>: no content
  // for crawlers, and nothing for non-JS agents to read. Route protection is
  // already enforced by the middleware, so there is nothing to withhold here.
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
