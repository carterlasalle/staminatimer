-- Prevent anonymous clients from enumerating active shared-session payloads.
-- Public consumers receive only the single opaque share ID they request.

DROP POLICY IF EXISTS "Users can view their own shared sessions or valid shared links"
    ON public.shared_sessions;
DROP POLICY IF EXISTS "Public can view non-expired shared links"
    ON public.shared_sessions;
DROP POLICY IF EXISTS "Creators can view own shared sessions"
    ON public.shared_sessions;

CREATE POLICY "Creators can view own shared sessions"
    ON public.shared_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Only authenticated users can create shared sessions"
    ON public.shared_sessions;
DROP POLICY IF EXISTS "Authenticated users can create shared sessions"
    ON public.shared_sessions;

CREATE POLICY "Authenticated users can create shared sessions"
    ON public.shared_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.get_shared_session(p_share_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT sessions_data
    FROM public.shared_sessions
    WHERE id = p_share_id
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_session(UUID) TO anon, authenticated;
