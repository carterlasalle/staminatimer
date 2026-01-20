import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { checkRateLimit } from '@/lib/security/ratelimit'
import { VALIDATION_CONSTANTS } from '@/lib/constants'
import { validateAIInput } from '@/lib/security/ai-sanitization'
import { validateCSRFToken, getCSRFTokenFromHeaders } from '@/lib/security/csrf'

// Maximum request body size (10KB) to prevent DoS
const MAX_BODY_SIZE = 10 * 1024

// Allowed origins for CORS/origin validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://staminatimer.com',
  'https://www.staminatimer.com',
].filter(Boolean)

/**
 * Validates that the request origin is allowed
 * Returns true if valid, false otherwise
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (!origin && !referer) return true // Allow same-origin requests
    if (origin?.includes('localhost') || referer?.includes('localhost')) return true
  }

  // Check if origin or referer matches allowed origins
  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed as string))) {
    return true
  }
  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed as string))) {
    return true
  }

  // Allow same-origin requests (no origin header)
  if (!origin && referer) {
    return ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed as string))
  }

  return !origin // Same-origin requests don't send origin header
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate request origin to prevent CSRF
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    // SECURITY: Validate CSRF token
    const csrfToken = getCSRFTokenFromHeaders(request.headers)
    if (!csrfToken || !(await validateCSRFToken(csrfToken))) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      )
    }

    // SECURITY: Check request body size before parsing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    // Get API key from server-side environment (NOT NEXT_PUBLIC_)
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    // Verify user is authenticated
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

    // Rate limiting by user ID using Redis (or fallback)
    const { success, limit, remaining, reset } = await checkRateLimit(user.id, 'ai')

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

    // Parse request body
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: prompt is required' },
        { status: 400 }
      )
    }

    // Limit prompt length to prevent abuse
    if (prompt.length > VALIDATION_CONSTANTS.MAX_AI_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long. Maximum ${VALIDATION_CONSTANTS.MAX_AI_PROMPT_LENGTH} characters allowed.` },
        { status: 400 }
      )
    }

    // SECURITY: Sanitize and validate AI input to prevent prompt injection
    let sanitizedPrompt: string
    try {
      sanitizedPrompt = validateAIInput(prompt)
    } catch (sanitizationError) {
      console.warn('AI input sanitization blocked request:', sanitizationError)
      return NextResponse.json(
        { error: 'Your message contains content that cannot be processed. Please rephrase and try again.' },
        { status: 400 }
      )
    }

    // Generate AI response
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(sanitizedPrompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json(
      { response: text },
      {
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        }
      }
    )
  } catch (error: unknown) {
    console.error('AI API error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Handle specific API errors
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again in a few moments.' },
        { status: 429 }
      )
    }

    if (errorMessage.includes('401') || errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service authentication failed' },
        { status: 503 }
      )
    }

    if (errorMessage.includes('403')) {
      return NextResponse.json(
        { error: 'AI service access denied' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate AI response. Please try again.' },
      { status: 500 }
    )
  }
}
