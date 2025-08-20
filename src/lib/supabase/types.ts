export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          total_duration: number | null
          active_duration: number | null
          edge_duration: number | null
          finished_during_edge: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time?: string | null
          total_duration?: number | null
          active_duration?: number | null
          edge_duration?: number | null
          finished_during_edge?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          total_duration?: number | null
          active_duration?: number | null
          edge_duration?: number | null
          finished_during_edge?: boolean
          created_at?: string
        }
      }
      edge_events: {
        Row: {
          id: string
          session_id: string
          start_time: string
          end_time: string | null
          duration: number | null
        }
        Insert: {
          id?: string
          session_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
        }
        Update: {
          id?: string
          session_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
        }
      }
    }
  }
} 
