import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { checkRateLimit } from '@/lib/security/ratelimit'
import { API_CONSTANTS } from '@/lib/constants'
import { validateCSRFTokenWithCookie, getCSRFTokenFromHeaders } from '@/lib/security/csrf'
import { isAllowedRequestOrigin } from '@/lib/security/origin'

// Maximum request body size (50KB for session IDs array)
const MAX_BODY_SIZE = 50 * 1024

// Valid share durations in milliseconds
const VALID_DURATIONS: Record<string, number | null> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'infinite': null,
}

// Allowed origins for validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://staminatimer.com',
  'https://www.staminatimer.com',
].filter(Boolean)

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate request origin
    if (!isAllowedRequestOrigin(request, ALLOWED_ORIGINS)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    // SECURITY: Validate CSRF token
    const csrfToken = getCSRFTokenFromHeaders(request.headers)
    const csrfCookie = request.cookies.get('csrf-token')?.value ?? null
    if (!csrfToken || !(await validateCSRFTokenWithCookie(csrfToken, csrfCookie))) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      )
    }

    // SECURITY: Check request body size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    // Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting
    const { success, limit, remaining, reset } = await checkRateLimit(user.id, 'general')

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': '60',
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { sessionIds, duration } = body

    // Validate sessionIds
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'sessionIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!sessionIds.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    const uniqueSessionIds = [...new Set(sessionIds as string[])]

    // SECURITY: Enforce maximum sessions limit (server-side)
    if (uniqueSessionIds.length > API_CONSTANTS.MAX_SHARE_SESSIONS) {
      return NextResponse.json(
        { error: `Cannot share more than ${API_CONSTANTS.MAX_SHARE_SESSIONS} sessions at once` },
        { status: 400 }
      )
    }

    // Validate all session IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uniqueSessionIds.every((id) => uuidRegex.test(id))) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Validate duration
    if (!duration || !(duration in VALID_DURATIONS)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be one of: 1h, 24h, 7d, 30d, infinite' },
        { status: 400 }
      )
    }

    // SECURITY: Verify user owns ALL requested sessions
    // This is the critical check - we fetch sessions and verify ownership
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select(`*, edge_events (*)`)
      .in('id', uniqueSessionIds)
      .eq('user_id', user.id) // Only fetch sessions owned by this user

    if (fetchError) {
      console.error('Error fetching sessions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // SECURITY: Verify we got all requested sessions
    // If count doesn't match, user tried to share sessions they don't own
    if (!sessions || sessions.length !== uniqueSessionIds.length) {
      return NextResponse.json(
        { error: 'One or more sessions not found or not authorized' },
        { status: 403 }
      )
    }

    // Calculate expiration
    const durationMs = VALID_DURATIONS[duration]
    const expiresAt = durationMs
      ? new Date(Date.now() + durationMs).toISOString()
      : null

    // Create the share record with the verified session data
    const { data: shareData, error: shareError } = await supabase
      .from('shared_sessions')
      .insert({
        sessions_data: sessions,
        expires_at: expiresAt,
        created_by: user.id
      })
      .select('id')
      .single()

    if (shareError) {
      console.error('Error creating share:', shareError)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        shareId: shareData.id,
        expiresAt
      },
      {
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        }
      }
    )
  } catch (error: unknown) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    )
  }
}
