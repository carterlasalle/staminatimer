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

  useEffect(() => {
    async function fetchChartData() {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(20)

      if (error) {
        console.error('Error fetching chart data:', error)
        return
      }

      const chartData = {
        labels: sessions.map(s => new Date(s.created_at).toLocaleTimeString()),
        datasets: [
          {
            label: 'Total Duration',
            data: sessions.map(s => s.total_duration ? Math.round(s.total_duration / 1000 / 60 * 100) / 100 : 0),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          },
          {
            label: 'Edge Duration',
            data: sessions.map(s => s.edge_duration ? Math.round(s.edge_duration / 1000 / 60 * 100) / 100 : 0),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          }
        ]
      }

      setData(chartData)
      setLoading(false)
    }

    fetchChartData()
    const interval = setInterval(fetchChartData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Loading charts...</div>

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Progress Over Time (Minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[2/1] relative">
          {data && (
            <Line
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Duration (minutes)'
                    },
                    ticks: {
                      callback: (value) => `${value}m`
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    },
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.parsed.y}m`
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
} 