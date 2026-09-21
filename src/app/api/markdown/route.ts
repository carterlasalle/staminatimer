import { NextRequest, NextResponse } from 'next/server'
import TurndownService from 'turndown'
import { isMarkdownNegotiable, MARKDOWN_PATH_HEADER } from '@/lib/agent-discovery'

/**
 * Markdown rendering of a page, for agents that asked for one.
 *
 * The middleware rewrites `Accept: text/markdown` requests here. The page is
 * re-rendered over loopback with an HTML accept header (which is also what stops
 * the rewrite from recursing), then converted. Only pages listed by
 * `isMarkdownNegotiable` are eligible, and no credentials are forwarded, so this
 * cannot expose anything a signed-out visitor could not already read.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

turndown.remove(['script', 'style', 'noscript', 'iframe', 'template', 'link', 'meta'])

// Lucide icons render as `<svg>`; turndown's TagName union is drawn from
// HTMLElementTagNameMap, which does not include SVG elements, so this one is
// filtered by predicate instead.
turndown.remove((node) => node.nodeName.toLowerCase() === 'svg')

function toMarkdown(html: string): string {
  // React inserts `<!-- -->` between adjacent text nodes; they render as literal
  // noise in the output. `<head>` carries no visible copy and the skip link,
  // nav and footer are chrome rather than content, so the `<main>` landmark is
  // converted when the page has one.
  const body = html.slice(Math.max(0, html.indexOf('<body')))
  const start = body.indexOf('<main')
  const end = body.lastIndexOf('</main>')
  const content = start >= 0 && end > start ? body.slice(start, end) : body
  const markdown = turndown.turndown(content.replace(/<!--[\s\S]*?-->/g, ''))

  return `${markdown.trim()}\n`
}

function notFoundMarkdown(path: string): string {
  return `# 404 — page not found

No page exists at \`${path}\` on staminatimer.com.

- [Home](/) — what Stamina Timer is and how the guided program works
- [Guides](/guides) — the full training library
- [FAQ](/faq) — common questions about the training
- [Sitemap](/sitemap.xml) — every public URL on this site
- [llms.txt](/llms.txt) — machine-readable overview for agents
`
}

export async function GET(req: NextRequest) {
  // The middleware rewrites here with the requested path in a header. The query
  // parameter is kept as a fallback so the endpoint stays directly testable.
  const path = req.headers.get(MARKDOWN_PATH_HEADER) ?? req.nextUrl.searchParams.get('path') ?? '/'

  if (!isMarkdownNegotiable(path)) {
    return NextResponse.json({ error: 'Not a markdown-negotiable page', path }, { status: 404 })
  }

  let page: Response

  try {
    page = await fetch(new URL(path, req.nextUrl.origin), {
      headers: { accept: 'text/html' },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ error: 'Unable to render page', path }, { status: 502 })
  }

  // A path that does not exist answers with markdown rather than an HTML error
  // page, so an agent probing for a resource gets a readable answer at the real
  // 404 status.
  if (page.status === 404) {
    const body = notFoundMarkdown(path)

    return new NextResponse(body, {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': String(Math.ceil(body.length / 4)),
        'Cache-Control': 'private, no-store',
        Vary: 'Accept',
      },
    })
  }

  if (!page.ok) {
    return NextResponse.json(
      { error: 'Unable to render page', path, status: page.status },
      { status: 502 }
    )
  }

  const markdown = toMarkdown(await page.text())

  // A response with no text means the page did not server-render (the dev server
  // streams its shell through scripts). Serving an empty document would look
  // like a successful answer to an agent, so fail loudly instead.
  if (!markdown.trim()) {
    return NextResponse.json(
      { error: 'Page produced no markdown — it did not server-render', path },
      { status: 502 }
    )
  }

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // Rough estimate, as the header is defined. Four characters per token is
      // the usual English approximation used for this hint.
      'x-markdown-tokens': String(Math.ceil(markdown.length / 4)),
      // Never cached by a shared cache. The negotiated page and its HTML variant
      // share one URL, and Next replaces `Vary` when it serves a prerendered
      // page, so a shared cache cannot be trusted to keep the two apart.
      'Cache-Control': 'private, no-store',
      Vary: 'Accept',
    },
  })
}
