/**
 * Shared policy for content negotiation with automated agents.
 *
 * "Markdown for Agents" (and the summary of it at llmstxt.org) asks that a
 * request carrying `Accept: text/markdown` receive a markdown rendering of the
 * same page a browser would see. The negotiation decision lives here so the
 * middleware that rewrites and the handler that renders cannot drift apart.
 */

/**
 * Paths that require a session.
 *
 * The middleware redirects only these to the login page. The older shape was a
 * public allow-list, which meant every unknown URL — a typo, a stale inbound
 * link, an agent probing for a resource — was redirected to `/login` and
 * answered `200`, so nothing on the site could ever return a real 404.
 */
const PRIVATE_PAGES = ['/ai-coach', '/dashboard', '/program', '/progress', '/settings', '/training']

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

/** Paths that are not pages and must never be negotiated. */
const NON_PAGE_PREFIXES = ['/api/', '/auth/', '/.well-known/']

/**
 * Markdown is offered for everything that is not behind a session, including
 * paths that do not exist: those answer with a markdown 404 body rather than an
 * HTML one, so an agent probing for a resource gets a readable answer.
 */
export function isMarkdownNegotiable(pathname: string): boolean {
  if (isPrivatePath(pathname)) return false

  // `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/openapi.json` and assets are
  // already machine-readable; converting them would be busywork.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false

  return !NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
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
