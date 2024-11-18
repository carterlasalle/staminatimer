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
        labels: sessions.map(s => new Date(s.created_at).toLocaleDateString()),
        datasets: [
          {
            label: 'Total Duration',
            data: sessions.map(s => s.total_duration / 1000 / 60), // Convert to minutes
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Edge Duration',
            data: sessions.map(s => s.edge_duration / 1000 / 60),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      }

      setData(chartData)
      setLoading(false)
    }

    fetchChartData()
  }, [])

  if (loading) return <div>Loading charts...</div>

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Progress Over Time</h2>
      {data && (
        <Line
          data={data}
          options={{
            responsive: true,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Duration (minutes)'
                }
              }
            }
          }}
        />
      )}
    </div>
  )
} 