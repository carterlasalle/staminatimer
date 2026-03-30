import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrf'
import { isAllowedRequestOrigin } from '@/lib/security/origin'

// Allowed origins for validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://staminatimer.com',
  'https://www.staminatimer.com',
].filter(Boolean)

export async function GET(request: NextRequest) {
  try {
    // Validate request origin
    if (!isAllowedRequestOrigin(request, ALLOWED_ORIGINS)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    // Generate a new CSRF token
    const token = await generateCSRFToken()

    const response = NextResponse.json(
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

    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 15 * 60,
    })

    return response
  } catch (error: unknown) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
