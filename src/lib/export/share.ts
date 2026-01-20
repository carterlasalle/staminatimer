import type { DBSession } from '@/lib/types'
import { getCSRFToken, clearCSRFTokenCache } from '@/lib/gemini'

type ShareDuration = '1h' | '24h' | '7d' | '30d' | 'infinite'

/**
 * Generate a shareable link for sessions using the secure server-side API
 *
 * SECURITY: The server verifies ownership of all sessions and re-fetches
 * the data to prevent manipulation of session content
 *
 * @param sessions - Array of sessions to share (only IDs are sent to server)
 * @param duration - How long the share link should be valid
 * @returns The shareable URL
 */
export async function generateShareableLink(
  sessions: DBSession[],
  duration: ShareDuration
): Promise<string> {
  // Extract only session IDs - server will verify ownership and fetch full data
  const sessionIds = sessions.map(s => s.id)

  // Get CSRF token for the request
  const csrfToken = await getCSRFToken()

  const response = await fetch('/api/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      sessionIds,
      duration,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    if (response.status === 403) {
      // CSRF token might be expired - clear cache
      clearCSRFTokenCache()

      if (errorData.error?.includes('CSRF')) {
        throw new Error('Security validation failed. Please try again.')
      }
      throw new Error('You do not have permission to share these sessions.')
    }

    if (response.status === 401) {
      throw new Error('Please sign in to share sessions.')
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
    }

    throw new Error(errorData.error || 'Failed to create share link')
  }

  const data = await response.json()

  // Return shareable link
  return `${window.location.origin}/share/${data.shareId}`
}
