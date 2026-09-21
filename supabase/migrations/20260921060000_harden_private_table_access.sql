-- Close the pre-hardening access paths to private training data.
--
-- The hosted project predates the checked-in migration set, so it still carries
-- leftovers that these migrations never create:
--
--   * `Enable all access for all users` (PUBLIC, `USING true`) on `sessions` and
--     `edge_events`, which let any authenticated account read and mutate every
--     other account's training rows.
--   * `Public can view non-expired shared links` on `shared_sessions`, which let
--     anonymous clients enumerate every active share payload.
--   * Table-level grants inherited from the default Supabase privileges, which
--     gave `anon` read and write access to private training tables.
--
-- This migration is forward-only and idempotent. On a database built from the
-- migration set it removes nothing that is still required; it only establishes the
-- intended posture: a private row is reachable only by its owner, and anonymous
-- access to a share happens exclusively through `get_shared_session(uuid)`.

-- Permissive leftovers.
DROP POLICY IF EXISTS "Enable all access for all users" ON public.sessions;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.edge_events;
DROP POLICY IF EXISTS "Public can view non-expired shared links" ON public.shared_sessions;

-- Owner-scoped access remains through the policies created by the migration set:
--   sessions        "Users can manage their own sessions"
--   edge_events     "Users can manage their own edge events"
--   shared_sessions "Creators can view own shared sessions"

-- Anonymous clients never touch private training data.
REVOKE ALL ON public.sessions FROM anon;
REVOKE ALL ON public.edge_events FROM anon;
REVOKE ALL ON public.shared_sessions FROM anon;
REVOKE ALL ON public.user_achievements FROM anon;

-- Anonymous clients may read the shared achievement catalogue and nothing else.
REVOKE ALL ON public.achievements FROM anon;
REVOKE ALL ON public.global_stats FROM anon;
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT SELECT ON public.global_stats TO anon, authenticated;

-- Authenticated clients keep owner-scoped access through row-level security.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edge_events TO authenticated;
GRANT SELECT, INSERT ON public.shared_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
