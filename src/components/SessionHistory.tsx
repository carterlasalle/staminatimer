'use client'

import { SessionDetails } from '@/components/SessionDetails'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'
import { RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { useVirtualizer } from '@tanstack/react-virtual'
import { UI_CONSTANTS } from '@/lib/constants'

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

export function SessionHistory() {
  const [sessions, setSessions] = useState<DBSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedSession, setSelectedSession] = useState<DBSession | null>(null)

  // Virtual list setup for performance with long session lists
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 130, // Estimated row height in pixels
    overscan: UI_CONSTANTS.VIRTUAL_LIST_OVERSCAN,
  })

  const fetchSessions = useCallback(async (): Promise<void> => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('sessions')
      .select(`*, edge_events!fk_session (*)`)
      .eq('user_id', user.id)
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="total_duration">Duration</SelectItem>
              <SelectItem value="edge_duration">Edge Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}
            className="h-8 px-2"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          ref={parentRef}
          className="h-80 overflow-y-auto custom-scrollbar"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const session = sessions[virtualItem.index]
              return (
                <div
                  key={session.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-2"
                >
                  <div
                    className="relative bg-secondary/30 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Total Time</div>
                          <div className="font-medium">{formatDuration(session.total_duration)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Active Time</div>
                          <div className="font-medium">{formatDuration(session.active_duration)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Edge Time</div>
                          <div className="font-medium">{formatDuration(session.edge_duration)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Edge Count</div>
                          <div className="font-medium">{session.edge_events?.length ?? 0}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs ${
                          session.finished_during_edge
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {session.finished_during_edge ? 'Edge Finish' : 'Complete'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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
