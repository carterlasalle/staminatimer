# Production operations

## Readiness

`GET /api/health` returns HTTP 200 with a static payload when the Next.js process can serve requests:

```json
{"status":"ok","service":"staminatimer"}
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

```bash
corepack enable
yarn install --immutable
supabase start
supabase db reset
yarn test
yarn build
yarn start
```

Then verify `http://127.0.0.1:3000/api/health`. For the database privacy suite run `supabase test db`. For browser tests, create a local test identity and supply `E2E_EMAIL`/`E2E_PASSWORD`, then run `yarn playwright install chromium` followed by `yarn test:e2e`.

## Incident checklist

- Confirm `/api/health` and the deployment status.
- Separate client exceptions, server/API failures, database/auth failures, and rate-limit saturation.
- Reproduce against a fresh local Supabase reset when database policy or migration drift is suspected.
- Never disable RLS, CSRF, origin checks, or immutable dependency installation to restore service.
- Roll back the application and database migration together when a schema-dependent release cannot be made forward-compatible.
