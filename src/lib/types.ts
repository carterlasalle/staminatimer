export type DBSession = {
  id: string
  start_time: string
  end_time: string
  total_duration: number
  active_duration: number
  edge_duration: number
  finished_during_edge: boolean
  created_at: string
  edge_events: Array<{
    id: string
    start_time: string
    end_time: string | null
    duration: number | null
  }>
} 