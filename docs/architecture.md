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

Anonymous clients hold no table privileges on private training data. `20260921060000_harden_private_table_access.sql` revokes `anon` from `sessions`, `edge_events`, `shared_sessions`, `user_achievements` and the write privileges on the public catalogue tables, and drops the pre-hardening `Enable all access for all users` and `Public can view non-expired shared links` policies that the hosted project had inherited from before the checked-in migration set. Anonymous read of a share still works, exclusively through `get_shared_session(uuid)`.

## Guided Program V2 ownership and progression

Guided Program V2 stores its private training data in `program_v2_progress`, `program_v2_sessions`, and `program_v2_rescue_events`. All three are RLS-protected and **read-only to clients**: `authenticated` holds `SELECT` only, and the owner policies scope every row to `auth.uid() = user_id`. There is no `INSERT`/`UPDATE`/`DELETE` grant on any of them.

Every write therefore goes through a `SECURITY DEFINER` function that re-establishes ownership itself:

- `initialize_program_v2(p_bucket)` — creates the V2 progress row from a self-reported baseline bucket. That bucket is a placement aid only: it can never place a user above the 5:00 checkpoint, and it is never inferred from V1 history.
- `record_program_v2_session(p_payload)` — the authoritative recording path. It loads progress `FOR UPDATE`, inserts the session and its rescue events atomically, recomputes progression eligibility, target pass/fail and the rolling gate server-side, advances at most one target, and returns the prior target, current target, whether the observation counted, whether the target passed, whether advancement happened, the gate state, and the status.

Progression is therefore never decided by the browser. The V2 tables reject direct client writes, so `current_target_ms` cannot be moved from the client, and a client-supplied `target_passed` flag is ignored: the function derives eligibility and pass/fail from the recorded durations, rescue count, anti-loop flag, standardized-setup confirmations, and the local calendar date.

Canonical rules live in `src/lib/program/protocol-v2.ts` (ladder, gate windows, scheduling, rescue/anti-loop rules, transfer track) and are mirrored by the SQL functions. Behavior that is purely client knowledge — whether breathing prep was completed, whether a rescue loop was detected by the live session state machine — is asserted by the client, but every criterion the server can recompute is recomputed.

Only one progression-eligible observation may count per browser-local calendar day. Moving a target up by exactly one rung happens only when the rolling gate is satisfied, and 10:00 is terminal: reaching it sets `status = 'maintenance'` and no target above 10 minutes is created.

V1 (`program_sessions`, `program_progress`) is retained untouched in the database as legacy history. The active product never reads it, never writes it, and never converts `time_in_zone_ms`, cycle counts, phase numbers, or `qualifying_sessions_in_phase` into V2 progression. Existing users with V1 history start V2 through the same onboarding flow as new users.

Partnered-encounter notes stay in browser storage and are outside the Supabase boundary, matching the existing privacy pattern for local-only wellness data.

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

Guided Program V2 uses the same discipline. Every guided-session duration is derived from absolute `Date.now()` boundaries — prep, continuous blocks, open-ended rescue recovery, and uninterrupted attempts — so a dimmed screen or a throttled tab cannot make a timer drift. A compact snapshot of the running session is kept in `localStorage` and restored through a schema parse; restoration only re-derives elapsed time from real timestamps and never fabricates progress to fill a gap. Rescue recovery has no countdown: it is elapsed time plus an explicit user confirmation that urgency is genuinely back around 3-4/10.

## Deployment assumptions

- Node 24 and the repository-pinned Yarn 4 release are the supported JavaScript toolchain.
- Migrations under `supabase/migrations/` are the source of truth for existing databases.
- CI builds with the immutable Yarn lockfile.
- Browser and privacy workflows use a fresh local Supabase stack so production-readiness checks do not depend on a developer's hosted project.
