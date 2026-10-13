// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './page'

const programProgressMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/AppNavigation', () => ({
  AppNavigation: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/OnboardingTutorial', () => ({
  OnboardingTutorial: () => null,
  useOnboarding: () => ({ showOnboarding: false, completeOnboarding: vi.fn() }),
}))

vi.mock('@/hooks/useProgramV2Progress', () => ({
  useProgramV2Progress: programProgressMock,
}))

function setProgress(overrides: Record<string, unknown> = {}) {
  programProgressMock.mockReturnValue({
    loading: false,
    error: null,
    needsOnboarding: false,
    currentTargetMs: 300_000,
    gate: null,
    sessions: [],
    ...overrides,
  })
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 23, 12, 0, 0))
    setProgress()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows a read failure instead of default program data', () => {
    setProgress({ error: 'Supabase request failed' })

    render(<Dashboard />)

    expect(screen.getByRole('alert').textContent).toBe('Supabase request failed')
    expect(screen.getByText("We couldn't load your training data.")).toBeTruthy()
    expect(screen.queryByText('Weekly rhythm')).toBeNull()
  })

  it('keeps the loading placeholder while progress is pending', () => {
    setProgress({ loading: true })

    render(<Dashboard />)

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('Weekly rhythm')).toBeTruthy()
  })

  it('renders loaded data and highlights the local weekday', () => {
    render(<Dashboard />)

    expect(screen.getAllByText('5:00').length).toBeGreaterThan(0)
    expect(screen.getByTitle('Wednesday').className).toContain('is-current')
    expect(screen.getByTitle('Monday').className).not.toContain('is-current')
  })
})
