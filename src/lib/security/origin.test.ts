import type { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAllowedRequestOrigin } from './origin'

const SITE_ORIGIN = 'https://www.staminatimer.com'

function makeRequest(headers: Record<string, string>, url = `${SITE_ORIGIN}/page`): NextRequest {
  const request = { headers: new Headers(headers), nextUrl: new URL(url) }

  // isAllowedRequestOrigin only reads headers.get() and nextUrl.origin, so a real
  // Headers and URL stand in for the full NextRequest without faking either.
  const nextRequest = request as NextRequest

  return nextRequest
}

describe('lookalike domains', () => {
  const allowed = [SITE_ORIGIN]

  it('rejects a domain that merely embeds the allowed host', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'https://staminatimer.com.evil.com' }), allowed)
    ).toBe(false)
  })

  it('rejects a hyphen-prefixed lookalike', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'https://evil-staminatimer.com' }), allowed)
    ).toBe(false)
  })

  it('rejects a TLD-swapped lookalike', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'https://staminatimer.com.evil' }), allowed)
    ).toBe(false)
  })

  it('rejects a missing-separator lookalike', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'https://notstaminatimer.com' }), allowed)
    ).toBe(false)
  })

  it('rejects a lookalike that literally starts with the allowed origin', () => {
    // The prefix-matching bypass this module exists to close.
    expect(
      isAllowedRequestOrigin(
        makeRequest({ origin: 'https://www.staminatimer.com.evil.com' }),
        allowed
      )
    ).toBe(false)
  })
})

describe('allowlist matching', () => {
  it('accepts an exact origin match', () => {
    expect(isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), [SITE_ORIGIN])).toBe(true)
  })

  it('rejects a different real origin from the same site', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'https://staminatimer.com' }), [SITE_ORIGIN])
    ).toBe(false)
  })

  it('matches an allowlist entry that carries a path', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), [`${SITE_ORIGIN}/app/dashboard`])
    ).toBe(true)
  })

  it('matches an allowlist entry with a trailing slash', () => {
    expect(isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), [`${SITE_ORIGIN}/`])).toBe(
      true
    )
  })

  it('ignores an unparseable allowlist entry but keeps the valid ones', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), ['not a url', SITE_ORIGIN])
    ).toBe(true)
  })

  it('rejects everything when every allowlist entry is invalid', () => {
    expect(isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), ['not a url', '://'])).toBe(
      false
    )
  })

  it('treats null and undefined allowlist entries as absent', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: SITE_ORIGIN }), [null, undefined, SITE_ORIGIN])
    ).toBe(true)
    // An absent entry must not be normalised into anything that can match.
    expect(isAllowedRequestOrigin(makeRequest({}), [null, undefined])).toBe(false)
  })
})

describe('scheme and case', () => {
  it('rejects http against an allowlisted https origin', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'http://www.staminatimer.com' }), [SITE_ORIGIN])
    ).toBe(false)
  })

  it('matches uppercase scheme and host against a lowercase allowlist entry', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'HTTPS://WWW.STAMINATIMER.COM' }), [SITE_ORIGIN])
    ).toBe(true)
  })
})

describe('header precedence', () => {
  it('rejects when origin is disallowed even though referer is allowed', () => {
    expect(
      isAllowedRequestOrigin(
        makeRequest({ origin: 'https://evil.com', referer: `${SITE_ORIGIN}/page` }),
        [SITE_ORIGIN]
      )
    ).toBe(false)
  })

  it('accepts when origin is allowed even though referer is disallowed', () => {
    expect(
      isAllowedRequestOrigin(
        makeRequest({ origin: SITE_ORIGIN, referer: 'https://evil.com/page' }),
        [SITE_ORIGIN]
      )
    ).toBe(true)
  })
})

describe('nextUrl fallback', () => {
  it('accepts when neither header is present and nextUrl is allowlisted', () => {
    expect(isAllowedRequestOrigin(makeRequest({}), [SITE_ORIGIN])).toBe(true)
  })

  it('rejects when neither header is present and nextUrl is not allowlisted', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({}, 'https://www.other-site.com/page'), [SITE_ORIGIN])
    ).toBe(false)
  })
})

describe('malformed header values', () => {
  it('treats an empty origin as absent and falls through to referer', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: '', referer: `${SITE_ORIGIN}/page` }), [
        SITE_ORIGIN,
      ])
    ).toBe(true)
  })

  it('treats a non-URL origin as absent and falls through to referer', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'not a url', referer: `${SITE_ORIGIN}/page` }), [
        SITE_ORIGIN,
      ])
    ).toBe(true)
  })

  it('treats a scheme-only origin as absent and falls through to referer', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: '://', referer: `${SITE_ORIGIN}/page` }), [
        SITE_ORIGIN,
      ])
    ).toBe(true)
  })

  it('rejects when the malformed origin falls through to a disallowed referer', () => {
    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'not a url', referer: 'https://evil.com' }), [
        SITE_ORIGIN,
      ])
    ).toBe(false)
  })
})

describe('development localhost allowance', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts a localhost origin in development even though it is not allowlisted', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'http://localhost:3000' }), [SITE_ORIGIN])
    ).toBe(true)
  })

  it('accepts a 127.0.0.1 origin in development', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'http://127.0.0.1:3000' }), [SITE_ORIGIN])
    ).toBe(true)
  })

  it('rejects a localhost origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'http://localhost:3000' }), [SITE_ORIGIN])
    ).toBe(false)
  })

  it('rejects a 127.0.0.1 origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(
      isAllowedRequestOrigin(makeRequest({ origin: 'http://127.0.0.1:3000' }), [SITE_ORIGIN])
    ).toBe(false)
  })
})
