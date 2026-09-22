// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobalProvider, useGlobal } from './GlobalContext'

/**
 * The chainable stub `supabase.channel()` returns. Named rather than `unknown`
 * so the fixture's own contract is checkable.
 */
type ChannelStub = {
  on: (event: string, config: unknown, handler: unknown) => ChannelStub
  subscribe: () => ChannelStub
}

const mocks = vi.hoisted(() => {
  const from = vi.fn()
  const eq = vi.fn()
  const limit = vi.fn()
  const channel = vi.fn()
  const channelOn = vi.fn()
  const subscribe = vi.fn()
  const removeChannel = vi.fn()
  const toastError = vi.fn()

  return {
    from,
    eq,
    limit,
    channel,
    channelOn,
    subscribe,
    removeChannel,
    toastError,
    // SAFETY: mutable test fixtures, not external input. A test assigns the
    // value its case needs and the assertion reads it back; these assertions
    // only widen the initial `null`/`[]` to the shape the suite uses, and no
    // runtime value is trusted on the strength of them.
    // The user the auth context reports for the current test.
    auth: { user: null as { id: string } | null },
    // What the sessions query resolves with for the current test. `data` is
    // null for the failure case and an array otherwise.
    queryResult: { data: null as unknown[] | null, error: null as Error | null },
    // The channel object the factory handed out, for identity checks.
    createdChannel: null as ChannelStub | null,
  }
})

// The provider reaches Supabase through this exact chain, so recording the
// arguments is how a test sees which rows and which subscription the backend was
// actually asked for — the observable contract, not the plumbing behind it.
vi.mock('@/lib/supabase/client', () => {
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      mocks.eq(column, value)

      return builder
    },
    order: () => builder,
    limit: (count: number) => {
      mocks.limit(count)

      return Promise.resolve(mocks.queryResult)
    },
  }

  const channel = {
    on: (event: string, config: unknown, handler: unknown) => {
      mocks.channelOn(event, config, handler)

      return channel
    },
    subscribe: () => {
      mocks.subscribe()

      return channel
    },
  }

  return {
    supabase: {
      from: (table: string) => {
        mocks.from(table)

        return builder
      },
      channel: (name: string) => {
        mocks.channel(name)
        mocks.createdChannel = channel

        return channel
      },
      removeChannel: (removed: unknown) => {
        mocks.removeChannel(removed)

        return Promise.resolve('ok')
      },
    },
  }
})

// `useAuth` is the app's single source of the signed-in user, so each test just
// picks which user it reports.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.auth.user, loading: false }),
}))

vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }))

function renderGlobal() {
  return renderHook(() => useGlobal(), {
    wrapper: ({ children }: { children: ReactNode }) => <GlobalProvider>{children}</GlobalProvider>,
  })
}

describe('GlobalProvider session sync', () => {
  beforeEach(() => {
    mocks.auth.user = null
    mocks.queryResult = { data: [], error: null }
    mocks.createdChannel = null
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('opens no channel and reads nothing for an anonymous visitor', async () => {
    const view = renderGlobal()

    await act(async () => {})

    expect(mocks.channel).not.toHaveBeenCalled()
    expect(mocks.removeChannel).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
    expect(view.result.current.recentSessions).toEqual([])
    // `loading` starts true and this effect is the only thing that settles it —
    // an early return here leaves every anonymous visitor waiting forever and
    // strands the previous account's rows in state after a sign-out.
    expect(view.result.current.loading).toBe(false)
  })

  it('drops the previous account’s sessions when the user signs out', async () => {
    mocks.auth.user = { id: 'user-7' }
    mocks.queryResult = { data: [{ id: 'session-1' }, { id: 'session-2' }], error: null }

    const view = renderGlobal()
    await act(async () => {})
    expect(view.result.current.recentSessions).toHaveLength(2)

    // Signing out must not leave one account's history readable through
    // `useGlobal()` for whoever uses the device next.
    mocks.auth.user = null
    await act(async () => {
      view.rerender()
    })

    expect(view.result.current.recentSessions).toEqual([])
    expect(view.result.current.loading).toBe(false)
  })

  it('leaves the backend alone when an anonymous consumer refreshes sessions', async () => {
    const view = renderGlobal()

    await act(async () => {
      await view.result.current.fetchSessions()
    })

    expect(mocks.from).not.toHaveBeenCalled()
    expect(view.result.current.recentSessions).toEqual([])
    expect(view.result.current.loading).toBe(false)
  })

  it('subscribes one channel filtered to the signed-in user and scopes the query to them', async () => {
    mocks.auth.user = { id: 'user-7' }

    const view = renderGlobal()

    expect(mocks.channel).toHaveBeenCalledTimes(1)
    expect(mocks.channelOn).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sessions', filter: 'user_id=eq.user-7' },
      expect.any(Function)
    )
    expect(mocks.subscribe).toHaveBeenCalledTimes(1)
    expect(mocks.from).toHaveBeenCalledWith('sessions')
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'user-7')

    // Re-rendering the same signed-in user must not open a second socket.
    view.rerender()
    await act(async () => {})

    expect(mocks.channel).toHaveBeenCalledTimes(1)
    expect(mocks.subscribe).toHaveBeenCalledTimes(1)
  })

  it("refetches the user's sessions when the subscription reports a change", async () => {
    mocks.auth.user = { id: 'user-7' }

    renderGlobal()
    await waitFor(() => expect(mocks.limit).toHaveBeenCalledTimes(1))

    const handler = mocks.channelOn.mock.calls[0][2] as (payload: unknown) => void

    await act(async () => {
      handler({ eventType: 'UPDATE' })
    })

    await waitFor(() => expect(mocks.limit).toHaveBeenCalledTimes(2))
    expect(mocks.eq).toHaveBeenLastCalledWith('user_id', 'user-7')
  })

  it('removes the channel it created when the provider unmounts', async () => {
    mocks.auth.user = { id: 'user-7' }

    const view = renderGlobal()
    await waitFor(() => expect(mocks.channel).toHaveBeenCalledTimes(1))

    view.unmount()

    expect(mocks.removeChannel).toHaveBeenCalledTimes(1)
    expect(mocks.removeChannel).toHaveBeenCalledWith(mocks.createdChannel)
  })

  it('surfaces a failed sessions query as an error and stops loading', async () => {
    mocks.auth.user = { id: 'user-7' }
    mocks.queryResult = { data: null, error: new Error('sessions unavailable') }
    // The provider logs this failure on purpose; keep the run output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const view = renderGlobal()

    await waitFor(() => expect(view.result.current.error).not.toBeNull())

    expect(view.result.current.error).toBeInstanceOf(Error)
    expect(view.result.current.error?.message).toBe('sessions unavailable')
    expect(view.result.current.loading).toBe(false)
    expect(view.result.current.recentSessions).toEqual([])
  })

  it('settles with an empty list when the query succeeds with no rows', async () => {
    mocks.auth.user = { id: 'user-7' }

    const view = renderGlobal()

    await waitFor(() => expect(view.result.current.loading).toBe(false))

    expect(view.result.current.recentSessions).toEqual([])
    expect(view.result.current.error).toBeNull()
  })

  it('refuses to expose global state outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useGlobal())).toThrow()
  })
})
