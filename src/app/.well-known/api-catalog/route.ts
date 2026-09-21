import { NextResponse } from 'next/server'

/**
 * API catalog (RFC 9727).
 *
 * Advertised from every response via the `Link: rel="api-catalog"` header, so an
 * agent can find the machine-readable entry points without crawling the site.
 * Only resources that exist and are publicly reachable are listed.
 */
export const dynamic = 'force-static'

const LINKSET = {
  linkset: [
    {
      anchor: '/',
      item: [
        {
          href: '/openapi.json',
          type: 'application/openapi+json;version=3.1',
          title: 'OpenAPI description of the public API',
        },
      ],
      'service-desc': [
        {
          href: '/openapi.json',
          type: 'application/openapi+json;version=3.1',
          title: 'OpenAPI description of the public API',
        },
      ],
      'service-doc': [
        {
          href: '/guides',
          type: 'text/html',
          title: 'Stamina Timer guides',
        },
        {
          href: '/llms.txt',
          type: 'text/plain',
          title: 'Machine-readable overview for agents',
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
      // The profile parameter is what tells a client this linkset is an API
      // catalog rather than a plain linkset.
      'Content-Type': 'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
