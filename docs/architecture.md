# Architecture and privacy boundaries

## Runtime shape

Stamina Timer is a Next.js App Router application. Public pages, authenticated product screens, API routes, and the PWA shell are deployed together. Supabase provides authentication, PostgreSQL, row-level security (RLS), and the narrow RPC used by public share links.

```text
Browser
├── public pages / PWA
├── authenticated dashboard, training, progress, settings
└── public Supabase client (URL + anon key)
       │
       ├── auth session
       ├── RLS-protected tables
       └── get_shared_session(uuid) RPC

Next.js server
├── /api/health       secret-free readiness
├── /api/share        authenticated share creation
├── /api/ai           authenticated + CSRF + rate-limited AI requests
└── /auth/callback    auth callback
```

## Authentication and session flow

The browser initializes Supabase from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Those values identify the project; they are not authorization secrets. The authenticated Supabase session supplies the user identity used by RLS. Protected application routes consume that identity and database access remains subject to table policies.

If public Supabase variables are absent during build/SSR, the client module intentionally falls back to a no-op implementation so static compilation cannot accidentally make a live database call. Production runtime configuration must still provide the real values.

## Data ownership

Private user-owned rows carry a `user_id` or equivalent owner column. RLS policies compare that owner to `auth.uid()` for sessions, edge events, achievements/progress, preferences, and program data. Code must never compensate for a missing RLS policy by filtering only in JavaScript; database authorization is the trust boundary.

The automated `supabase/tests/rls_privacy.sql` test creates two authenticated identities plus an anonymous context and proves that one identity cannot read or mutate the other's session rows.

## Public sharing boundary

`shared_sessions` is intentionally not anonymous-readable. A creator may insert/read their own rows, while an anonymous visitor can only execute `get_shared_session(uuid)`. The SECURITY DEFINER function accepts one opaque UUID and returns only its non-expired copied payload. This prevents table enumeration while preserving share links.

## Server-only secrets

`GEMINI_API_KEY`, `CSRF_SECRET`, Upstash credentials, and any service-role credential are server-only. They must never use a `NEXT_PUBLIC_` prefix or be returned by readiness/error responses. `/api/health` exposes only a static service/status payload.

## Timer persistence

The timer records wall-clock boundaries rather than trusting interval tick counts. Active and edge elapsed time are reconciled from timestamps, including after browser visibility changes. Pausing persists accumulated active time before stopping the active clock; resuming starts a new wall-clock segment. Finishing persists the final durations and then evaluates achievements.

## Deployment assumptions

- Node 24 and the repository-pinned Yarn 4 release are the supported JavaScript toolchain.
- Migrations under `supabase/migrations/` are the source of truth for existing databases.
- CI builds with the immutable Yarn lockfile.
- Browser and privacy workflows use a fresh local Supabase stack so production-readiness checks do not depend on a developer's hosted project.
