import { expect, test } from '@playwright/test'

/**
 * The contract automated agents and crawlers depend on.
 *
 * Every one of these was a real defect at some point: the site served `307 → /login
 * → 200` for unknown paths, so nothing could ever return a 404 and an agent
 * probing for a resource concluded it existed. The middleware now redirects only
 * the paths in `PRIVATE_PAGES`, and these tests are what stop that regressing.
 *
 * No authentication is involved — that is the point.
 */

const MARKDOWN = { Accept: 'text/markdown' }

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('unknown paths', () => {
  test('an unknown path really is a 404, not a redirect to login', async ({ request }) => {
    const response = await request.get('/definitely-not-a-page')

    expect(response.status()).toBe(404)
    expect(response.headers()['content-type']).toContain('text/html')
  })

  test('an unknown path answers in markdown when asked, with a readable body', async ({
    request,
  }) => {
    const response = await request.get('/definitely-not-a-page', { headers: MARKDOWN })

    expect(response.status()).toBe(404)
    expect(response.headers()['content-type']).toContain('text/markdown')

    const body = await response.text()
    // An agent that followed a stale link should learn where to look instead.
    expect(body).toMatch(/not found/i)
    expect(body).toMatch(/sitemap|llms\.txt/i)
  })
})

test.describe('content negotiation', () => {
  test('markdown is served when explicitly preferred, with Vary: Accept', async ({ request }) => {
    const response = await request.get('/', { headers: MARKDOWN })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/markdown')
    // Without Vary a shared cache can serve the markdown body to a browser.
    expect(response.headers()['vary']?.toLowerCase()).toContain('accept')

    const body = await response.text()
    expect(body.length).toBeGreaterThan(200)
  })

  test('a browser request still gets HTML', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('text/html')
  })

  test('a wildcard accept header falls back to HTML', async ({ request }) => {
    const response = await request.get('/', { headers: { Accept: '*/*' } })

    expect(response.headers()['content-type']).toContain('text/html')
  })

  test('private paths are never negotiated', async ({ request }) => {
    // These must reach the middleware's session check, not the markdown handler.
    const response = await request.get('/dashboard', { headers: MARKDOWN, maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toContain('/login')
  })
})

test.describe('machine-readable surface', () => {
  test('robots.txt declares content signals', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toMatch(/^Content-Signal:/m)
    // The app is behind a session, so it must not be advertised for indexing.
    expect(body).toMatch(/Disallow: \/dashboard/)
  })

  test('llms.txt is served as plain text with usage guidance', async ({ request }) => {
    const response = await request.get('/llms.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    expect(await response.text()).toMatch(/when to use this site/i)
  })

  test('the api catalog is a valid RFC 9727 linkset advertising its profile', async ({
    request,
  }) => {
    const response = await request.get('/.well-known/api-catalog')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/linkset+json')
    expect(response.headers()['content-type']).toContain('rfc9727')

    const linkset = await response.json()
    const relations = Object.keys(linkset.linkset[0])
    expect(relations).toContain('item')
    expect(relations).toContain('service-desc')
  })

  test('the server advertises the catalog and llms.txt in its Link header', async ({ request }) => {
    const response = await request.get('/')
    const link = response.headers()['link'] ?? ''

    expect(link).toContain('rel="api-catalog"')
    expect(link).toContain('rel="describedby"')
  })

  test('a sessionless private route redirects instead of rendering', async ({ request }) => {
    for (const path of ['/dashboard', '/training', '/progress', '/settings', '/program']) {
      const response = await request.get(path, { maxRedirects: 0 })

      expect(response.status(), `${path} should redirect`).toBe(307)
      expect(response.headers()['location'], `${path} should target login`).toContain('/login')
    }
  })
})
