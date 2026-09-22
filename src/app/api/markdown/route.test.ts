import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

const ORIGIN = 'https://www.staminatimer.com'

/** A page shaped like the real ones: chrome in `<head>`, content in `<main>`. */
const PAGE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Guides</title>
    <style>.header{color:red}</style>
  </head>
  <body>
    <script>window.__secret = 'do-not-leak'</script>
    <main>
      <!-- react text-node separator -->
      <h1>Training Guides</h1>
      <p>Intervals for <strong>stamina</strong> and recovery.</p>
      <svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>
      <noscript>enable javascript</noscript>
    </main>
  </body>
</html>`

function request(path?: string) {
  return new NextRequest(`${ORIGIN}/api/markdown`, {
    method: 'GET',
    headers: path === undefined ? {} : { 'x-markdown-path': path },
  })
}

describe('GET /api/markdown', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function respondWith(html: string, status = 200) {
    fetchMock.mockResolvedValue(
      new Response(status === 404 ? 'Not Found' : html, {
        status,
        headers: { 'content-type': 'text/html' },
      })
    )
  }

  it('renders an eligible page as markdown', async () => {
    respondWith(PAGE_HTML)

    const response = await GET(request('/guides'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/markdown')
    expect(body.length).toBeGreaterThan(40)
    expect(body).toContain('Training Guides')
  })

  it('re-fetches the page over loopback with an HTML accept header', async () => {
    respondWith(PAGE_HTML)

    await GET(request('/guides'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(`${ORIGIN}/guides`)
    expect((init?.headers as Record<string, string>).accept).toBe('text/html')
  })

  it('refuses a private page without fetching it', async () => {
    const response = await GET(request('/dashboard'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toMatch(/not a markdown-negotiable page/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a path that is not a page', async () => {
    const response = await GET(request('/robots.txt'))

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not render an arbitrary page when the path header is missing', async () => {
    respondWith(PAGE_HTML)

    const response = await GET(request())

    expect(response.status).toBe(200)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(`${ORIGIN}/`)
  })

  it('strips HTML noise and emits markdown headings', async () => {
    respondWith(PAGE_HTML)

    const body = await (await GET(request('/guides'))).text()

    expect(body).not.toContain('window.__secret')
    expect(body).not.toContain('color:red')
    expect(body).not.toContain('enable javascript')
    expect(body).not.toContain('<svg')
    expect(body).not.toContain('M0 0h24v24')
    expect(body).not.toContain('<!--')

    expect(body).toMatch(/^# Training Guides$/m)
    expect(body).not.toContain('<h1>')
  })

  it('answers a page that 404s with a readable markdown 404 body', async () => {
    respondWith('Not Found', 404)

    const response = await GET(request('/does-not-exist'))
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('text/markdown')
    expect(body).toContain('404')
    expect(body).toContain('/sitemap.xml')
    expect(body).toContain('/llms.txt')
  })
})
