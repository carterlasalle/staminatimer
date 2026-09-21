'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart } from '@/components/LazyChart'
import { getRollingTrend, type TrendPoint } from '@/lib/program/protocol-v2'
import type { ProgramV2SessionRow } from '@/hooks/useProgramV2Progress'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { ChartData, ChartOptions } from 'chart.js'

type TrendsV2Props = {
  baselines: ProgramV2SessionRow[]
  controlSessions: ProgramV2SessionRow[]
}

type ChartTheme = {
  series: [string, string]
  tick: string
  grid: string
}

const FALLBACK_THEME: ChartTheme = {
  series: ['hsl(166 46% 47%)', 'hsl(200 38% 60%)'],
  tick: 'hsl(195 11% 65%)',
  grid: 'hsl(200 13% 20%)',
}

/** Chart.js needs concrete colours, so resolve the design tokens from the DOM and
 * re-resolve whenever the theme changes. */
function useChartTheme(): ChartTheme {
  const { theme } = useTheme()
  const [chartTheme, setChartTheme] = useState<ChartTheme>(FALLBACK_THEME)

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const token = (name: string) => styles.getPropertyValue(name).trim()

    setChartTheme({
      series: [`hsl(${token('--primary')})`, `hsl(${token('--chart-3')})`],
      tick: `hsl(${token('--muted-foreground')})`,
      grid: `hsl(${token('--border')} / 0.6)`,
    })
  }, [theme])

  return chartTheme
}

function toChartData(points: TrendPoint[], label: string, color: string): ChartData<'line'> {
  return {
    labels: points.map((point) => new Date(point.at).toLocaleDateString()),
    datasets: [
      {
        label,
        data: points.map((point) => Math.round(point.durationMs / 1000)),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderWidth: 0,
      },
    ],
  }
}

function buildOptions(chartTheme: ChartTheme): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { color: chartTheme.grid },
        ticks: { color: chartTheme.tick, maxRotation: 0, autoSkipPadding: 12 },
      },
      y: {
        beginAtZero: true,
        grid: { color: chartTheme.grid },
        border: { display: false },
        ticks: { color: chartTheme.tick, maxTicksLimit: 5 },
      },
    },
  }
}

/** Charts that answer a single question: is continuous control actually improving? */
export function TrendsV2({ baselines, controlSessions }: TrendsV2Props) {
  const chartTheme = useChartTheme()

  const baselinePoints: TrendPoint[] = baselines
    .slice()
    .reverse()
    .map((session) => ({
      at: session.created_at,
      durationMs: session.continuous_attempt_ms ?? 0,
    }))

  const blockPoints: TrendPoint[] = controlSessions
    .slice()
    .reverse()
    .map((session) => ({
      at: session.created_at,
      durationMs: session.longest_continuous_block_ms ?? 0,
    }))

  const recentControl = controlSessions.slice(0, 10)
  const recentRescueCounts = recentControl.map((session) => session.rescue_stop_count)
  const rescueTrend = getRollingTrend(recentRescueCounts.map((count) => -count))
  const options = buildOptions(chartTheme)

  const seriesLabel = (
    points: TrendPoint[],
    direction: 'up' | 'down' | 'flat',
    deltaMs: number
  ) => {
    if (points.length < 2 || direction === 'flat') {
      return 'steady'
    }

    const seconds = Math.abs(Math.round(deltaMs / 1000))
    return direction === 'up' ? `up ${seconds}s` : `down ${seconds}s`
  }

  if (baselinePoints.length < 2 && blockPoints.length < 2) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Trends appear once you have a few sessions. The two that matter most are the
            standardized baseline and the longest continuous block.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Solo capability only. Device and partner transfer results are tracked separately and are
            never merged into these lines.
          </p>
        </CardContent>
      </Card>
    )
  }

  const baselineTrend = getRollingTrend(baselinePoints.map((point) => point.durationMs))
  const blockTrend = getRollingTrend(blockPoints.map((point) => point.durationMs))

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Solo capability only. Device and partner results are separate and never merged into these
          lines.
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {baselinePoints.length >= 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">Standardized baseline</p>
              <p className="text-xs text-muted-foreground">
                {seriesLabel(baselinePoints, baselineTrend.direction, baselineTrend.deltaMs)} vs
                earlier sessions
              </p>
            </div>
            <div className="h-[220px]">
              <LineChart
                data={toChartData(baselinePoints, 'Baseline', chartTheme.series[0])}
                options={options}
              />
            </div>
          </div>
        )}

        {blockPoints.length >= 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">Longest continuous block</p>
              <p className="text-xs text-muted-foreground">
                {seriesLabel(blockPoints, blockTrend.direction, blockTrend.deltaMs)} vs earlier
                sessions
              </p>
            </div>
            <div className="h-[220px]">
              <LineChart
                data={toChartData(blockPoints, 'Longest block', chartTheme.series[1])}
                options={options}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">Rescue stops per Control session</p>
            <p className="text-xs text-muted-foreground">
              {rescueTrend.direction === 'up'
                ? 'fewer rescues recently'
                : rescueTrend.direction === 'down'
                  ? 'more rescues recently'
                  : 'steady'}
            </p>
          </div>

          {recentControl.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Control sessions recorded yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {recentControl.map((session) => (
                <li key={session.id} className="space-y-1.5">
                  <span className="flex gap-1" aria-hidden>
                    {Array.from({ length: 3 }, (_, index) => (
                      <span
                        key={index}
                        className={
                          index < session.rescue_stop_count
                            ? 'h-1.5 w-3 rounded-full bg-warning'
                            : 'h-1.5 w-3 rounded-full bg-muted'
                        }
                      />
                    ))}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {new Date(session.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
