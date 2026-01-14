import { createHmac, randomBytes } from 'crypto'

// Use environment variable or fallback for CSRF secret
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-dev-secret'
const TOKEN_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Generate a CSRF token
 * Format: token:timestamp:signature
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${token}:${timestamp}`)
    .digest('hex')

  return `${token}:${timestamp}:${signature}`
}

/**
 * Validate a CSRF token
 * Returns true if valid, false otherwise
 */
export function validateCSRFToken(tokenString: string): boolean {
  if (!tokenString || typeof tokenString !== 'string') {
    return false
  }

  const parts = tokenString.split(':')
  if (parts.length !== 3) {
    return false
  }

  const [token, timestamp, signature] = parts

  // Check token age
  const tokenAge = Date.now() - parseInt(timestamp, 10)
  if (isNaN(tokenAge) || tokenAge > TOKEN_MAX_AGE_MS) {
    return false
  }

  // Verify signature
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(`${token}:${timestamp}`)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature)
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Middleware helper to validate CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get('X-CSRF-Token') || headers.get('x-csrf-token')
}
