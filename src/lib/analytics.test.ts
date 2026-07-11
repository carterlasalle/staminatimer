import { describe, expect, it } from 'vitest'

import { calculateDetailedAnalytics } from './analytics'
import type { DBSession } from './types'

function session(overrides: Partial<DBSession> = {}): DBSession {
  return {
    id: crypto.randomUUID(),
    start_time: '2026-07-10T12:00:00.000Z',
    end_time: '2026-07-10T12:01:00.000Z',
    total_duration: 60_000,
    active_duration: 50_000,
    edge_duration: 10_000,
    finished_during_edge: false,
    created_at: '2026-07-10T12:01:00.000Z',
    edge_events: [],
    ...overrides,
  }
}

describe('calculateDetailedAnalytics', () => {
  it('returns a stable empty result', () => {
    expect(calculateDetailedAnalytics([])).toMatchObject({
      totalSessions: 0,
      totalEdges: 0,
      successRate: 0,
      shortestSession: 0,
    })
  })

  it('calculates durations, success, edges, and streaks', () => {
    const result = calculateDetailedAnalytics([
      session({
        total_duration: 90_000,
        edge_duration: 20_000,
        edge_events: [
          {
            id: '1',
            start_time: '2026-07-10T12:00:10.000Z',
            end_time: '2026-07-10T12:00:20.000Z',
            duration: 10_000,
          },
        ],
      }),
      session({ total_duration: 30_000, finished_during_edge: true }),
    ])

    expect(result).toMatchObject({
      averageSessionDuration: 60_000,
      averageEdgesPerSession: 0.5,
      longestSession: 90_000,
      shortestSession: 30_000,
      successRate: 50,
      totalSessions: 2,
      totalEdges: 1,
      streakCount: 1,
    })
  })

  it('compares the newest three sessions with the previous three', () => {
    const result = calculateDetailedAnalytics([
      session({ total_duration: 120 }),
      session({ total_duration: 120 }),
      session({ total_duration: 120 }),
      session({ total_duration: 100 }),
      session({ total_duration: 100 }),
      session({ total_duration: 100 }),
    ])

    expect(result.improvementRate).toBe(20)
  })
})
