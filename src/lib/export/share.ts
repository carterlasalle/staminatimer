import { supabase } from '@/lib/supabase/client'

export async function generateShareableLink(sessions: any[]) {
  // Create a temporary share record in Supabase
  const { data, error } = await supabase
    .from('shared_sessions')
    .insert({
      sessions_data: sessions,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
    })
    .select('id')
    .single()

  if (error) throw error

  // Return shareable link
  return `${window.location.origin}/share/${data.id}`
} 