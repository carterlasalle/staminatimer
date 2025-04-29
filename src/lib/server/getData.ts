import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { DBSession } from '@/lib/types'

export async function getSessionData() {
  const cookieStore = await cookies() // cookies() is async

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Server Components cannot set cookies. Middleware handles session refresh.
          // This empty catcher is needed as per @supabase/ssr docs for server components.
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      edge_events (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching session data:", error.message)
    return null
  }
  return data as DBSession[]
}

export async function generateShareableLink(sessions: DBSession[], duration: ShareDuration) {
  const expiresAt = durationMap[duration] 
    ? new Date(Date.now() + durationMap[duration]!).toISOString()
    : null

  const { data, error } = await supabase
    .from('shared_sessions')
    .insert({
      sessions_data: sessions,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw error
  return data
}