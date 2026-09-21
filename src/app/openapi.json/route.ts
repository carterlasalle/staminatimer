import { NextResponse } from 'next/server'

/**
 * OpenAPI description of the public HTTP API.
 *
 * Referenced from the API catalog (RFC 9727) that every response advertises with
 * `Link: rel="api-catalog"`. Only endpoints that are reachable without a session
 * are described; the authenticated endpoints are deliberately out of scope.
 */
export const dynamic = 'force-static'

const SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Stamina Timer API',
    version: '1.0.0',
    summary: 'Public endpoints of the Stamina Timer web application.',
    description:
      'Stamina Timer is a private training app for building control over how long a session lasts. This document describes the endpoints that are reachable without a session. Everything else requires authentication and is not part of this contract.',
    license: {
      name: 'MIT',
      identifier: 'MIT',
    },
  },
  servers: [{ url: 'https://www.staminatimer.com' }],
  paths: {
    '/api/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Liveness probe',
        description: 'Returns a fixed payload when the application is serving traffic.',
        responses: {
          200: {
            description: 'The service is up.',
            headers: {
              'Cache-Control': {
                description: 'Always `no-store, max-age=0`.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'service'],
                  properties: {
                    status: { type: 'string', const: 'ok' },
                    service: { type: 'string', const: 'staminatimer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/csrf': {
      get: {
        operationId: 'getCsrfToken',
        summary: 'Issue a CSRF token',
        description:
          'Returns a token and sets it as a `csrf-token` cookie for state-changing requests. Requests whose origin is not the site itself are rejected.',
        responses: {
          200: {
            description: 'A fresh token.',
            headers: {
              'Set-Cookie': {
                description: '`csrf-token`, httpOnly, sameSite=strict, 15 minute lifetime.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: { token: { type: 'string' } },
                },
              },
            },
          },
          403: {
            description: 'The request origin is not allowed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { error: { type: 'string' } },
                },
              },
            },
          },
          500: { description: 'Token generation failed.' },
        },
      },
    },
  },
}

export function GET() {
  return new NextResponse(JSON.stringify(SPEC, null, 2), {
    headers: {
      'Content-Type': 'application/openapi+json;version=3.1',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
