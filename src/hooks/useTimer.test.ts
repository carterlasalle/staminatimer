// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimer } from './useTimer'

const mocks = vi.hoisted(() => {
  const getUser = vi.fn()
  const sessionInsertSingle = vi.fn()
  const sessionUpdateEq = vi.fn()
  const sessionFetchSingle = vi.fn()
  const edgeInsert = vi.fn()
  const edgeUpdateIs = vi.fn()
  const checkAchievements = vi.fn()

  return {
    getUser,
    sessionInsertSingle,
    sessionUpdateEq,
    sessionFetchSingle,
    edgeInsert,
    edgeUpdateIs,
    checkAchievements,
  }
})

vi.mock('@/hooks/useAchievements', () => ({
  useAchievements: () => ({ checkAchievements: mocks.checkAchievements }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: (table: string) => {
      if (table === 'sessions') {
        return {
          insert: () => ({
            select: () => ({ single: mocks.sessionInsertSingle }),
          }),
          update: () => ({ eq: mocks.sessionUpdateEq }),
          select: () => ({
            eq: () => ({ single: mocks.sessionFetchSingle }),
          }),
        }
      }

      if (table === 'edge_events') {
        return {
          insert: mocks.edgeInsert,
          update: () => ({
            eq: () => ({ is: mocks.edgeUpdateIs }),
          }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  },
}))

describe('useTimer lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00.000Z'))
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.sessionInsertSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
    mocks.sessionUpdateEq.mockResolvedValue({ error: null })
    mocks.sessionFetchSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
    mocks.edgeInsert.mockResolvedValue({ error: null })
    mocks.edgeUpdateIs.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('starts, pauses, resumes, edges, completes, and resets without counting paused time', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => result.current.startSession())
    expect(result.current.state).toBe('active')
    expect(result.current.isPaused).toBe(false)

    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current.activeTime).toBe(5_000)

    await act(async () => result.current.pauseSession())
    expect(result.current.state).toBe('active')
    expect(result.current.isPaused).toBe(true)
    expect(result.current.activeTime).toBe(5_000)

    act(() => vi.advanceTimersByTime(2_000))
    expect(result.current.activeTime).toBe(5_000)

    act(() => result.current.resumeSession())
    expect(result.current.isPaused).toBe(false)
    act(() => vi.advanceTimersByTime(3_000))
    expect(result.current.activeTime).toBe(8_000)

    await act(async () => result.current.startEdge())
    expect(result.current.state).toBe('edging')

    act(() => vi.advanceTimersByTime(4_000))
    expect(result.current.edgeTime).toBe(4_000)

    await act(async () => result.current.endEdge())
    expect(result.current.state).toBe('active')
    expect(result.current.edgeLaps).toHaveLength(1)
    expect(result.current.edgeLaps[0]?.duration).toBe(4_000)

    act(() => vi.advanceTimersByTime(1_000))
    await act(async () => result.current.finishSession())
    expect(result.current.state).toBe('finished')
    expect(result.current.activeTime).toBe(9_000)
    expect(result.current.edgeTime).toBe(4_000)
    expect(mocks.checkAchievements).toHaveBeenCalledTimes(1)

    act(() => result.current.resetTimer())
    expect(result.current.state).toBe('idle')
    expect(result.current.isPaused).toBe(false)
    expect(result.current.activeTime).toBe(0)
    expect(result.current.edgeTime).toBe(0)
  })

  it('reconciles elapsed wall-clock time when page visibility changes', async () => {
    const { result } = renderHook(() => useTimer())
    await act(async () => result.current.startSession())

    vi.setSystemTime(new Date('2026-08-14T12:00:11.000Z'))
    act(() => document.dispatchEvent(new Event('visibilitychange')))

    expect(result.current.activeTime).toBe(11_000)
  })
})
