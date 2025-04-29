'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Session } from '@/lib/supabase/schema'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Trash2, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SessionDetails } from '@/components/SessionDetails'
import { formatDuration } from '@/lib/utils'

type SortField = 'created_at' | 'total_duration' | 'edge_duration'
type SortOrder = 'desc' | 'asc'

type DBSession = {
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
    end_time: string
    duration: number
  }>
}

export function SessionHistory(): JSX.Element {
  const [sessions, setSessions] = useState<DBSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedSession, setSelectedSession] = useState<DBSession | null>(null)

  const fetchSessions = useCallback(async (): Promise<void> => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('sessions')
      .select(`*, edge_events!fk_session (*)`)
      .eq('user_id', user?.id)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .limit(10)

    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }

    setSessions(data as DBSession[])
    setLoading(false)
  }, [sortField, sortOrder])

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    const confirmDelete = window.confirm('Are you sure you want to delete this session?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      toast.error('Failed to delete session')
      console.error('Error deleting session:', error)
      return
    }

    toast.success('Session deleted')
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  if (loading) return <div>Loading sessions...</div>

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Sessions</CardTitle>
        <div className="flex gap-4">
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="total_duration">Total Duration</SelectItem>
              <SelectItem value="edge_duration">Edge Duration</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSessions}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="relative bg-card border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                onClick={() => deleteSession(session.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-muted-foreground">Total Time</div>
                  <div className="text-foreground">{formatDuration(session.total_duration)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Active Time</div>
                  <div className="text-foreground">{formatDuration(session.active_duration)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Edge Time</div>
                  <div className="text-foreground">{formatDuration(session.edge_duration)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Edge Count</div>
                  <div className="text-foreground">{session.edge_events?.length ?? 0}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium text-muted-foreground">Finished During Edge</div>
                  <div className="text-foreground">{session.finished_during_edge ? 'Yes' : 'No'}</div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(session.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <SessionDetails
        session={selectedSession}
        open={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </Card>
  )
}