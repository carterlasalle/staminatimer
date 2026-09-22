import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as CsrfModule from '@/lib/security/csrf'
import {
  generateCSRFToken,
  validateCSRFToken,
  validateCSRFTokenWithCookie,
} from '@/lib/security/csrf'

const HEX_64 = /^[0-9a-f]{64}$/
const TOKEN_MAX_AGE_MS = 15 * 60 * 1000

/** Split a generated token into its parts; throws rather than silently passing. */
function partsOf(token: string): [string, string, string] {
  const parts = token.split(':')

  if (parts.length !== 3) {
    throw new Error(`expected 3 parts, got ${parts.length}`)
  }

  return [parts[0], parts[1], parts[2]]
}

/** Flip one hex digit so length is preserved (a length change would short-circuit). */
function flipHexDigit(hex: string): string {
  const head = hex.slice(0, -1)
  const last = hex.slice(-1)

  return head + (last === '0' ? '1' : '0')
}

/** The module snapshots `CSRF_SECRET` at import time, so a fresh secret needs a fresh module. */
async function loadWithSecret(secret: string): Promise<typeof CsrfModule> {
  vi.resetModules()
  vi.stubEnv('CSRF_SECRET', secret)

  return import('@/lib/security/csrf')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('token structure', () => {
  it('is token:timestamp:signature with a 64-hex token and 64-hex signature', async () => {
    const before = Date.now()
    const token = await generateCSRFToken()
    const after = Date.now()

    const [rand, timestamp, signature] = partsOf(token)

    expect(rand).toMatch(HEX_64)
    expect(signature).toMatch(HEX_64)

    // The timestamp must be a plausible wall-clock ms value for `now`, not
    // merely numeric — a reset epoch or 0 would still "parse".
    const ms = Number(timestamp)
    expect(Number.isInteger(ms)).toBe(true)
    expect(ms).toBeGreaterThanOrEqual(before)
    expect(ms).toBeLessThanOrEqual(after)
  })

  it('returns a different token on each call', async () => {
    const first = await generateCSRFToken()
    const second = await generateCSRFToken()

    expect(second).not.toBe(first)
  })
})

describe('validation accepts', () => {
  it('a freshly generated token', async () => {
    const token = await generateCSRFToken()

    expect(await validateCSRFToken(token)).toBe(true)
  })
})

describe('validation rejects', () => {
  it('an empty string', async () => {
    expect(await validateCSRFToken('')).toBe(false)
  })

  it('a non-string value, even though the type says string', async () => {
    expect(await validateCSRFToken(undefined as unknown as string)).toBe(false)
    expect(await validateCSRFToken(12345 as unknown as string)).toBe(false)
  })

  it('a bare token with no timestamp or signature', async () => {
    const [rand] = partsOf(await generateCSRFToken())

    expect(await validateCSRFToken(rand)).toBe(false)
  })

  it('a token with only 2 parts', async () => {
    const [rand, timestamp] = partsOf(await generateCSRFToken())

    expect(await validateCSRFToken(`${rand}:${timestamp}`)).toBe(false)
  })

  it('a token with 4 parts', async () => {
    const token = await generateCSRFToken()

    expect(await validateCSRFToken(`${token}:extra`)).toBe(false)
  })

  it('a token whose signature has one hex digit changed', async () => {
    const [rand, timestamp, signature] = partsOf(await generateCSRFToken())

    expect(await validateCSRFToken(`${rand}:${timestamp}:${flipHexDigit(signature)}`)).toBe(false)
  })

  it('a token whose payload changed but the original signature was kept', async () => {
    const [rand, timestamp, signature] = partsOf(await generateCSRFToken())

    expect(await validateCSRFToken(`${flipHexDigit(rand)}:${timestamp}:${signature}`)).toBe(false)
  })

  it('a non-numeric timestamp', async () => {
    const [rand, , signature] = partsOf(await generateCSRFToken())

    expect(await validateCSRFToken(`${rand}:abc:${signature}`)).toBe(false)
  })
})

describe('expiry', () => {
  const base = new Date('2026-01-01T00:00:00.000Z').getTime()

  it('accepts a token 14m59s old and rejects one 15m1s old', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(base)

    // Generated under the fake clock so the embedded timestamp matches the
    // moment the age is measured against.
    const token = await generateCSRFToken()

    vi.setSystemTime(base + TOKEN_MAX_AGE_MS - 1000)
    expect(await validateCSRFToken(token)).toBe(true)

    vi.setSystemTime(base + TOKEN_MAX_AGE_MS + 1000)
    expect(await validateCSRFToken(token)).toBe(false)
  })

  it('accepts a token at exactly 15m old', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(base)

    const token = await generateCSRFToken()

    // Pins the boundary operator: the age check must be `>`, not `>=`.
    vi.setSystemTime(base + TOKEN_MAX_AGE_MS)
    expect(await validateCSRFToken(token)).toBe(true)
  })
})

describe('secret binding', () => {
  it('rejects a token signed under a different secret', async () => {
    const withA = await loadWithSecret('secret-a')
    const token = await withA.generateCSRFToken()

    const withB = await loadWithSecret('secret-b')

    // Proves the signature is computed from the module's secret rather than
    // re-derived from the token itself (which would validate everywhere).
    expect(await withB.validateCSRFToken(token)).toBe(false)
    expect(await withA.validateCSRFToken(token)).toBe(true)
  })
})

describe('validateCSRFTokenWithCookie', () => {
  it('rejects a valid header token when the cookie is missing', async () => {
    const token = await generateCSRFToken()

    expect(await validateCSRFTokenWithCookie(token, null)).toBe(false)
    expect(await validateCSRFTokenWithCookie(token, undefined)).toBe(false)
    expect(await validateCSRFTokenWithCookie(token, '')).toBe(false)
  })

  it('rejects when the cookie differs from the header token', async () => {
    const token = await generateCSRFToken()
    const other = await generateCSRFToken()

    expect(await validateCSRFTokenWithCookie(token, other)).toBe(false)
  })

  it('accepts when the cookie matches and the token is valid', async () => {
    const token = await generateCSRFToken()

    expect(await validateCSRFTokenWithCookie(token, token)).toBe(true)
  })

  it('rejects when the cookie matches but the token is expired', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z').getTime())

    const token = await generateCSRFToken()

    vi.setSystemTime(Date.now() + TOKEN_MAX_AGE_MS + 1000)

    // The cookie binding must not bypass signature/expiry checking.
    expect(await validateCSRFTokenWithCookie(token, token)).toBe(false)
  })
})
