import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { API_CONSTANTS } from '@/lib/constants'

// Rate limiting is handled by Redis when available (see lib/security/ratelimit.ts)
// This middleware provides fallback cookie-based rate limiting and authentication

const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX } = API_CONSTANTS

function parseRateLimitCookie(cookie: string | undefined): number[] {
  if (!cookie) return []
  try {
    const timestamps = JSON.parse(cookie) as number[]
    const now = Date.now()
    // Filter out old timestamps
    return timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
  } catch {
    return []
  }
}

function checkRateLimitCookie(
  timestamps: number[],
  maxRequests: number
): { allowed: boolean; remaining: number; timestamps: number[] } {
  const now = Date.now()
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)

  if (recentTimestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0, timestamps: recentTimestamps }
  }

  recentTimestamps.push(now)
  return {
    allowed: true,
    remaining: maxRequests - recentTimestamps.length,
    timestamps: recentTimestamps,
  }
}

function hashClientIdentifier(ip: string): string {
  // Hash the full IP to avoid collisions while maintaining consistency
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Rate limiting for auth-related endpoints (login, signup, password reset)
  const isAuthRoute = pathname === '/login' || pathname === '/auth/callback'
  const isApiRoute = pathname.startsWith('/api/')

  // Get client identifier (IP or fallback)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   'anonymous'

  // Create rate limit cookie name based on route type and hashed IP
  // Using hash of full IP to avoid collisions while maintaining consistency
  const ipHash = hashClientIdentifier(clientIp)
  const rateLimitCookieName = isAuthRoute ? `rl_auth_${ipHash}` : `rl_gen_${ipHash}`
  const maxRequests = isAuthRoute ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS

  // Parse existing rate limit data
  const existingCookie = req.cookies.get(rateLimitCookieName)?.value
  const timestamps = parseRateLimitCookie(existingCookie)

  // Check rate limit using cookie-based fallback
  const { allowed, remaining, timestamps: newTimestamps } = checkRateLimitCookie(timestamps, maxRequests)

  if (!allowed) {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: 60,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    )
    return response
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid adding code between createServerClient and supabase.auth.getUser()
  // as per Supabase docs to prevent hard-to-debug auth issues.

  // Refresh session if expired - Required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/license', '/privacy', '/terms', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(pathname) ||
                        pathname.startsWith('/share/') ||
                        pathname === '/offline.html' ||
                        isApiRoute

  // If user is not signed in and the route is protected, redirect to login
  if (!user && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Set rate limit cookie with updated timestamps
  supabaseResponse.cookies.set(rateLimitCookieName, JSON.stringify(newTimestamps), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60, // 1 minute
    path: '/',
  })

  // Add rate limit headers to response
  supabaseResponse.headers.set('X-RateLimit-Limit', String(maxRequests))
  supabaseResponse.headers.set('X-RateLimit-Remaining', String(remaining))

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
