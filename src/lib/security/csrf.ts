// CSRF secret must be set as environment variable for production
// In development, use a fallback but log a warning
const CSRF_SECRET = process.env.CSRF_SECRET

if (!CSRF_SECRET && typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    console.error('CSRF_SECRET environment variable must be set in production')
  } else {
    console.warn('WARNING: CSRF_SECRET not set. Using insecure fallback for development only.')
  }
}

// Use the secret or fallback to a development-only value
const SECRET = CSRF_SECRET || 'development-csrf-secret-do-not-use-in-production'
const TOKEN_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes

// Text encoder for Web Crypto API
const encoder = new TextEncoder()

/**
 * Generate random bytes using Web Crypto API (Edge compatible)
 */
function getRandomBytes(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create HMAC signature using Web Crypto API (Edge compatible)
 */
async function createHmacSignature(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate a CSRF token
 * Format: token:timestamp:signature
 */
export async function generateCSRFToken(): Promise<string> {
  const token = getRandomBytes(32)
  const timestamp = Date.now().toString()
  const signature = await createHmacSignature(`${token}:${timestamp}`, SECRET)

  return `${token}:${timestamp}:${signature}`
}

/**
 * Validate a CSRF token
 * Returns true if valid, false otherwise
 */
export async function validateCSRFToken(tokenString: string): Promise<boolean> {
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
  const expectedSignature = await createHmacSignature(`${token}:${timestamp}`, SECRET)

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
