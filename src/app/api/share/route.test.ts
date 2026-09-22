import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_CONSTANTS } from '@/lib/constants'
import { generateCSRFToken, validateCSRFTokenWithCookie } from '@/lib/security/csrf'
import { POST } from './route'

const SHARE_URL = 'https://www.staminatimer.com/api/share'
const USER_ID = 'user-1'
const SESSION_A = '11111111-1111-4111-8111-111111111111'
const SESSION_B = '22222222-2222-4222-8222-222222222222'
const MAX_BODY_SIZE = 50 * 1024

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  isAllowedRequestOrigin: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  cookies: vi.fn(),
  createClientArgs: [] as unknown[],
}))

// Every collaborator that answers a security question is replaced, so the only
// thing under test is how the route turns those answers into a status code.
vi.mock('@/lib/security/ratelimit', () => ({ checkRateLimit: mocks.checkRateLimit }))
vi.mock('@/lib/security/origin', () => ({ isAllowedRequestOrigin: mocks.isAllowedRequestOrigin }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => {
    mocks.createClientArgs.push(args)

    return {
      auth: { getUser: mocks.getUser },
      from: mocks.from,
    }
  },
}))
vi.mock('next/headers', () => ({ cookies: mocks.cookies }))
// Spy mode keeps CSRF real (only real tokens pass) while leaving the answer
// overridable for the branch where the validator rejects.
vi.mock('@/lib/security/csrf', { spy: true })

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

interface DbRecord {
  table: string
  ids: string[]
  ownerFilter: string | null
  inserted: Record<string, unknown> | null
}

interface DbChain extends PromiseLike<QueryResult> {
  select: (columns?: string) => DbChain
  in: (column: string, values: string[]) => DbChain
  eq: (column: string, value: string) => DbChain
  insert: (payload: Record<string, unknown>) => DbChain
  single: () => Promise<QueryResult>
}

interface SupabaseCookieAdapter {
  getAll: () => unknown[]
  setAll: (
    cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>
  ) => void
}

const db = {
  sessions: { data: [] as unknown[], error: null } as QueryResult,
  share: { data: { id: 'share-created' }, error: null } as QueryResult,
  calls: [] as DbRecord[],
}

/** Supabase query builders are thenable, so a chain has to satisfy `await`. */
function createChain(table: string, result: QueryResult): DbChain {
  const record: DbRecord = { table, ids: [], ownerFilter: null, inserted: null }

  db.calls.push(record)

  const chain: DbChain = {
    select: () => chain,
    in: (_column, values) => {
      record.ids = values

      return chain
    },
    eq: (_column, value) => {
      record.ownerFilter = value

      return chain
    },
    insert: (payload) => {
      record.inserted = payload

      return chain
    },
    single: () => Promise.resolve(result),
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  }

  return chain
}

/** The double-submit pair a browser would hold; `null` omits that half. */
let csrfPair = { csrfHeader: null as string | null, csrfCookie: null as string | null }

function shareRequest(options: {
  body?: unknown
  rawBody?: string
  csrfHeader?: string | null
  csrfCookie?: string | null
  contentLength?: string
}): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' })
  const csrfHeader = options.csrfHeader === undefined ? csrfPair.csrfHeader : options.csrfHeader
  const csrfCookie = options.csrfCookie === undefined ? csrfPair.csrfCookie : options.csrfCookie

  if (csrfHeader !== null) {
    headers.set('X-CSRF-Token', csrfHeader)
  }

  if (csrfCookie !== null) {
    headers.set('cookie', `csrf-token=${csrfCookie}`)
  }

  if (options.contentLength) {
    headers.set('content-length', options.contentLength)
  }

  const body =
    options.rawBody ?? JSON.stringify(options.body ?? { sessionIds: [SESSION_A], duration: '24h' })

  return new NextRequest(SHARE_URL, { method: 'POST', headers, body })
}

function insertedShare(): Record<string, unknown> | null {
  return db.calls.find((call) => call.table === 'shared_sessions')?.inserted ?? null
}

describe('POST /api/share', () => {
  beforeEach(async () => {
    const token = await generateCSRFToken()

    csrfPair = { csrfHeader: token, csrfCookie: token }
    db.calls = []
    mocks.createClientArgs = []
    db.sessions = { data: [{ id: SESSION_A, user_id: USER_ID, edge_events: [] }], error: null }
    db.share = { data: { id: 'share-created' }, error: null }

    mocks.from.mockImplementation((table: string) =>
      createChain(table, table === 'sessions' ? db.sessions : db.share)
    )
    mocks.cookies.mockResolvedValue({ getAll: () => [], set: () => {} })
    mocks.isAllowedRequestOrigin.mockReturnValue(true)
    mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null })
    mocks.checkRateLimit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1_700_000_000_000,
    })

    // Failure paths below log on purpose; keep the run output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('origin and CSRF', () => {
    it('rejects a disallowed origin before touching the database', async () => {
      mocks.isAllowedRequestOrigin.mockReturnValue(false)

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid request origin' })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects a request with no CSRF header', async () => {
      const response = await POST(shareRequest({ csrfHeader: null }))

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid or missing CSRF token' })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects a CSRF token that does not match the cookie', async () => {
      const response = await POST(shareRequest({ csrfHeader: 'forged' }))

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid or missing CSRF token' })
      // The route must hand both halves of the double-submit pair to the validator.
      expect(vi.mocked(validateCSRFTokenWithCookie)).toHaveBeenCalledWith(
        'forged',
        csrfPair.csrfCookie
      )
      expect(db.calls).toHaveLength(0)
    })

    it('rejects when the CSRF cookie is missing', async () => {
      const response = await POST(shareRequest({ csrfCookie: null }))

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid or missing CSRF token' })
      expect(vi.mocked(validateCSRFTokenWithCookie)).toHaveBeenCalledWith(csrfPair.csrfHeader, null)
      expect(db.calls).toHaveLength(0)
    })

    it('rejects when the CSRF validator refuses an otherwise well-formed pair', async () => {
      vi.mocked(validateCSRFTokenWithCookie).mockResolvedValueOnce(false)

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid or missing CSRF token' })
      expect(db.calls).toHaveLength(0)
    })
  })

  describe('body size', () => {
    it('rejects a body declared over the 50KB cap before authenticating', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await POST(shareRequest({ contentLength: String(MAX_BODY_SIZE + 1) }))

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({ error: 'Request body too large' })
      expect(db.calls).toHaveLength(0)
    })

    it('accepts a body exactly at the cap', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await POST(shareRequest({ contentLength: String(MAX_BODY_SIZE) }))

      // Past the size check, so the next rejection is authentication.
      expect(response.status).toBe(401)
    })
  })

  describe('authentication, ordering and rate limiting', () => {
    it('returns 401 when there is no user', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(db.calls).toHaveLength(0)
    })

    it('returns 401 when the session lookup itself errors', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid JWT' },
      })

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(db.calls).toHaveLength(0)
    })

    it('hands the Supabase client a cookie adapter backed by the Next cookie store', async () => {
      const getAll = vi.fn(() => [{ name: 'sb-access-token', value: 'stored' }])
      const set = vi.fn()

      mocks.cookies.mockResolvedValue({ getAll, set })

      await POST(shareRequest({}))

      const [, , config] = mocks.createClientArgs.at(-1) as [
        string,
        string,
        { cookies: SupabaseCookieAdapter },
      ]

      expect(config.cookies.getAll()).toEqual([{ name: 'sb-access-token', value: 'stored' }])

      config.cookies.setAll([{ name: 'sb-access-token', value: 'rotated', options: { path: '/' } }])

      expect(set).toHaveBeenCalledWith('sb-access-token', 'rotated', { path: '/' })
    })

    it('rejects a bad origin and a bad CSRF token ahead of authentication', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mocks.isAllowedRequestOrigin.mockReturnValue(false)
      const originRejection = await POST(shareRequest({}))

      mocks.isAllowedRequestOrigin.mockReturnValue(true)
      const csrfRejection = await POST(shareRequest({ csrfHeader: 'forged' }))

      expect(originRejection.status).toBe(403)
      await expect(originRejection.json()).resolves.toEqual({ error: 'Invalid request origin' })
      expect(csrfRejection.status).toBe(403)
      await expect(csrfRejection.json()).resolves.toEqual({
        error: 'Invalid or missing CSRF token',
      })
    })

    it('returns 401 rather than 429 when there is no user', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mocks.checkRateLimit.mockResolvedValue({
        success: false,
        limit: 60,
        remaining: 0,
        reset: 1_700_000_000_000,
      })

      const response = await POST(shareRequest({}))

      // Authentication precedes rate limiting.
      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    })

    it('returns 429 with retry metadata when the rate limiter denies', async () => {
      mocks.checkRateLimit.mockResolvedValue({
        success: false,
        limit: 60,
        remaining: 0,
        reset: 1_700_000_000_000,
      })

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(429)
      await expect(response.json()).resolves.toEqual({
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
      })
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000000000')
      expect(response.headers.get('Retry-After')).toBe('60')
      expect(mocks.checkRateLimit).toHaveBeenCalledWith(USER_ID, 'general')
      expect(db.calls).toHaveLength(0)
    })
  })

  describe('body validation', () => {
    it('rejects sessionIds that are missing, empty or not an array', async () => {
      for (const sessionIds of [undefined, [], 'not-an-array']) {
        const response = await POST(shareRequest({ body: { sessionIds, duration: '24h' } }))

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toEqual({
          error: 'sessionIds must be a non-empty array',
        })
      }

      expect(db.calls).toHaveLength(0)
    })

    it('rejects non-string session ids', async () => {
      const response = await POST(shareRequest({ body: { sessionIds: [42], duration: '24h' } }))

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid session ID format' })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects session ids that are not UUIDs', async () => {
      const response = await POST(
        shareRequest({ body: { sessionIds: ['../../etc/passwd'], duration: '24h' } })
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid session ID format' })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects more sessions than the server-side cap', async () => {
      const sessionIds = Array.from(
        { length: API_CONSTANTS.MAX_SHARE_SESSIONS + 1 },
        (_, index) => `${index.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`
      )

      const response = await POST(shareRequest({ body: { sessionIds, duration: '24h' } }))

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: `Cannot share more than ${API_CONSTANTS.MAX_SHARE_SESSIONS} sessions at once`,
      })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects a duration outside the allowed set', async () => {
      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A], duration: '2h' } })
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: 'Invalid duration. Must be one of: 1h, 24h, 7d, 30d, infinite',
      })
      expect(db.calls).toHaveLength(0)
    })

    it('rejects a missing duration', async () => {
      const response = await POST(shareRequest({ body: { sessionIds: [SESSION_A] } }))

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: 'Invalid duration. Must be one of: 1h, 24h, 7d, 30d, infinite',
      })
      expect(db.calls).toHaveLength(0)
    })

    it('returns 500 when the body is not JSON', async () => {
      const response = await POST(shareRequest({ rawBody: 'not-json' }))

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({ error: 'Failed to create share link' })
      expect(db.calls).toHaveLength(0)
    })
  })

  describe('session ownership', () => {
    it('rejects sharing a session the user does not own, filtered by user_id', async () => {
      db.sessions = { data: [], error: null }

      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A], duration: '24h' } })
      )

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        error: 'One or more sessions not found or not authorized',
      })
      expect(db.calls[0]).toMatchObject({
        table: 'sessions',
        ids: [SESSION_A],
        ownerFilter: USER_ID,
      })
      expect(insertedShare()).toBeNull()
    })

    it('rejects a partial ownership match', async () => {
      db.sessions = { data: [{ id: SESSION_A, user_id: USER_ID }], error: null }

      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A, SESSION_B], duration: '24h' } })
      )

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        error: 'One or more sessions not found or not authorized',
      })
      expect(insertedShare()).toBeNull()
    })

    it('returns 500 when the session lookup fails', async () => {
      db.sessions = { data: null, error: { message: 'connection reset' } }

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch sessions' })
      expect(insertedShare()).toBeNull()
    })

    it('returns 500 when the share insert fails', async () => {
      db.share = { data: null, error: { message: 'unique violation' } }

      const response = await POST(shareRequest({}))

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({ error: 'Failed to create share link' })
    })
  })

  describe('successful share', () => {
    it('creates a share link for a finite duration', async () => {
      const sessions = [{ id: SESSION_A, user_id: USER_ID, edge_events: [] }]
      db.sessions = { data: sessions, error: null }

      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A], duration: '1h' } })
      )

      expect(response.status).toBe(200)

      const body = (await response.json()) as { shareId: string; expiresAt: string }
      const expiresInMs = new Date(body.expiresAt).getTime() - Date.now()

      expect(body.shareId).toBe('share-created')
      expect(expiresInMs).toBeGreaterThan(60 * 60 * 1000 - 10_000)
      expect(expiresInMs).toBeLessThan(60 * 60 * 1000 + 10_000)
      expect(insertedShare()).toEqual({
        sessions_data: sessions,
        expires_at: body.expiresAt,
        created_by: USER_ID,
      })
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
    })

    it('stores a null expiry for an infinite share', async () => {
      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A], duration: 'infinite' } })
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        shareId: 'share-created',
        expiresAt: null,
      })
      expect(insertedShare()).toMatchObject({ expires_at: null, created_by: USER_ID })
    })

    it('deduplicates repeated session ids before verifying ownership', async () => {
      db.sessions = { data: [{ id: SESSION_A, user_id: USER_ID }], error: null }

      const response = await POST(
        shareRequest({ body: { sessionIds: [SESSION_A, SESSION_A], duration: '24h' } })
      )

      expect(response.status).toBe(200)
      expect(db.calls[0].ids).toEqual([SESSION_A])
    })
  })
})
