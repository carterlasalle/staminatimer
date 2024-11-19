'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useTheme } from 'next-themes'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export function Charts() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchChartData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user found')
          return
        }
        console.log('Current user:', user.id)

        const { data: checkSessions, error: checkError } = await supabase
          .from('sessions')
          .select('id, user_id, created_at')
          .eq('user_id', user.id)

        console.log('Check sessions query:', checkSessions)
        if (checkError) {
          console.error('Check sessions error:', checkError)
          return
        }

        console.log('Sessions for user:', user.id)
        console.log('Found sessions in check:', checkSessions?.length)

        const { data: sessions, error } = await supabase
          .from('sessions')
          .select(`
            id,
            user_id,
            start_time,
            end_time,
            total_duration,
            active_duration,
            edge_duration,
            created_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(20)

        if (error) {
          console.error('Error fetching chart data:', error)
          console.error('Error details:', error.details)
          console.error('Error hint:', error.hint)
          return
        }

        console.log('Sessions found:', sessions?.length)
        console.log('Raw sessions:', sessions)
        console.log('Query details:', {
          userId: user.id,
          sessionCount: sessions?.length,
          firstSession: sessions?.[0],
          checkSessionsCount: checkSessions?.length
        })

        if (!sessions || sessions.length === 0) {
          console.log('No sessions found for user')
          setData(null)
          setLoading(false)
          return
        }

        const chartData = {
          labels: sessions.map(s => new Date(s.created_at).toLocaleTimeString()),
          datasets: [
            {
              label: 'Total Duration',
              data: sessions.map(s => s.total_duration ? Math.round(s.total_duration / 1000 / 60 * 100) / 100 : 0),
              borderColor: theme === 'dark' ? 'rgb(134, 239, 172)' : 'rgb(75, 192, 192)',
              backgroundColor: theme === 'dark' ? 'rgba(134, 239, 172, 0.5)' : 'rgba(75, 192, 192, 0.5)',
              tension: 0.1
            },
            {
              label: 'Edge Duration',
              data: sessions.map(s => s.edge_duration ? Math.round(s.edge_duration / 1000 / 60 * 100) / 100 : 0),
              borderColor: theme === 'dark' ? 'rgb(248, 113, 113)' : 'rgb(255, 99, 132)',
              backgroundColor: theme === 'dark' ? 'rgba(248, 113, 113, 0.5)' : 'rgba(255, 99, 132, 0.5)',
              tension: 0.1
            }
          ]
        }

        setData(chartData)
        setLoading(false)
      } catch (err) {
        console.error('Error in fetchChartData:', err)
        setLoading(false)
      }
    }

    fetchChartData()
    const interval = setInterval(fetchChartData, 5000)
    return () => clearInterval(interval)
  }, [theme])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Progress Over Time (Minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            Loading charts...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Progress Over Time (Minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No sessions recorded yet. Start a session to see your progress!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Progress Over Time (Minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[2/1] relative">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Duration (minutes)',
                    color: theme === 'dark' ? '#e5e5e5' : '#171717'
                  },
                  ticks: {
                    callback: (value) => `${value}m`,
                    color: theme === 'dark' ? '#e5e5e5' : '#171717'
                  },
                  grid: {
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    color: theme === 'dark' ? '#e5e5e5' : '#171717'
                  },
                  grid: {
                    display: false
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: theme === 'dark' ? '#e5e5e5' : '#171717'
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.parsed.y}m`
                  }
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
} 