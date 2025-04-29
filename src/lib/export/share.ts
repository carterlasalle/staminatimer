import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'

type ShareDuration = '1h' | '24h' | '7d' | '30d' | 'infinite'

const durationMap = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'infinite': null
}

export async function generateShareableLink(sessions: DBSession[], duration: ShareDuration): Promise<string> {
  const expiresAt = durationMap[duration] 
    ? new Date(Date.now() + durationMap[duration]!).toISOString()
    : null

  // Create a temporary share record in Supabase
  const { data, error } = await supabase
    .from('shared_sessions')
    .insert({
      sessions_data: sessions,
      expires_at: expiresAt,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select('id')
    .single()

  if (error) throw error

  // Return shareable link
  return `${window.location.origin}/share/${data.id}`
} 