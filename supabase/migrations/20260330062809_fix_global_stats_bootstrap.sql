CREATE OR REPLACE FUNCTION increment_global_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats_id UUID;
BEGIN
    SELECT id
    INTO v_stats_id
    FROM public.global_stats
    LIMIT 1;

    IF v_stats_id IS NULL THEN
        INSERT INTO public.global_stats (id, active_users_count, total_sessions_count, last_updated)
        VALUES (gen_random_uuid(), 0, 1, NOW());
    ELSE
        UPDATE public.global_stats
        SET total_sessions_count = total_sessions_count + 1,
            last_updated = NOW()
        WHERE id = v_stats_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_active_users_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats_id UUID;
    v_active_users_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id)
    INTO v_active_users_count
    FROM public.sessions
    WHERE created_at > NOW() - INTERVAL '30 days';

    SELECT id
    INTO v_stats_id
    FROM public.global_stats
    LIMIT 1;

    IF v_stats_id IS NULL THEN
        INSERT INTO public.global_stats (id, active_users_count, total_sessions_count, last_updated)
        VALUES (gen_random_uuid(), v_active_users_count, 0, NOW());
    ELSE
        UPDATE public.global_stats
        SET active_users_count = v_active_users_count,
            last_updated = NOW()
        WHERE id = v_stats_id;
    END IF;

    RETURN NEW;
END;
$$;
