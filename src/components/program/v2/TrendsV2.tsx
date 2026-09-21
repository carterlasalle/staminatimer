'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart } from '@/components/LazyChart'
import { getRollingTrend, type TrendPoint } from '@/lib/program/protocol-v2'
import type { ProgramV2SessionRow } from '@/hooks/useProgramV2Progress'
import type { ChartData, ChartOptions } from 'chart.js'

type TrendsV2Props = {
  baselines: ProgramV2SessionRow[]
  controlSessions: ProgramV2SessionRow[]
}

function toChartData(points: TrendPoint[], label: string, color: string): ChartData<'line'> {
  return {
    labels: points.map((point) => new Date(point.at).toLocaleDateString()),
    datasets: [
      {
        label,
        data: points.map((point) => Math.round(point.durationMs / 1000)),
        borderColor: color,
        backgroundColor: color.replace('rgb(', 'rgba(').replace(')', ', 0.3)'),
        tension: 0.25,
        pointRadius: 3,
      },
    ],
  }
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { title: { display: true, text: 'seconds' }, beginAtZero: true },
  },
}

/** Charts that answer a single question: is continuous control actually improving? */
export function TrendsV2({ baselines, controlSessions }: TrendsV2Props) {
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

  const recentRescueCounts = controlSessions
    .slice(0, 10)
    .map((session) => session.rescue_stop_count)

  const rescueTrend = getRollingTrend(recentRescueCounts.map((count) => -count))

  if (baselinePoints.length < 2 && blockPoints.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Trends appear once you have a few sessions. The two that matter most are the
            standardized baseline and the longest continuous block.
          </p>
        </CardContent>
      </Card>
    )
  }

  const baselineTrend = getRollingTrend(baselinePoints.map((point) => point.durationMs))
  const blockTrend = getRollingTrend(blockPoints.map((point) => point.durationMs))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Solo capability only. Device and partner transfer results are tracked separately and are
          never merged into these lines.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {baselinePoints.length >= 2 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Standardized baseline over time</p>
            <div className="h-[240px]">
              <LineChart
                data={toChartData(baselinePoints, 'Baseline', 'rgb(16, 185, 129)')}
                options={options}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recent trend: {baselineTrend.direction}
              {baselineTrend.direction === 'flat'
                ? ''
                : ` (${baselineTrend.deltaMs > 0 ? '+' : '-'}${Math.abs(Math.round(baselineTrend.deltaMs / 1000))}s vs earlier sessions)`}
            </p>
          </div>
        )}

        {blockPoints.length >= 2 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Longest continuous block over time</p>
            <div className="h-[240px]">
              <LineChart
                data={toChartData(blockPoints, 'Longest block', 'rgb(56, 189, 248)')}
                options={options}
              />
            </div>
            <p className="text-xs text-muted-foreground">Recent trend: {blockTrend.direction}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium">Rescue stops per Control session</p>
          {recentRescueCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Control sessions recorded yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {controlSessions.slice(0, 10).map((session) => (
                  <span
                    key={session.id}
                    className="rounded-md border border-border/60 px-2 py-1 text-xs"
                  >
                    {new Date(session.created_at).toLocaleDateString()}: {session.rescue_stop_count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Direction:{' '}
                {rescueTrend.direction === 'up'
                  ? 'fewer rescues recently'
                  : rescueTrend.direction === 'down'
                    ? 'more rescues recently'
                    : 'steady'}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
