import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrf'

// Allowed origins for validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://staminatimer.com',
  'https://www.staminatimer.com',
].filter(Boolean)

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (process.env.NODE_ENV === 'development') {
    if (!origin && !referer) return true
    if (origin?.includes('localhost') || referer?.includes('localhost')) return true
  }

  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed as string))) {
    return true
  }
  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed as string))) {
    return true
  }

  return !origin
}

export async function GET(request: NextRequest) {
  try {
    // Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    // Generate a new CSRF token
    const token = await generateCSRFToken()

    return NextResponse.json(
      { token },
      {
        headers: {
          // Prevent caching of CSRF tokens
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error: unknown) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
