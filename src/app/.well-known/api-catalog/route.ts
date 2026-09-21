import { NextResponse } from 'next/server'

/**
 * API catalog (RFC 9727).
 *
 * Advertised from every response via the `Link: rel="api-catalog"` header, so an
 * agent can find the machine-readable entry points without crawling the site.
 * Only resources that really exist and are publicly reachable are listed.
 */
export const dynamic = 'force-static'

const LINKSET = {
  linkset: [
    {
      anchor: '/',
      'service-doc': [
        {
          href: '/guides',
          type: 'text/html',
          title: 'Stamina Timer guides',
        },
      ],
      status: [
        {
          href: '/api/health',
          type: 'application/json',
          title: 'Service health',
        },
      ],
      license: [
        {
          href: '/license',
          type: 'text/html',
        },
      ],
    },
  ],
}

export function GET() {
  return new NextResponse(JSON.stringify(LINKSET, null, 2), {
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
