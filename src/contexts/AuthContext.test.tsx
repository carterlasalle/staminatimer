// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { AuthProvider, useAuth } from './AuthContext'

const supabaseMock = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
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

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }

/** A promise settled by hand, so an ordering under test is the ordering that runs. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })

  return { promise, resolve }
}

type SessionResult = { data: { session: Session | null } }
type UserResult = { data: { user: User | null } }

let sessionCall: Deferred<SessionResult>
let userCall: Deferred<UserResult>
let authChangeListener: Listener | undefined

beforeEach(() => {
  sessionCall = deferred<SessionResult>()
  userCall = deferred<UserResult>()
  authChangeListener = undefined

  supabaseMock.auth.getSession.mockReturnValue(sessionCall.promise)
  supabaseMock.auth.getUser.mockReturnValue(userCall.promise)
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
  it('reports the validated user over the stored session user', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('stored-user')) } })
    })

    expect(reportedUserId()).toBe('stored-user')

    await act(async () => {
      userCall.resolve({ data: { user: makeUser('validated-user') } })
    })

    expect(reportedUserId()).toBe('validated-user')
  })

  it('keeps the validated user when the stored session resolves afterwards', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      userCall.resolve({ data: { user: makeUser('validated-user') } })
    })

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('stored-user')) } })
    })

    expect(reportedUserId()).toBe('validated-user')
    // The stale id was never shown to a consumer, not merely outvoted at the end.
    expect(record.users.map((user) => user?.id)).not.toContain('stored-user')
  })

  it('reports signed out when the validated call finds no user', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      userCall.resolve({ data: { user: null } })
    })

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('stored-user')) } })
    })

    expect(reportedUserId()).toBe('anonymous')
  })
})

describe('user reference stability', () => {
  it('does not re-render a consumer when both calls agree on the user id', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('user-1')) } })
    })

    const settled = record.users.at(-1)
    const rendersAfterSession = record.users.length
    const effectRunsAfterSession = record.userEffectRuns

    // Both calls answered for the same account: null, then the stored user.
    expect(effectRunsAfterSession).toBe(2)

    // The validated call returns a different object for that same id.
    await act(async () => {
      userCall.resolve({ data: { user: makeUser('user-1') } })
    })

    expect(Object.is(record.users.at(-1), settled)).toBe(true)
    expect(record.users.length).toBe(rendersAfterSession)
    expect(record.userEffectRuns).toBe(effectRunsAfterSession)
  })
})

describe('auth state changes', () => {
  it('ignores the initial session event', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      userCall.resolve({ data: { user: makeUser('validated-user') } })
    })

    act(() => {
      authChangeListener?.('INITIAL_SESSION', makeSession(makeUser('stored-user')))
    })

    expect(reportedUserId()).toBe('validated-user')
  })

  it('applies a sign-in and keeps it when a stored session arrives late', async () => {
    const record = newRecord()
    renderProvider(record)

    act(() => {
      authChangeListener?.('SIGNED_IN', makeSession(makeUser('signed-in-user')))
    })

    expect(reportedUserId()).toBe('signed-in-user')

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('stored-user')) } })
    })

    expect(reportedUserId()).toBe('signed-in-user')
  })

  it('applies a sign-out', async () => {
    const record = newRecord()
    renderProvider(record)

    await act(async () => {
      userCall.resolve({ data: { user: makeUser('validated-user') } })
    })

    expect(reportedUserId()).toBe('validated-user')

    act(() => {
      authChangeListener?.('SIGNED_OUT', null)
    })

    expect(reportedUserId()).toBe('anonymous')
  })
})

describe('loading', () => {
  it('stays true until the stored session resolves', async () => {
    const record = newRecord()
    renderProvider(record)

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await act(async () => {
      sessionCall.resolve({ data: { session: makeSession(makeUser('stored-user')) } })
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('stays true until the validated call resolves', async () => {
    const record = newRecord()
    renderProvider(record)

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await act(async () => {
      userCall.resolve({ data: { user: makeUser('validated-user') } })
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
