'use client'

import { useEffect, useState } from 'react'
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

type SortField = 'created_at' | 'total_duration' | 'edge_duration'
type SortOrder = 'desc' | 'asc'

export function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchSessions()
  }, [sortField, sortOrder])

  async function fetchSessions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        edge_events (*)
      `)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .limit(10)

    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }

    setSessions(data)
    setLoading(false)
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) return <div>Loading sessions...</div>

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recent Sessions</h2>
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
        </div>
      </div>
      <div className="grid gap-4">
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className="bg-gray-100 p-4 rounded-lg"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Total Time</div>
                <div>{formatDuration(session.totalDuration)}</div>
              </div>
              <div>
                <div className="font-medium">Active Time</div>
                <div>{formatDuration(session.activeDuration)}</div>
              </div>
              <div>
                <div className="font-medium">Edge Time</div>
                <div>{formatDuration(session.edgeDuration)}</div>
              </div>
              <div>
                <div className="font-medium">Finished During Edge</div>
                <div>{session.finishedDuringEdge ? 'Yes' : 'No'}</div>
              </div>
              <div className="col-span-2 text-sm text-gray-500">
                {new Date(session.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 