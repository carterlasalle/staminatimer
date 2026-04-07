-- Repair historical data inconsistencies and harden table integrity.

-- Shared links should never expire before they are created.
UPDATE public.shared_sessions
SET expires_at = created_at + INTERVAL '1 hour'
WHERE expires_at IS NOT NULL
  AND created_at IS NOT NULL
  AND expires_at < created_at;

ALTER TABLE public.shared_sessions
  DROP CONSTRAINT IF EXISTS check_shared_sessions_expiry_after_creation;

ALTER TABLE public.shared_sessions
  ADD CONSTRAINT check_shared_sessions_expiry_after_creation
  CHECK (
    expires_at IS NULL
    OR created_at IS NULL
    OR expires_at >= created_at
  );

-- Completed achievements should always have an unlock timestamp.
UPDATE public.user_achievements
SET unlocked_at = NOW()
WHERE progress >= 100
  AND unlocked_at IS NULL;

CREATE OR REPLACE FUNCTION public.recalculate_global_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats_id UUID;
    v_total_sessions INTEGER;
    v_active_users_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO v_total_sessions
    FROM public.sessions;

    SELECT COUNT(DISTINCT user_id)::INTEGER
    INTO v_active_users_count
    FROM public.sessions
    WHERE created_at > NOW() - INTERVAL '30 days';

    SELECT id
    INTO v_stats_id
    FROM public.global_stats
    ORDER BY last_updated DESC NULLS LAST, id
    LIMIT 1;

    IF v_stats_id IS NULL THEN
        INSERT INTO public.global_stats (id, active_users_count, total_sessions_count, last_updated)
        VALUES (gen_random_uuid(), v_active_users_count, v_total_sessions, NOW())
        RETURNING id INTO v_stats_id;
    ELSE
        UPDATE public.global_stats
        SET active_users_count = v_active_users_count,
            total_sessions_count = v_total_sessions,
            last_updated = NOW()
        WHERE id = v_stats_id;
    END IF;

    DELETE FROM public.global_stats
    WHERE id <> v_stats_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_global_stats_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.recalculate_global_stats();
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_session_created ON public.sessions;
DROP TRIGGER IF EXISTS on_session_update_active_users ON public.sessions;
DROP TRIGGER IF EXISTS trg_sync_global_stats_on_sessions ON public.sessions;

CREATE TRIGGER trg_sync_global_stats_on_sessions
AFTER INSERT OR UPDATE OF user_id, created_at OR DELETE
ON public.sessions
FOR EACH STATEMENT
EXECUTE FUNCTION public.sync_global_stats_trigger();

SELECT public.recalculate_global_stats();
