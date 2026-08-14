# Architecture and privacy boundaries

## Runtime shape

Stamina Timer is a Next.js App Router application. Public pages, authenticated product screens, API routes, and the PWA shell are deployed together. Supabase provides authentication, PostgreSQL, row-level security (RLS), and the narrow RPC used by public share links.

```text
Browser
├── public pages / PWA
├── authenticated dashboard, training, progress, settings
├── local UI preferences stored in the browser
└── public Supabase client (URL + anon key)
       │
       ├── auth session
       ├── RLS-protected user tables
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

Private database rows carry a `user_id` or derive ownership through an owned parent. RLS policies enforce that boundary for sessions, edge events, user-achievement progress, program sessions/progress, and private share-management rows. Base achievement definitions and aggregate global statistics are intentionally readable application data; they are not private per-user records. UI preferences that remain in browser storage are outside the Supabase RLS boundary.

Code must never compensate for a missing RLS policy by filtering only in JavaScript; database authorization is the trust boundary for persisted user data. The automated `supabase/tests/rls_privacy.sql` test creates two authenticated identities plus an anonymous context and proves cross-account isolation across the private tables, verifies a cross-account mutation cannot change the owner row, denies anonymous share-table enumeration, and tests the narrow active/expired share RPC behavior.

## Public sharing boundary

`shared_sessions` is intentionally not anonymous-readable. A creator may insert/read their own rows, while an anonymous visitor can only execute `get_shared_session(uuid)`. The SECURITY DEFINER function accepts one opaque UUID and returns only its non-expired copied payload. This prevents table enumeration while preserving share links.

A share is a copied snapshot, not a live authorization grant to the creator's underlying session rows. Expired shares return no payload through the public RPC.

## Retention, deletion, and analytics

Training records remain in the user's Supabase account until the application/user deletes them or the account is removed; there is no hidden short-retention job that silently removes active training history. Expiring a public share only makes that copied share payload unavailable through the public lookup path—it does not delete the owner's underlying training record.

Account deletion must remove the authenticated identity and its owned application data together. Database relationships and RLS are the enforcement layer; UI-only deletion is not considered sufficient. Any production account-deletion flow must be validated against a fresh migration-built database before release.

Microsoft Clarity is optional and only initializes when its public project ID is configured. Operational/error telemetry must exclude timer notes, session/share payloads, AI prompts, email addresses, Supabase tokens, auth headers, and other wellness content. See `docs/operations.md` for the redaction and incident-handling rules.

## Server-only secrets

`GEMINI_API_KEY`, `CSRF_SECRET`, Upstash credentials, and any service-role credential are server-only. They must never use a `NEXT_PUBLIC_` prefix or be returned by readiness/error responses. `/api/health` exposes only a static service/status payload.

## Timer persistence

The timer records wall-clock boundaries rather than trusting interval tick counts. Active and edge elapsed time are reconciled from timestamps, including after browser visibility changes. Pausing persists accumulated active time before stopping the active clock; resuming starts a new wall-clock segment. Starting an edge commits local state only after persistence succeeds. Finishing calls one database function that closes any open edge and finalizes the parent session in the same transaction before achievements are evaluated.

## Deployment assumptions

- Node 24 and the repository-pinned Yarn 4 release are the supported JavaScript toolchain.
- Migrations under `supabase/migrations/` are the source of truth for existing databases.
- CI builds with the immutable Yarn lockfile.
- Browser and privacy workflows use a fresh local Supabase stack so production-readiness checks do not depend on a developer's hosted project.
