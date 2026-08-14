import { describe, expect, it } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  it('returns a minimal readiness payload without configuration or secrets', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(body).toEqual({ status: 'ok', service: 'staminatimer' })

    const serialized = JSON.stringify(body).toLowerCase()
    expect(serialized).not.toContain('key')
    expect(serialized).not.toContain('token')
    expect(serialized).not.toContain('secret')
    expect(serialized).not.toContain('url')
  })
})
