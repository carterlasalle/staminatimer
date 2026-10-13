// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { AuthProvider, useAuth } from './AuthContext'

const supabaseMock = vi.hoisted(() => ({
  auth: {
    onAuthStateChange: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/client', () => ({ supabase: supabaseMock }))

function makeUser(id: string): User {
  return {
    id,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  }
}

/** The provider only reads `session.user`; token fields never reach a consumer. */
function makeSession(user: User | null): Session | null {
  return user ? ({ user } as Session) : null
}

type Listener = (event: AuthChangeEvent, session: Session | null) => void

let authChangeListener: Listener | undefined

beforeEach(() => {
  authChangeListener = undefined

  supabaseMock.auth.onAuthStateChange.mockImplementation((listener: Listener) => {
    authChangeListener = listener

    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
})

afterEach(() => {
  cleanup()
})

/** What a consumer of `useAuth()` saw, render by render. */
type AuthRecord = {
  users: Array<User | null>
  userEffectRuns: number
}

function renderProvider(record: AuthRecord) {
  render(
    <AuthProvider>
      <Probe record={record} />
    </AuthProvider>
  )
}

function Probe({ record }: { record: AuthRecord }) {
  const { user, loading } = useAuth()

  record.users.push(user)

  useEffect(() => {
    record.userEffectRuns += 1
  }, [record, user])

  return (
    <>
      <span data-testid="user-id">{user?.id ?? 'anonymous'}</span>
      <span data-testid="loading">{String(loading)}</span>
    </>
  )
}

function reportedUserId() {
  return screen.getByTestId('user-id').textContent
}

function newRecord(): AuthRecord {
  return { users: [], userEffectRuns: 0 }
}

describe('children', () => {
  it('renders children on the first render, before any auth call resolves', () => {
    render(
      <AuthProvider>
        <p>page content</p>
      </AuthProvider>
    )

    expect(screen.getByText('page content')).toBeTruthy()
  })
})

describe('startup resolution', () => {
  it('reports the client’s initial session without issuing a second auth read', () => {
    const record = newRecord()
    renderProvider(record)

    act(() => {
      authChangeListener?.('INITIAL_SESSION', makeSession(makeUser('stored-user')))
    })

    expect(reportedUserId()).toBe('stored-user')
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(record.users.map((user) => user?.id)).toContain('stored-user')
  })
})

describe('user reference stability', () => {
  it('does not re-render a consumer when an auth event repeats the same user id', () => {
    const record = newRecord()
    renderProvider(record)

    act(() => {
      authChangeListener?.('INITIAL_SESSION', makeSession(makeUser('user-1')))
    })

    const settled = record.users.at(-1)
    const rendersAfterSession = record.users.length
    const effectRunsAfterSession = record.userEffectRuns

    expect(effectRunsAfterSession).toBe(2)

    act(() => {
      authChangeListener?.('TOKEN_REFRESHED', makeSession(makeUser('user-1')))
    })

    expect(Object.is(record.users.at(-1), settled)).toBe(true)
    expect(record.users.length).toBe(rendersAfterSession)
    expect(record.userEffectRuns).toBe(effectRunsAfterSession)
  })
})

describe('auth state changes', () => {
  it('applies a sign-in', () => {
    const record = newRecord()
    renderProvider(record)

    act(() => {
      authChangeListener?.('SIGNED_IN', makeSession(makeUser('signed-in-user')))
    })

    expect(reportedUserId()).toBe('signed-in-user')

    expect(reportedUserId()).toBe('signed-in-user')
  })

  it('applies a sign-out', () => {
    const record = newRecord()
    renderProvider(record)

    act(() => {
      authChangeListener?.('INITIAL_SESSION', makeSession(makeUser('signed-in-user')))
    })

    expect(reportedUserId()).toBe('signed-in-user')

    act(() => {
      authChangeListener?.('SIGNED_OUT', null)
    })

    expect(reportedUserId()).toBe('anonymous')
  })
})

describe('loading', () => {
  it('stays true until the initial session event arrives', () => {
    const record = newRecord()
    renderProvider(record)

    expect(screen.getByTestId('loading').textContent).toBe('true')

    act(() => {
      authChangeListener?.('INITIAL_SESSION', makeSession(makeUser('stored-user')))
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
  })
})

describe('useAuth outside a provider', () => {
  it('reports the signed-out default instead of throwing', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })
})
