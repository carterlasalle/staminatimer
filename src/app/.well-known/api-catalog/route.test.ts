import { describe, expect, it } from 'vitest'

import { GET } from './route'

describe('GET /.well-known/api-catalog', () => {
  it('serves an RFC 9727 linkset declaring the public resources', async () => {
    const response = GET()
    const contentType = response.headers.get('content-type') ?? ''

    expect(response.status).toBe(200)
    expect(contentType).toContain('application/linkset+json')
    expect(contentType).toContain('profile=')
    expect(contentType).toContain('rfc9727')

    const body = await response.json()
    const entry = body.linkset[0]

    expect(entry.anchor).toBe('/')
    expect(entry.item[0].href).toBe('/openapi.json')
    expect(entry['service-desc'][0].href).toBe('/openapi.json')
    expect(entry['service-doc'].map((link: { href: string }) => link.href)).toEqual([
      '/guides',
      '/llms.txt',
    ])
    expect(entry.status[0].href).toBe('/api/health')
    expect(entry.license[0].href).toBe('/license')
  })
})
