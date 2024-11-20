import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'

export class DatabaseService {
  private static instance: DatabaseService

  private constructor() {}

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async getSessions(userId: string) {
    return await supabase
      .from('sessions')
      .select(`
        *,
        edge_events (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  }

  async createSession(data: Partial<DBSession>) {
    return await supabase
      .from('sessions')
      .insert(data)
      .select()
      .single()
  }

  async updateSession(id: string, data: Partial<DBSession>) {
    return await supabase
      .from('sessions')
      .update(data)
      .eq('id', id)
  }

  async deleteSession(id: string) {
    return await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
  }

  async getSharedSession(shareId: string) {
    return await supabase
      .from('shared_sessions')
      .select('sessions_data')
      .eq('id', shareId)
      .single()
  }

  async createSharedSession(data: any, expiresAt: string | null) {
    return await supabase
      .from('shared_sessions')
      .insert({
        sessions_data: data,
        expires_at: expiresAt,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select('id')
      .single()
  }
} 