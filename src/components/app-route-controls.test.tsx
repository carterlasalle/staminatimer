// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/TimingGuide', () => ({
  TimingGuide: () => <div data-testid="timing-guide-stub" />,
}))

vi.mock('@/hooks/useTimer', () => ({
  useTimer: () => ({
    state: 'idle' as const,
    isPaused: false,
    activeTime: 0,
    edgeTime: 0,
    edgeLaps: [],
    startSession: vi.fn(),
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    startEdge: vi.fn(),
    endEdge: vi.fn(),
    finishSession: vi.fn(),
    resetTimer: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

vi.mock('@/lib/supabase/client', () => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockResolvedValue({ data: [], error: null })

  return { supabase: { from: vi.fn(() => chain) } }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/training',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/hooks/usePreferences', () => ({
  usePreferences: () => ({ prefs: { dailyGoalMinutes: 20, showMotivationalMessages: false } }),
}))

vi.mock('@/contexts/GlobalContext', () => ({
  useGlobal: () => ({ recentSessions: [], addSession: vi.fn(), fetchSessions: vi.fn() }),
}))

const { Timer } = await import('@/components/Timer')
const { SessionHistory } = await import('@/components/SessionHistory')
const { default: TrainingPage } = await import('@/app/(app)/training/page')
const { Slider } = await import('@/components/ui/slider')

beforeEach(() => {
  // Radix `use-size` reads this on mount; jsdom does not provide it.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/**
 * Axe reports an unnamed control but not which one. These pin the exact names
 * the app-route fixes introduced, so a future icon-only button or unlabeled
 * trigger fails here with the control's name instead of an axe node target.
 */
describe('app-route control names', () => {
  it('names the timer header toggles', () => {
    render(<Timer />)

    expect(screen.getByRole('button', { name: 'Toggle timing guides' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Toggle keyboard shortcuts' })).toBeDefined()
  })

  it('names the session-history sort controls', async () => {
    render(<SessionHistory />)

    expect(await screen.findByRole('combobox', { name: 'Sort sessions by' })).toBeDefined()
    expect(screen.getByRole('button', { name: /Sort (ascending|descending)/ })).toBeDefined()
  })

  it('exposes the training tab triggers by name', () => {
    render(<TrainingPage />)

    expect(screen.getByRole('tab', { name: 'Timer' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Kegel exercises' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Mental exercises' })).toBeDefined()
  })

  it('gives the Slider an accessible name when a label is provided', () => {
    render(<Slider label="Daily goal in minutes" value={[20]} />)

    expect(screen.getByRole('slider', { name: 'Daily goal in minutes' })).toBeDefined()
  })
})
