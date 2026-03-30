import type { NextRequest } from 'next/server'

function toOrigin(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin)
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'
    )
  } catch {
    return false
  }
}

/**
 * Validate request origin/referer against a strict allowlist of exact origins.
 * This prevents lookalike-domain bypasses that can happen with prefix matching.
 */
export function isAllowedRequestOrigin(
  request: NextRequest,
  allowedOrigins: Array<string | null | undefined>
): boolean {
  const normalizedAllowed = new Set(
    allowedOrigins
      .map((origin) => toOrigin(origin))
      .filter((origin): origin is string => Boolean(origin))
  )

  const originHeader = toOrigin(request.headers.get('origin'))
  const refererHeader = toOrigin(request.headers.get('referer'))

  if (originHeader) {
    if (process.env.NODE_ENV === 'development' && isLocalhostOrigin(originHeader)) {
      return true
    }
    return normalizedAllowed.has(originHeader)
  }

  if (refererHeader) {
    if (process.env.NODE_ENV === 'development' && isLocalhostOrigin(refererHeader)) {
      return true
    }
    return normalizedAllowed.has(refererHeader)
  }

  // Same-origin fallback for requests without Origin/Referer headers.
  const requestOrigin = toOrigin(request.nextUrl.origin)
  if (requestOrigin) {
    if (process.env.NODE_ENV === 'development' && isLocalhostOrigin(requestOrigin)) {
      return true
    }
    return normalizedAllowed.has(requestOrigin)
  }

  return false
}
