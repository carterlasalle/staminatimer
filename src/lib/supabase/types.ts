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
          total_duration: number
          active_duration: number
          edge_duration: number
          finished_during_edge: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time?: string | null
          total_duration?: number
          active_duration?: number
          edge_duration?: number
          finished_during_edge?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          total_duration?: number
          active_duration?: number
          edge_duration?: number
          finished_during_edge?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "fk_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          icon: string | null
          condition_type: string
          condition_value: number
          condition_comparison: string | null
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          icon?: string | null
          condition_type: string
          condition_value: number
          condition_comparison?: string | null
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          icon?: string | null
          condition_type?: string
          condition_value?: number
          condition_comparison?: string | null
          points?: number
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: number
          unlocked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: number
          unlocked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: number
          unlocked_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_sessions: {
        Row: {
          id: string
          sessions_data: Json
          expires_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sessions_data: Json
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sessions_data?: Json
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      global_stats: {
        Row: {
          id: string
          active_users_count: number
          total_sessions_count: number
          last_updated: string
        }
        Insert: {
          id?: string
          active_users_count?: number
          total_sessions_count?: number
          last_updated?: string
        }
        Update: {
          id?: string
          active_users_count?: number
          total_sessions_count?: number
          last_updated?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
