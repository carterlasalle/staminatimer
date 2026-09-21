import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_CONSTANTS } from '@/lib/constants'
import {
  isMarkdownNegotiable,
  isPrivatePath,
  MARKDOWN_PATH_HEADER,
  wantsMarkdown,
} from '@/lib/agent-discovery'

// Rate limiting is handled by Redis when available (see lib/security/ratelimit.ts)
// This middleware provides fallback cookie-based rate limiting and authentication

const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX } = API_CONSTANTS

function parseRateLimitCookie(cookie: string | undefined): number[] {
  if (!cookie) return []

  try {
    const timestamps = JSON.parse(cookie) as number[]
    const now = Date.now()

    // Filter out old timestamps
    return timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS)
  } catch {
    return []
  }
}

function checkRateLimitCookie(
  timestamps: number[],
  maxRequests: number
): { allowed: boolean; remaining: number; timestamps: number[] } {
  const now = Date.now()
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS)

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

// Hash using Web Crypto API (Edge compatible)
async function hashClientIdentifier(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Rate limiting for auth-related endpoints (login, signup, password reset)
  const isAuthRoute = pathname === '/login' || pathname === '/auth/callback'

  // Get client identifier (IP or fallback)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'

  // Create rate limit cookie name based on route type and hashed IP
  // Using hash of full IP to avoid collisions while maintaining consistency
  const ipHash = await hashClientIdentifier(clientIp)
  const rateLimitCookieName = isAuthRoute ? `rl_auth_${ipHash}` : `rl_gen_${ipHash}`
  const maxRequests = isAuthRoute ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS

  // Parse existing rate limit data
  const existingCookie = req.cookies.get(rateLimitCookieName)?.value
  const timestamps = parseRateLimitCookie(existingCookie)

  // Check rate limit using cookie-based fallback
  const {
    allowed,
    remaining,
    timestamps: newTimestamps,
  } = checkRateLimitCookie(timestamps, maxRequests)

  if (!allowed) {
    const wantsHtml = (req.headers.get('accept') ?? '').includes('text/html')

    // A page navigation should not drop the visitor onto a raw JSON blob.
    const body = wantsHtml
      ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slow down for a moment</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111518;color:#e6ecee;font:16px/1.6 system-ui,sans-serif}main{max-width:34rem;padding:2rem}h1{font-size:1.375rem;margin:0 0 .75rem}p{margin:0 0 .5rem;color:#a3b0b6}</style></head><body><main><h1>Slow down for a moment</h1><p>You have made a lot of requests in a short time. Please try again in about a minute.</p><p>Nothing was lost.</p></main></body></html>`
      : JSON.stringify({
          error: 'Too many requests. Please wait a moment before trying again.',
          retryAfter: 60,
        })

    return new NextResponse(body, {
      status: 429,
      headers: {
        'Content-Type': wantsHtml ? 'text/html; charset=utf-8' : 'application/json',
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
    })
  }

  // "Markdown for Agents": an agent asking for markdown gets a markdown
  // rendering of the same crawlable page. Placed after the rate limit so this
  // route is throttled like any other, and before the session refresh because
  // only signed-out pages are eligible.
  if (wantsMarkdown(req.headers.get('accept')) && isMarkdownNegotiable(pathname)) {
    const url = req.nextUrl.clone()
    const headers = new Headers(req.headers)

    url.pathname = '/api/markdown'
    url.search = ''

    // Sent as a request header rather than a query parameter: the rewritten
    // target does not carry a query string set on the rewrite URL.
    headers.set(MARKDOWN_PATH_HEADER, pathname)

    return NextResponse.rewrite(url, { request: { headers } })
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

  // Only pages that actually hold user data require a session. Everything else
  // — including a path that does not exist — falls through to the router, so an
  // unknown URL answers 404 instead of a redirect to /login that reads as a
  // successful page to a crawler or an agent.
  if (!user && isPrivatePath(pathname)) {
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
