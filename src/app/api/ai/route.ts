import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { checkRateLimit } from '@/lib/security/ratelimit'
import { VALIDATION_CONSTANTS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
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

    // Generate AI response
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
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
