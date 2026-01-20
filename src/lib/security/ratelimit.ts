import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { API_CONSTANTS } from '@/lib/constants'

// Check if Upstash credentials are available
const hasUpstashCredentials = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// SECURITY: Log warning in production if Redis is not configured
if (!hasUpstashCredentials && process.env.NODE_ENV === 'production') {
  console.error(
    'SECURITY WARNING: Rate limiting Redis is not configured in production! ' +
    'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
  )
}

// Create Redis client only if credentials are available
const redis = hasUpstashCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// In-memory fallback rate limiter for development/testing
// IMPORTANT: This does NOT work across serverless instances - only for local dev
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

function inMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  const key = identifier
  const existing = inMemoryStore.get(key)

  if (!existing || existing.resetAt < now) {
    // New window
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  existing.count++
  return { success: true, remaining: maxRequests - existing.count }
}

/**
 * General API rate limiter (60 requests per minute)
 */
export const generalRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
        '60 s'
      ),
      analytics: true,
      prefix: 'ratelimit:general',
    })
  : null

/**
 * Auth route rate limiter (10 requests per minute)
 */
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(API_CONSTANTS.AUTH_RATE_LIMIT_MAX, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * AI API rate limiter (10 requests per minute)
 */
export const aiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(API_CONSTANTS.AI_RATE_LIMIT_MAX, '60 s'),
      analytics: true,
      prefix: 'ratelimit:ai',
    })
  : null

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for a given identifier
 *
 * SECURITY POLICY:
 * - In production: Fails CLOSED (blocks requests) if Redis is unavailable or errors
 * - In development: Uses in-memory fallback for local testing
 */
export async function checkRateLimit(
  identifier: string,
  type: 'general' | 'auth' | 'ai' = 'general'
): Promise<RateLimitResult> {
  const limiter =
    type === 'auth' ? authRatelimit : type === 'ai' ? aiRatelimit : generalRatelimit

  const maxRequests =
    type === 'auth'
      ? API_CONSTANTS.AUTH_RATE_LIMIT_MAX
      : type === 'ai'
        ? API_CONSTANTS.AI_RATE_LIMIT_MAX
        : API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS

  // If Redis is not configured
  if (!limiter) {
    // SECURITY: In production, fail CLOSED - deny the request
    if (process.env.NODE_ENV === 'production') {
      console.error('Rate limiting unavailable in production - blocking request')
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
      }
    }

    // In development, use in-memory fallback (with warning)
    console.warn('Using in-memory rate limiting (development only)')
    const { success, remaining } = inMemoryRateLimit(
      `${type}:${identifier}`,
      maxRequests,
      API_CONSTANTS.RATE_LIMIT_WINDOW_MS
    )
    return {
      success,
      limit: maxRequests,
      remaining,
      reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    }
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    return { success, limit, remaining, reset }
  } catch (error) {
    console.error('Rate limit check failed:', error)

    // SECURITY: In production, fail CLOSED - deny the request on error
    if (process.env.NODE_ENV === 'production') {
      console.error('Rate limiting error in production - blocking request for safety')
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
      }
    }

    // In development, use in-memory fallback on error
    console.warn('Redis error, falling back to in-memory rate limiting')
    const { success, remaining } = inMemoryRateLimit(
      `${type}:${identifier}`,
      maxRequests,
      API_CONSTANTS.RATE_LIMIT_WINDOW_MS
    )
    return {
      success,
      limit: maxRequests,
      remaining,
      reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    }
  }
}

/**
 * Check if rate limiting is properly configured
 */
export function isRateLimitingEnabled(): boolean {
  return hasUpstashCredentials && redis !== null
}
