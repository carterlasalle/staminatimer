/**
 * Shared policy for content negotiation with automated agents.
 *
 * "Markdown for Agents" (and the summary of it at llmstxt.org) asks that a
 * request carrying `Accept: text/markdown` receive a markdown rendering of the
 * same page a browser would see. The negotiation decision lives here so the
 * middleware that rewrites and the handler that renders cannot drift apart.
 */

/**
 * Pages an agent may request as markdown.
 *
 * Deliberately the same set `robots.txt` allows: anything behind auth is absent,
 * so this can never become a way to read another account's data as plain text.
 */
const MARKDOWN_PAGES = ['/', '/faq', '/guides', '/license', '/login', '/privacy', '/terms']

export function isMarkdownNegotiable(pathname: string): boolean {
  return MARKDOWN_PAGES.includes(pathname) || pathname.startsWith('/guides/')
}

/**
 * Request header the middleware uses to tell the markdown handler which page to
 * render. A query parameter does not survive the rewrite.
 */
export const MARKDOWN_PATH_HEADER = 'x-markdown-path'

/** Quality value for a media type, per RFC 9110 §12.5.1. */
function quality(accept: string, type: string): number {
  let best = 0

  for (const entry of accept.split(',')) {
    const [media, ...params] = entry.trim().split(';')

    if (media.trim().toLowerCase() !== type) continue

    const q = params.find((param) => param.trim().startsWith('q='))
    const value = q ? Number.parseFloat(q.split('=')[1]) : 1

    best = Math.max(best, Number.isFinite(value) ? value : 0)
  }

  return best
}

/**
 * True when the client explicitly prefers markdown over HTML.
 *
 * A wildcard accept header (browsers, curl) and `Accept: text/html` both return
 * false, so the default experience is unchanged.
 */
export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false

  const markdown = quality(accept, 'text/markdown')

  return markdown > 0 && markdown >= quality(accept, 'text/html')
}
