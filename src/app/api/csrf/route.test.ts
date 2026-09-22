import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateCSRFToken, validateCSRFToken } from '@/lib/security/csrf'
import { isAllowedRequestOrigin } from '@/lib/security/origin'
import { GET } from './route'

const CSRF_URL = 'https://www.staminatimer.com/api/csrf'

// The origin check is the only collaborator replaced here: the token itself is
// real, so the shape assertions below describe the token a browser receives.
vi.mock('@/lib/security/origin', () => ({ isAllowedRequestOrigin: vi.fn() }))

// Spy mode keeps the real token generator (so the shape below is the real wire
// format) while still allowing the failure path to be driven.
vi.mock('@/lib/security/csrf', { spy: true })

function csrfRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(CSRF_URL, { headers })
}

describe('GET /api/csrf', () => {
  beforeEach(() => {
    vi.mocked(isAllowedRequestOrigin).mockReturnValue(true)
    // The route logs token-generation failures; one test drives that path on purpose.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects a request from a disallowed origin without issuing a token', async () => {
    vi.mocked(isAllowedRequestOrigin).mockReturnValue(false)

    const response = await GET(csrfRequest({ origin: 'https://evil.example' }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request origin' })
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('issues a three-part token and binds it to the csrf-token cookie', async () => {
    const response = await GET(csrfRequest({ origin: 'https://www.staminatimer.com' }))

    expect(response.status).toBe(200)

    const { token } = (await response.json()) as { token: string }
    const parts = token.split(':')

    expect(parts).toHaveLength(3)
    expect(parts[0]).toMatch(/^[0-9a-f]{32,}$/)
    expect(parts[2]).toMatch(/^[0-9a-f]{32,}$/)

    const timestamp = Number(parts[1])

    expect(Number.isFinite(timestamp)).toBe(true)
    expect(Math.abs(Date.now() - timestamp)).toBeLessThan(60_000)

    // A token the client can actually present on the next request.
    await expect(validateCSRFToken(token)).resolves.toBe(true)

    const cookie = response.cookies.get('csrf-token')

    expect(cookie?.value).toBe(token)
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('strict')
    expect(cookie?.path).toBe('/')
    expect(cookie?.maxAge).toBe(15 * 60)
  })

  it('marks the token response as uncacheable', async () => {
    const response = await GET(csrfRequest({ origin: 'https://www.staminatimer.com' }))

    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('pragma')).toBe('no-cache')
  })

  it('returns 500 without a token when generation fails', async () => {
    vi.mocked(generateCSRFToken).mockRejectedValueOnce(new Error('crypto unavailable'))

    const response = await GET(csrfRequest({ origin: 'https://www.staminatimer.com' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to generate CSRF token' })
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
