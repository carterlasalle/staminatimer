'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { LineChart } from '@/components/LazyChart'
import { useGlobal } from '@/contexts/GlobalContext'
import { useChartColors } from '@/hooks/useChartColors'
import type { DBSession } from '@/lib/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ChartsProps = {
  data?: DBSession[]
}

function minutes(ms: number | null): number {
  return ms ? Math.round((ms / 1000 / 60) * 100) / 100 : 0
}

export function Charts({ data: externalData }: ChartsProps = {}) {
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null)
  const colors = useChartColors()
  const { loading: globalLoading, recentSessions } = useGlobal()

  const isLoading = externalData === undefined && globalLoading

  const buildChartData = useCallback(
    (sessions: DBSession[]): ChartData<'line'> => {
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      return {
        labels: sorted.map((session) => new Date(session.created_at).toLocaleDateString()),
        datasets: [
          {
            label: 'Total duration',
            data: sorted.map((session) => minutes(session.total_duration)),
            borderColor: colors.primary,
            backgroundColor: colors.primary,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2.5,
            pointHoverRadius: 5,
          },
          {
            label: 'Edge duration',
            data: sorted.map((session) => minutes(session.edge_duration)),
            borderColor: colors.warning,
            backgroundColor: colors.warning,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2.5,
            pointHoverRadius: 5,
          },
        ],
      }
    },
    [colors]
  )

  useEffect(() => {
    const sessions = externalData ?? (globalLoading ? undefined : recentSessions)

    setChartData(sessions && sessions.length > 0 ? buildChartData(sessions) : null)
  }, [externalData, recentSessions, globalLoading, buildChartData])

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 420 },
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: colors.grid },
          border: { display: false },
          title: { display: true, text: 'Minutes', color: colors.tick },
          ticks: { color: colors.tick, maxTicksLimit: 5 },
        },
        x: {
          grid: { display: false },
          border: { color: colors.grid },
          ticks: { color: colors.tick, maxRotation: 0, autoSkipPadding: 12 },
        },
      },
      plugins: {
        legend: { position: 'top', labels: { color: colors.tick, boxWidth: 12, boxHeight: 2 } },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y} min`,
          },
        },
      },
    }),
    [colors]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session duration over time</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Loading chart..." className="h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Session duration over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total and edge duration per session, in minutes.
          </p>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-sm text-muted-foreground">
            No sessions yet. Your first recorded session will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Session duration over time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total and edge duration per session, in minutes.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <LineChart
            data={chartData}
            options={chartOptions}
            ariaLabel="Line chart of session duration over time"
          />
        </div>
      </CardContent>
    </Card>
  )
}
