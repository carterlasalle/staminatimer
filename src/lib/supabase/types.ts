export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          start_time: string
          end_time: string
          total_duration: number
          active_duration: number
          edge_duration: number
          finished_during_edge: boolean
          created_at: string
        }
        Insert: {
          id?: string
          start_time: string
          end_time?: string
          total_duration?: number
          active_duration?: number
          edge_duration?: number
          finished_during_edge?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          start_time?: string
          end_time?: string
          total_duration?: number
          active_duration?: number
          edge_duration?: number
          finished_during_edge?: boolean
          created_at?: string
        }
      }
      edge_events: {
        Row: {
          id: string
          session_id: string
          start_time: string
          end_time: string
          duration: number
        }
        Insert: {
          id?: string
          session_id: string
          start_time: string
          end_time?: string
          duration?: number
        }
        Update: {
          id?: string
          session_id?: string
          start_time?: string
          end_time?: string
          duration?: number
        }
      }
    }
  }
} 