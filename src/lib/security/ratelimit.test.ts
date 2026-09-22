import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_CONSTANTS } from '@/lib/constants'
import type { RateLimitResult } from '@/lib/security/ratelimit'

const { RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX, AI_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } =
  API_CONSTANTS

type RateLimitModule = {
  checkRateLimit: (identifier: string, type?: 'general' | 'auth' | 'ai') => Promise<RateLimitResult>
  isRateLimitingEnabled: () => boolean
}

const UPSTASH_URL = 'https://example-ratelimit.upstash.io'

const UPSTASH_TOKEN = 'test-token-not-a-real-secret'

/**
 * Fails the Redis transport with a 500 so the real @upstash client rejects
 * (it does not retry a returned error response). Nothing leaves the process,
 * which is what keeps a Redis-outage scenario runnable in a unit test.
 */
function stubFailingRedis(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ error: 'redis unavailable' }), { status: 500 }))
  )
}

/**
 * The module snapshots its env at import time, so every scenario needs a fresh
 * module instance with the environment already stubbed.
 */
async function loadRateLimit(options: {
  nodeEnv: string
  withCredentials?: boolean
}): Promise<RateLimitModule> {
  vi.resetModules()

  // Stub both directions: an empty string is falsy, which keeps the "not
  // configured" scenarios independent of whatever the developer's .env holds.
  vi.stubEnv('UPSTASH_REDIS_REST_URL', options.withCredentials ? UPSTASH_URL : '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', options.withCredentials ? UPSTASH_TOKEN : '')
  vi.stubEnv('NODE_ENV', options.nodeEnv)

  return import('@/lib/security/ratelimit')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('production fail-closed policy', () => {
  it('denies the request when Upstash credentials are missing', async () => {
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'production' })

    const result = await checkRateLimit('203.0.113.7')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.limit).toBe(RATE_LIMIT_MAX_REQUESTS)
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('denies the request when the limiter fails', async () => {
    stubFailingRedis()

    const { checkRateLimit } = await loadRateLimit({
      nodeEnv: 'production',
      withCredentials: true,
    })

    const result = await checkRateLimit('203.0.113.7')

    // The denial must come from a configured-but-failing Redis, not from the
    // unconfigured path: the limiter is consulted, fails, and only then denies.
    expect(fetch).toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.limit).toBe(RATE_LIMIT_MAX_REQUESTS)
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('reports the per-type maximum while denying', async () => {
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'production' })

    const general = await checkRateLimit('203.0.113.7', 'general')
    const auth = await checkRateLimit('203.0.113.7', 'auth')
    const ai = await checkRateLimit('203.0.113.7', 'ai')

    expect(general.limit).toBe(RATE_LIMIT_MAX_REQUESTS)
    expect(auth.limit).toBe(AUTH_RATE_LIMIT_MAX)
    expect(ai.limit).toBe(AI_RATE_LIMIT_MAX)
    expect([general.success, auth.success, ai.success]).toEqual([false, false, false])
  })
})

describe('development in-memory fallback', () => {
  it('allows the first request and decrements remaining', async () => {
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'development' })

    const first = await checkRateLimit('dev-client')
    const second = await checkRateLimit('dev-client')

    expect(first.success).toBe(true)
    expect(first.remaining).toBe(RATE_LIMIT_MAX_REQUESTS - 1)
    expect(second.success).toBe(true)
    expect(second.remaining).toBe(RATE_LIMIT_MAX_REQUESTS - 2)
  })

  it('denies the request past the maximum for the type', async () => {
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'development' })

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      expect((await checkRateLimit('dev-client', 'auth')).success).toBe(true)
    }

    const denied = await checkRateLimit('dev-client', 'auth')

    expect(denied.success).toBe(false)
    expect(denied.remaining).toBe(0)
    expect(denied.limit).toBe(AUTH_RATE_LIMIT_MAX)
  })

  it('counts each identifier separately', async () => {
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'development' })

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      await checkRateLimit('exhausted-client', 'auth')
    }

    expect((await checkRateLimit('exhausted-client', 'auth')).success).toBe(false)

    const other = await checkRateLimit('other-client', 'auth')

    expect(other.success).toBe(true)
    expect(other.remaining).toBe(AUTH_RATE_LIMIT_MAX - 1)
  })

  it('allows the identifier again once the window has elapsed', async () => {
    vi.useFakeTimers()
    const { checkRateLimit } = await loadRateLimit({ nodeEnv: 'development' })

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      await checkRateLimit('dev-client', 'auth')
    }

    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS - 1)

    expect((await checkRateLimit('dev-client', 'auth')).success).toBe(false)

    vi.advanceTimersByTime(2)

    const fresh = await checkRateLimit('dev-client', 'auth')

    expect(fresh.success).toBe(true)
    expect(fresh.remaining).toBe(AUTH_RATE_LIMIT_MAX - 1)
  })

  it('falls back to the in-memory counter when the limiter fails', async () => {
    stubFailingRedis()

    const { checkRateLimit } = await loadRateLimit({
      nodeEnv: 'development',
      withCredentials: true,
    })

    const first = await checkRateLimit('dev-client')
    const second = await checkRateLimit('dev-client')

    expect(first.success).toBe(true)
    expect(first.remaining).toBe(RATE_LIMIT_MAX_REQUESTS - 1)
    expect(second.remaining).toBe(RATE_LIMIT_MAX_REQUESTS - 2)
  })
})

describe('isRateLimitingEnabled', () => {
  it('is false without Upstash credentials', async () => {
    const { isRateLimitingEnabled } = await loadRateLimit({ nodeEnv: 'production' })

    expect(isRateLimitingEnabled()).toBe(false)
  })

  it('is true when both credentials are present', async () => {
    const { isRateLimitingEnabled } = await loadRateLimit({
      nodeEnv: 'production',
      withCredentials: true,
    })

    expect(isRateLimitingEnabled()).toBe(true)
  })
})

describe('timeout policy (regression)', () => {
  it('denies the request when the limiter times out rather than erroring', async () => {
    // `@upstash/ratelimit` resolves — it does not reject — when its internal 5s
    // timeout fires, with `{ success: true, reason: 'timeout' }`. A Redis hang
    // is the failure most likely under heavy load, and returning `success: true`
    // there silently disabled rate limiting at the worst possible moment.
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')

    // Never settles: any real round trip in this test would be a bug.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    )

    const { checkRateLimit } = await import('@/lib/security/ratelimit')

    vi.useFakeTimers()
    const resultPromise = checkRateLimit('timed-out-identifier', 'general')
    // Push past the SDK's 5s internal deadline.
    await vi.advanceTimersByTimeAsync(5001)
    const result = await resultPromise
    vi.useRealTimers()

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)

    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
})
