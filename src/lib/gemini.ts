/**
 * Client-side AI service that communicates with the secure server-side API.
 * The API key is never exposed to the client.
 */

// Cache for CSRF token to avoid fetching on every request
let csrfTokenCache: { token: string; fetchedAt: number } | null = null
const CSRF_TOKEN_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes (tokens valid for 15)

/**
 * Fetches a CSRF token from the server
 * Uses caching to reduce API calls
 */
async function getCSRFToken(): Promise<string> {
  // Check if we have a cached token that's still valid
  if (
    csrfTokenCache &&
    Date.now() - csrfTokenCache.fetchedAt < CSRF_TOKEN_CACHE_DURATION
  ) {
    return csrfTokenCache.token
  }

  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const data = await response.json()

    // Cache the token
    csrfTokenCache = {
      token: data.token,
      fetchedAt: Date.now(),
    }

    return data.token
  } catch (error) {
    console.error('CSRF token fetch error:', error)
    throw new Error('Security token unavailable. Please refresh the page and try again.')
  }
}

/**
 * Clears the CSRF token cache (call after 403 errors)
 */
function clearCSRFTokenCache(): void {
  csrfTokenCache = null
}

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    // Fetch CSRF token before making the request
    const csrfToken = await getCSRFToken()

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'same-origin',
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}`

      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again in a few moments. The free tier has limited requests per minute.')
      }

      if (response.status === 401) {
        throw new Error('Please sign in to use the AI coach.')
      }

      if (response.status === 403) {
        // CSRF token might be expired or invalid - clear cache and retry once
        clearCSRFTokenCache()
        throw new Error('Security validation failed. Please try again.')
      }

      if (response.status === 503) {
        throw new Error('AI service is temporarily unavailable. Please try again later.')
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.response
  } catch (error: unknown) {
    // Re-throw if already a proper Error with message
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unable to generate AI response. Please try again later.')
  }
}

export async function generateStreamResponse(prompt: string) {
  // For streaming, we would need to implement SSE or WebSocket
  // For now, fall back to non-streaming response
  const response = await generateAIResponse(prompt)
  return {
    stream: (async function* () {
      yield response
    })(),
  }
}

// Export for use by other modules (like share)
export { getCSRFToken, clearCSRFTokenCache }
