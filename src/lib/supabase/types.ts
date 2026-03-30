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
      program_sessions: {
        Row: {
          id: string
          user_id: string
          phase: number
          session_number_in_phase: number
          started_at: string
          completed_at: string | null
          duration_ms: number | null
          cycles_completed: number | null
          complete_stops: number | null
          time_in_zone_ms: number | null
          highest_arousal_reached: number | null
          accidentally_finished: boolean | null
          ended_early: boolean | null
          self_rating: number | null
          breathing_maintained: 'yes' | 'mostly' | 'no' | null
          imagery_rating: number | null
          positions_used: string[] | null
          notes: string | null
          lube_used: boolean | null
          toy_used: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phase: number
          session_number_in_phase?: number
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
          cycles_completed?: number | null
          complete_stops?: number | null
          time_in_zone_ms?: number | null
          highest_arousal_reached?: number | null
          accidentally_finished?: boolean | null
          ended_early?: boolean | null
          self_rating?: number | null
          breathing_maintained?: 'yes' | 'mostly' | 'no' | null
          imagery_rating?: number | null
          positions_used?: string[] | null
          notes?: string | null
          lube_used?: boolean | null
          toy_used?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phase?: number
          session_number_in_phase?: number
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
          cycles_completed?: number | null
          complete_stops?: number | null
          time_in_zone_ms?: number | null
          highest_arousal_reached?: number | null
          accidentally_finished?: boolean | null
          ended_early?: boolean | null
          self_rating?: number | null
          breathing_maintained?: 'yes' | 'mostly' | 'no' | null
          imagery_rating?: number | null
          positions_used?: string[] | null
          notes?: string | null
          lube_used?: boolean | null
          toy_used?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      program_progress: {
        Row: {
          id: string
          user_id: string
          current_phase: number | null
          sessions_in_current_phase: number | null
          qualifying_sessions_in_phase: number | null
          total_sessions: number | null
          sessions_since_ejaculation: number | null
          last_ejaculation_session: number | null
          last_session_at: string | null
          phase_started_at: string | null
          program_started_at: string | null
          phase_8_entered_at: string | null
          daily_squat_streak: number | null
          last_squat_date: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          current_phase?: number | null
          sessions_in_current_phase?: number | null
          qualifying_sessions_in_phase?: number | null
          total_sessions?: number | null
          sessions_since_ejaculation?: number | null
          last_ejaculation_session?: number | null
          last_session_at?: string | null
          phase_started_at?: string | null
          program_started_at?: string | null
          phase_8_entered_at?: string | null
          daily_squat_streak?: number | null
          last_squat_date?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          current_phase?: number | null
          sessions_in_current_phase?: number | null
          qualifying_sessions_in_phase?: number | null
          total_sessions?: number | null
          sessions_since_ejaculation?: number | null
          last_ejaculation_session?: number | null
          last_session_at?: string | null
          phase_started_at?: string | null
          program_started_at?: string | null
          phase_8_entered_at?: string | null
          daily_squat_streak?: number | null
          last_squat_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_program_session: {
        Args: {
          p_started_at: string
          p_completed_at: string
          p_duration_ms: number
          p_cycles_completed: number
          p_complete_stops: number
          p_time_in_zone_ms: number
          p_highest_arousal_reached: number
          p_accidentally_finished: boolean
          p_ended_early: boolean
          p_self_rating: number
          p_breathing_maintained?: 'yes' | 'mostly' | 'no' | null
          p_imagery_rating?: number | null
          p_positions_used?: string[] | null
          p_notes?: string | null
          p_lube_used: boolean
          p_toy_used: boolean
          p_ejaculation_outcome: 'no' | 'accidental' | 'intentional_after'
        }
        Returns: {
          advanced_to_phase: number | null
          previous_phase: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
