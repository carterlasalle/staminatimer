/**
 * Client-side AI service that communicates with the secure server-side API.
 * The API key is never exposed to the client.
 */

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
