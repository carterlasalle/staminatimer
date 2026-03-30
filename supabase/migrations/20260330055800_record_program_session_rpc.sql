CREATE OR REPLACE FUNCTION public.record_program_session(
    p_started_at TIMESTAMPTZ,
    p_completed_at TIMESTAMPTZ,
    p_duration_ms INTEGER,
    p_cycles_completed INTEGER,
    p_complete_stops INTEGER,
    p_time_in_zone_ms INTEGER,
    p_highest_arousal_reached INTEGER,
    p_accidentally_finished BOOLEAN,
    p_ended_early BOOLEAN,
    p_self_rating INTEGER,
    p_breathing_maintained TEXT,
    p_imagery_rating INTEGER,
    p_positions_used TEXT[],
    p_notes TEXT,
    p_lube_used BOOLEAN,
    p_toy_used BOOLEAN,
    p_ejaculation_outcome TEXT
)
RETURNS TABLE(advanced_to_phase INTEGER, previous_phase INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_progress public.program_progress%ROWTYPE;
    v_current_phase INTEGER;
    v_next_session_in_phase INTEGER;
    v_next_total_sessions INTEGER;
    v_did_ejaculate BOOLEAN;
    v_accidentally_finished BOOLEAN;
    v_qualifies BOOLEAN;
    v_next_phase INTEGER;
    v_next_sessions_in_phase INTEGER;
    v_next_qualifying INTEGER;
    v_next_phase_started_at TIMESTAMPTZ;
    v_next_phase_8_entered_at TIMESTAMPTZ;
    v_next_sessions_since_ejaculation INTEGER;
    v_next_last_ejaculation_session INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_ejaculation_outcome NOT IN ('no', 'accidental', 'intentional_after') THEN
        RAISE EXCEPTION 'Invalid ejaculation outcome: %', p_ejaculation_outcome;
    END IF;

    SELECT *
    INTO v_progress
    FROM public.program_progress
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.program_progress (
            user_id,
            current_phase,
            sessions_in_current_phase,
            qualifying_sessions_in_phase,
            total_sessions,
            sessions_since_ejaculation,
            phase_started_at,
            program_started_at,
            updated_at,
            daily_squat_streak
        )
        VALUES (
            v_user_id,
            1,
            0,
            0,
            0,
            0,
            NOW(),
            NOW(),
            NOW(),
            0
        )
        RETURNING *
        INTO v_progress;
    END IF;

    v_current_phase := COALESCE(v_progress.current_phase, 1);
    v_next_session_in_phase := COALESCE(v_progress.sessions_in_current_phase, 0) + 1;
    v_next_total_sessions := COALESCE(v_progress.total_sessions, 0) + 1;

    v_did_ejaculate := p_ejaculation_outcome IN ('accidental', 'intentional_after');
    v_accidentally_finished := COALESCE(p_accidentally_finished, FALSE) OR p_ejaculation_outcome = 'accidental';

    INSERT INTO public.program_sessions (
        user_id,
        phase,
        session_number_in_phase,
        started_at,
        completed_at,
        duration_ms,
        cycles_completed,
        complete_stops,
        time_in_zone_ms,
        highest_arousal_reached,
        accidentally_finished,
        ended_early,
        self_rating,
        breathing_maintained,
        imagery_rating,
        positions_used,
        notes,
        lube_used,
        toy_used
    )
    VALUES (
        v_user_id,
        v_current_phase,
        v_next_session_in_phase,
        p_started_at,
        p_completed_at,
        p_duration_ms,
        p_cycles_completed,
        p_complete_stops,
        p_time_in_zone_ms,
        p_highest_arousal_reached,
        v_accidentally_finished,
        p_ended_early,
        p_self_rating,
        p_breathing_maintained,
        p_imagery_rating,
        p_positions_used,
        p_notes,
        p_lube_used,
        p_toy_used
    );

    v_qualifies := NOT v_accidentally_finished AND NOT COALESCE(p_ended_early, FALSE);
    IF v_qualifies AND v_current_phase = 1 THEN
        v_qualifies := COALESCE(p_cycles_completed, 0) >= 3;
    END IF;

    v_next_phase := v_current_phase;
    v_next_sessions_in_phase := v_next_session_in_phase;
    v_next_qualifying := COALESCE(v_progress.qualifying_sessions_in_phase, 0) + CASE WHEN v_qualifies THEN 1 ELSE 0 END;
    v_next_phase_started_at := COALESCE(v_progress.phase_started_at, NOW());
    v_next_phase_8_entered_at := v_progress.phase_8_entered_at;

    IF v_current_phase < 8 AND v_next_qualifying >= 5 THEN
        v_next_phase := v_current_phase + 1;
        v_next_sessions_in_phase := 0;
        v_next_qualifying := 0;
        v_next_phase_started_at := NOW();
        IF v_next_phase = 8 AND v_next_phase_8_entered_at IS NULL THEN
            v_next_phase_8_entered_at := NOW();
        END IF;
    END IF;

    v_next_sessions_since_ejaculation := COALESCE(v_progress.sessions_since_ejaculation, 0) + 1;
    v_next_last_ejaculation_session := v_progress.last_ejaculation_session;

    IF v_did_ejaculate THEN
        v_next_sessions_since_ejaculation := 0;
        v_next_last_ejaculation_session := v_next_total_sessions;
    END IF;

    UPDATE public.program_progress
    SET
        current_phase = v_next_phase,
        sessions_in_current_phase = v_next_sessions_in_phase,
        qualifying_sessions_in_phase = v_next_qualifying,
        total_sessions = v_next_total_sessions,
        sessions_since_ejaculation = v_next_sessions_since_ejaculation,
        last_ejaculation_session = v_next_last_ejaculation_session,
        last_session_at = p_completed_at,
        phase_started_at = v_next_phase_started_at,
        phase_8_entered_at = v_next_phase_8_entered_at
    WHERE user_id = v_user_id;

    advanced_to_phase := CASE WHEN v_next_phase > v_current_phase THEN v_next_phase ELSE NULL END;
    previous_phase := v_current_phase;
    RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_program_session(
    TIMESTAMPTZ,
    TIMESTAMPTZ,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    BOOLEAN,
    BOOLEAN,
    INTEGER,
    TEXT,
    INTEGER,
    TEXT[],
    TEXT,
    BOOLEAN,
    BOOLEAN,
    TEXT
) TO authenticated;
