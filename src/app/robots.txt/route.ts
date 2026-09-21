import { NextResponse } from 'next/server'

/**
 * robots.txt with Content Signals.
 *
 * Next's `MetadataRoute.Robots` cannot emit the `Content-Signal` extension, so
 * this is a route handler. `ai-train` is withheld; `search` and `ai-input` are
 * granted so agents can actually read the guidance this site publishes.
 */
export const dynamic = 'force-static'

const BASE_URL = 'https://staminatimer.com'

const ROBOTS_TXT = `User-Agent: *
Allow: /
Allow: /about
Allow: /contact
Allow: /guides
Allow: /guides/*
Allow: /faq
Allow: /llms.txt
Allow: /login
Allow: /privacy
Allow: /terms
Allow: /license
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard
Disallow: /training
Disallow: /progress
Disallow: /settings
Disallow: /ai-coach
Disallow: /share/

Content-Signal: ai-train=no, search=yes, ai-input=yes

Host: ${BASE_URL}
Sitemap: ${BASE_URL}/sitemap.xml
`

export function GET() {
  return new NextResponse(ROBOTS_TXT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
