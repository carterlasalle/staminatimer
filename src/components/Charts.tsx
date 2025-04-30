'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { useGlobal } from '@/contexts/GlobalContext'
import type { DBSession } from '@/lib/types'
import type { ChartOptions } from 'chart.js'
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type ChartsProps = {
  data?: DBSession[]
}

type LineChartData = {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
  }[]
}

export function Charts({ data: externalData }: ChartsProps = {}): JSX.Element {
  const [chartData, setChartData] = useState<LineChartData | null>(null)
  const { theme } = useTheme()
  const { loading: globalLoading, recentSessions } = useGlobal()

  const isLoading = externalData === undefined && globalLoading;

  const processSessionsForChart = useCallback((sessions: DBSession[]): LineChartData => {
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return {
      labels: sortedSessions.map(s => new Date(s.created_at).toLocaleTimeString()),
      datasets: [
        {
          label: 'Total Duration',
          data: sortedSessions.map(s => s.total_duration ? Math.round(s.total_duration / 1000 / 60 * 100) / 100 : 0),
          borderColor: theme === 'dark' ? 'rgb(134, 239, 172)' : 'rgb(75, 192, 192)',
          backgroundColor: theme === 'dark' ? 'rgba(134, 239, 172, 0.5)' : 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        },
        {
          label: 'Edge Duration',
          data: sortedSessions.map(s => s.edge_duration ? Math.round(s.edge_duration / 1000 / 60 * 100) / 100 : 0),
          borderColor: theme === 'dark' ? 'rgb(251, 113, 133)' : 'rgb(239, 68, 68)',
          backgroundColor: theme === 'dark' ? 'rgba(248, 113, 113, 0.5)' : 'rgba(255, 99, 132, 0.5)',
          tension: 0.1
        }
      ]
    }
  }, [theme])

  useEffect(() => {
    let sessionsToProcess: DBSession[] | undefined;

        if (externalData) {
      sessionsToProcess = externalData
    } else if (!globalLoading && recentSessions) {
      sessionsToProcess = recentSessions
    } else {
          setChartData(null)
      return;
    }

    if (!sessionsToProcess || sessionsToProcess.length === 0) {
      setChartData(null)
    } else {
      setChartData(processSessionsForChart(sessionsToProcess))
    }
  }, [theme, externalData, recentSessions, globalLoading, processSessionsForChart])

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Progress Over Time (Minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Loading chart..." className="h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.labels.length === 0) {
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

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
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
          color: theme === 'dark' ? '#a1a1aa' : '#3f3f46'
        },
        ticks: {
          callback: (value) => `${value}m`,
          color: theme === 'dark' ? '#a1a1aa' : '#3f3f46'
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: theme === 'dark' ? '#a1a1aa' : '#3f3f46'
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
          color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}m`
        }
      }
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Progress Over Time (Minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[2/1] relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}