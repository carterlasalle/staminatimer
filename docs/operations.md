# Production operations

## Readiness

`GET /api/health` returns HTTP 200 with a static payload when the Next.js process can serve requests:

```json
{ "status": "ok", "service": "staminatimer" }
```

It is non-cacheable and intentionally does not expose environment variables, database connectivity details, versions, tokens, or secret presence. Use it for deployment readiness/liveness checks; use the privacy/browser CI jobs for deeper dependency verification.

## Error monitoring

Capture both sides of the application boundary:

- **Browser:** unhandled exceptions, rejected promises, route/render failures, and ErrorBoundary reports. Do not attach timer notes, session payloads, AI prompts, email addresses, share payloads, or Supabase tokens to error events.
- **Server:** API route exceptions, auth failures, CSRF/origin rejections, Supabase failures, and upstream AI/rate-limit failures. Record request IDs, route, status, coarse error class, and latency; avoid request bodies and auth headers.

A hosted or self-hosted error collector can be added without changing these rules. Privacy-sensitive fields should be deny-listed before transport rather than relying only on dashboard-side scrubbing.

## Rate limiting

AI/API rate limiting uses Upstash when configured and must fail in the behavior documented by the route rather than exposing credentials. Monitor rejection counts by route and broad status class. A sudden increase in 429 responses should be investigated separately from application 5xx failures.

Do not log complete IP addresses alongside health/training data. If abuse telemetry needs an address-derived key, hash or truncate it and retain it only as long as operationally necessary.

## Agent discovery

Six machine-readable surfaces are served by the application and can be checked
against any deployment:

| Surface                   | Check                                                                         |
| ------------------------- | ----------------------------------------------------------------------------- |
| `Link` headers (RFC 8288) | `curl -sSI https://www.staminatimer.com/ \| grep -i '^link:'`                 |
| Content Signals           | `curl -sS https://www.staminatimer.com/robots.txt \| grep Content-Signal`     |
| API catalog (RFC 9727)    | `curl -sS https://www.staminatimer.com/.well-known/api-catalog`               |
| OpenAPI                   | `curl -sS https://www.staminatimer.com/openapi.json`                          |
| Agent instructions        | `curl -sS https://www.staminatimer.com/llms.txt`                              |
| Markdown negotiation      | `curl -sS -H 'Accept: text/markdown' https://www.staminatimer.com/ \| head`   |
| Real 404                  | `curl -sS -i -H 'Accept: text/markdown' https://www.staminatimer.com/no-such` |

Markdown negotiation renders the pages a browser would get, restricted to the
set robots.txt allows, and is served `private, no-store` so a shared cache cannot
return it to a browser.

An unknown path must answer `404`. If a probe returns `200` or a redirect to
`/login`, the middleware has regressed to redirecting everything that is not on a
public allow-list. Only the paths in `PRIVATE_PAGES` (`src/lib/agent-discovery.ts`)
should require a session.

### DNS for AI Discovery (DNS-AID) — blocked on registrar access

Not published, and it cannot be published from this repository. The domain is
served by Spaceship (`launch1.spaceship.net`, `launch2.spaceship.net`), so the
records have to be created in that DNS panel:

```dns
_index._agents.staminatimer.com. 3600 IN SVCB 1 staminatimer.com. alpn="h2" port=443
```

This advertises the site as the discovery entry point. There is currently **no
A2A or MCP agent endpoint** to point at — do not publish an `_a2a` record until
one actually exists, or the record will advertise something that is not there.

DNSSEC is already enabled and validating (`dig +dnssec staminatimer.com` sets the
`ad` flag and a DS record exists in `.com`), so a published record is
authenticated without further work.

Verify over DNS-over-HTTPS, which is how the scanner resolves it:

```bash
curl -sS 'https://cloudflare-dns.com/dns-query?name=_index._agents.staminatimer.com&type=SVCB' \
  -H 'accept: application/dns-json'
```

## CI release gates

Every pull request is expected to pass:

1. immutable Yarn installation;
2. ESLint and TypeScript;
3. Vitest unit/integration tests;
4. production `next build`;
5. fresh local-Supabase RLS/privacy tests;
6. Chromium Playwright production flows; and
7. Lighthouse with an accessibility score of at least 0.90 on the public home and login surfaces.

OSV and repository security workflows remain independent defense-in-depth checks.

## Local production rehearsal

Use the same pinned Supabase CLI version as CI:

```bash
corepack enable
yarn install --immutable
yarn dlx supabase@2.114.0 start
yarn dlx supabase@2.114.0 db reset
yarn test
yarn build
yarn start
```

Then verify `http://127.0.0.1:3000/api/health`. For the database privacy suite run `yarn dlx supabase@2.114.0 test db`. For browser tests, create a local test identity and supply `E2E_EMAIL`/`E2E_PASSWORD`, then run `yarn playwright install chromium` followed by `yarn test:e2e`.

## Incident checklist

- Confirm `/api/health` and the deployment status.
- Separate client exceptions, server/API failures, database/auth failures, and rate-limit saturation.
- Reproduce against a fresh local Supabase reset when database policy or migration drift is suspected.
- Never disable RLS, CSRF, origin checks, or immutable dependency installation to restore service.
- Prefer a forward-fix migration that preserves already-written production data.
- Roll back a database migration only when the reversal has been tested against representative data, or when a verified backup restore/backfill procedure is ready. Application rollback alone must not assume an irreversible schema change disappeared.
