'use client'

import { Line } from 'react-chartjs-2'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from '@/lib/utils'
import type { DBSession } from '@/lib/types'

type SessionDetailsProps = {
  session: DBSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetails({ session, open, onOpenChange }: SessionDetailsProps) {
  if (!session) return null

  const edgeEvents = session.edge_events ?? []
  const chartData = {
    labels: edgeEvents.map((_, index) => `Edge ${index + 1}`),
    datasets: [
      {
        label: 'Edge Duration',
        data: edgeEvents.map(edge => edge.duration ? Math.round(edge.duration / 1000) : 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Time Between Edges',
        data: edgeEvents.slice(1).map((edge, index) => {
          const prevEdge = edgeEvents[index]
          if (!prevEdge.end_time || !edge.start_time) return 0
          return Math.round((new Date(edge.start_time).getTime() - new Date(prevEdge.end_time).getTime()) / 1000)
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Details - {new Date(session.created_at).toLocaleString()}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
                <div className="text-xl font-semibold">{formatDuration(session.total_duration)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Time</div>
                <div className="text-xl font-semibold">{formatDuration(session.active_duration)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Edge Time</div>
                <div className="text-xl font-semibold">{formatDuration(session.edge_duration)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Edge Count</div>
                <div className="text-xl font-semibold">{edgeEvents.length}</div>
              </div>
            </CardContent>
          </Card>

          {/* Edge Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Edge Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[2/1]">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Seconds'
                        },
                        ticks: {
                          callback: (value) => `${value}s`
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Edge Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Edge Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {edgeEvents.map((edge, index) => (
                  <div key={edge.id} className="bg-secondary p-4 rounded-lg">
                    <div className="font-semibold mb-2">Edge {index + 1}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Start Time</div>
                        <div>{new Date(edge.start_time).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">End Time</div>
                        <div>{edge.end_time ? new Date(edge.end_time).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div>{edge.duration ? formatDuration(edge.duration) : 'N/A'}</div>
                      </div>
                      {index > 0 && (
                        <div>
                          <div className="text-muted-foreground">Time Since Previous Edge</div>
                          <div>
                            {edge.start_time && edgeEvents[index - 1].end_time
                              ? formatDuration(
                                  new Date(edge.start_time).getTime() -
                                  new Date(edgeEvents[index - 1].end_time!).getTime()
                                )
                              : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 