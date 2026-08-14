-- Complete the privileges required by the API roles after a migration-only rebuild.
-- RLS remains the authorization boundary; these grants only allow PostgREST to
-- reach the policies defined on each table.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edge_events TO authenticated;
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT ON public.shared_sessions TO authenticated;
GRANT SELECT ON public.global_stats TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_progress TO authenticated;

-- Finalizing while the timer is inside an edge must close the open edge row and
-- finalize the parent session in one database transaction. PostgreSQL functions
-- execute atomically, and SECURITY INVOKER keeps the existing RLS policies in force.
CREATE OR REPLACE FUNCTION public.finish_timer_session(
    p_session_id UUID,
    p_end_time TIMESTAMPTZ,
    p_active_duration INTEGER,
    p_edge_duration INTEGER,
    p_total_duration INTEGER,
    p_finished_during_edge BOOLEAN,
    p_open_edge_duration INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_session_rows INTEGER;
    v_edge_rows INTEGER;
BEGIN
    IF p_active_duration < 0 OR p_edge_duration < 0 OR p_total_duration < 0 THEN
        RAISE EXCEPTION 'Timer durations cannot be negative';
    END IF;

    IF ABS(p_total_duration - (p_active_duration + p_edge_duration)) > 1000 THEN
        RAISE EXCEPTION 'Timer duration totals are inconsistent';
    END IF;

    IF p_finished_during_edge THEN
        IF p_open_edge_duration IS NULL OR p_open_edge_duration < 0 THEN
            RAISE EXCEPTION 'An open edge duration is required when finishing during an edge';
        END IF;

        UPDATE public.edge_events
        SET end_time = p_end_time,
            duration = p_open_edge_duration
        WHERE session_id = p_session_id
          AND end_time IS NULL;

        GET DIAGNOSTICS v_edge_rows = ROW_COUNT;
        IF v_edge_rows <> 1 THEN
            RAISE EXCEPTION 'Expected exactly one open edge event, found %', v_edge_rows;
        END IF;
    END IF;

    UPDATE public.sessions
    SET end_time = p_end_time,
        active_duration = p_active_duration,
        edge_duration = p_edge_duration,
        total_duration = p_total_duration,
        finished_during_edge = p_finished_during_edge
    WHERE id = p_session_id
      AND user_id = auth.uid();

    GET DIAGNOSTICS v_session_rows = ROW_COUNT;
    IF v_session_rows <> 1 THEN
        RAISE EXCEPTION 'Session is missing or not owned by the current user';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.finish_timer_session(UUID, TIMESTAMPTZ, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_timer_session(UUID, TIMESTAMPTZ, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER) TO authenticated;
