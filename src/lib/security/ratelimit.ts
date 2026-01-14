import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { API_CONSTANTS } from '@/lib/constants'

// Check if Upstash credentials are available
const hasUpstashCredentials = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// Create Redis client only if credentials are available
const redis = hasUpstashCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

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
 * Falls back to allowing the request if Redis is not configured
 */
export async function checkRateLimit(
  identifier: string,
  type: 'general' | 'auth' | 'ai' = 'general'
): Promise<RateLimitResult> {
  const limiter =
    type === 'auth' ? authRatelimit : type === 'ai' ? aiRatelimit : generalRatelimit

  // If Redis is not configured, allow the request (fallback behavior)
  if (!limiter) {
    const maxRequests =
      type === 'auth'
        ? API_CONSTANTS.AUTH_RATE_LIMIT_MAX
        : type === 'ai'
          ? API_CONSTANTS.AI_RATE_LIMIT_MAX
          : API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Date.now() + API_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    }
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    return { success, limit, remaining, reset }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // On error, allow the request to prevent blocking legitimate users
    return {
      success: true,
      limit: API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
      remaining: API_CONSTANTS.RATE_LIMIT_MAX_REQUESTS - 1,
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
