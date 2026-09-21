-- Guided Program V2
--
-- Adds the V2 persistence model and the authoritative recording RPC.
--
-- Design notes:
--   * V1 tables (`program_sessions`, `program_progress`) are intentionally left
--     untouched so legacy history is preserved. They are never read or written
--     by the active V2 product and are never converted into V2 progression.
--   * The V2 tables are read-only to clients (SELECT + RLS). All writes go
--     through the SECURITY DEFINER functions below, which recompute progression
--     eligibility, target pass/fail and the rolling gate server-side. A browser
--     can never write `current_target_ms` directly.
--   * The ladder, gate windows and rescue rules mirror `src/lib/program/protocol-v2.ts`.

-- ---------------------------------------------------------------------------
-- Progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.program_v2_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_version INTEGER NOT NULL DEFAULT 2 CHECK (protocol_version >= 2),
    current_target_ms INTEGER NOT NULL DEFAULT 120000 CHECK (
        current_target_ms IN (
            120000, 150000, 180000, 210000, 240000, 270000,
            300000, 360000, 420000, 480000, 540000, 600000
        )
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
    initial_baseline_bucket TEXT CHECK (
        initial_baseline_bucket IS NULL
        OR initial_baseline_bucket IN ('under_2', '2_3', '3_5', '5_plus', 'unknown')
    ),
    program_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_session_at TIMESTAMPTZ,
    last_ejaculation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.program_v2_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (
        session_type IN ('control', 'reset', 'endurance', 'easy', 'baseline', 'transfer')
    ),
    scheduled_local_date DATE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    target_duration_ms INTEGER CHECK (
        target_duration_ms IS NULL OR (target_duration_ms >= 0 AND target_duration_ms <= 600000)
    ),

    main_training_duration_ms INTEGER CHECK (
        main_training_duration_ms IS NULL OR (main_training_duration_ms >= 0 AND main_training_duration_ms <= 86400000)
    ),
    continuous_attempt_ms INTEGER CHECK (
        continuous_attempt_ms IS NULL OR (continuous_attempt_ms >= 0 AND continuous_attempt_ms <= 86400000)
    ),
    longest_continuous_block_ms INTEGER CHECK (
        longest_continuous_block_ms IS NULL OR (longest_continuous_block_ms >= 0 AND longest_continuous_block_ms <= 86400000)
    ),

    rescue_stop_count INTEGER NOT NULL DEFAULT 0 CHECK (rescue_stop_count >= 0),
    rescue_stop_total_ms INTEGER NOT NULL DEFAULT 0 CHECK (rescue_stop_total_ms >= 0),

    time_in_target_range_ms INTEGER CHECK (
        time_in_target_range_ms IS NULL OR (time_in_target_range_ms >= 0 AND time_in_target_range_ms <= 86400000)
    ),
    highest_arousal_reached INTEGER CHECK (
        highest_arousal_reached IS NULL OR (highest_arousal_reached BETWEEN 0 AND 10)
    ),

    standardized BOOLEAN NOT NULL DEFAULT false,
    progression_eligible BOOLEAN NOT NULL DEFAULT false,
    target_passed BOOLEAN NOT NULL DEFAULT false,

    anti_loop_terminated BOOLEAN NOT NULL DEFAULT false,
    completed_protocol BOOLEAN NOT NULL DEFAULT false,

    stimulus_type TEXT NOT NULL DEFAULT 'hand' CHECK (stimulus_type IN ('hand', 'sleeve')),
    lube_used BOOLEAN,
    porn_used BOOLEAN,

    ejaculation_outcome TEXT CHECK (
        ejaculation_outcome IS NULL
        OR ejaculation_outcome IN ('none', 'during_training', 'intentional_after')
    ),
    days_since_last_ejaculation INTEGER CHECK (
        days_since_last_ejaculation IS NULL OR days_since_last_ejaculation >= 0
    ),

    control_rating INTEGER CHECK (control_rating IS NULL OR control_rating BETWEEN 1 AND 5),
    breathing_maintained TEXT CHECK (
        breathing_maintained IS NULL OR breathing_maintained IN ('yes', 'mostly', 'no')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Rescue events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.program_v2_rescue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.program_v2_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_offset_ms INTEGER NOT NULL CHECK (started_offset_ms >= 0),
    ended_offset_ms INTEGER CHECK (ended_offset_ms IS NULL OR ended_offset_ms >= started_offset_ms),
    duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
    arousal_before INTEGER CHECK (arousal_before IS NULL OR arousal_before BETWEEN 0 AND 10),
    arousal_after INTEGER CHECK (arousal_after IS NULL OR arousal_after BETWEEN 0 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_program_v2_progress_user_id
    ON public.program_v2_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_program_v2_sessions_user_created_at
    ON public.program_v2_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_v2_sessions_user_type_created_at
    ON public.program_v2_sessions(user_id, session_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_v2_sessions_gate
    ON public.program_v2_sessions(user_id, target_duration_ms, created_at DESC)
    WHERE progression_eligible;

CREATE INDEX IF NOT EXISTS idx_program_v2_sessions_user_local_date
    ON public.program_v2_sessions(user_id, scheduled_local_date DESC);

CREATE INDEX IF NOT EXISTS idx_program_v2_rescue_events_session_id
    ON public.program_v2_rescue_events(session_id);

CREATE INDEX IF NOT EXISTS idx_program_v2_rescue_events_user_id
    ON public.program_v2_rescue_events(user_id);

-- ---------------------------------------------------------------------------
-- Row level security: owners read, nobody writes directly
-- ---------------------------------------------------------------------------

ALTER TABLE public.program_v2_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_v2_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_v2_rescue_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own v2 program progress" ON public.program_v2_progress;
CREATE POLICY "Users can read their own v2 program progress"
    ON public.program_v2_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own v2 program sessions" ON public.program_v2_sessions;
CREATE POLICY "Users can read their own v2 program sessions"
    ON public.program_v2_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own v2 rescue events" ON public.program_v2_rescue_events;
CREATE POLICY "Users can read their own v2 rescue events"
    ON public.program_v2_rescue_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Read-only to clients: every mutation must go through the RPCs below so the
-- server remains the authority on advancement.
REVOKE ALL ON public.program_v2_progress FROM anon, authenticated;
REVOKE ALL ON public.program_v2_sessions FROM anon, authenticated;
REVOKE ALL ON public.program_v2_rescue_events FROM anon, authenticated;

GRANT SELECT ON public.program_v2_progress TO authenticated;
GRANT SELECT ON public.program_v2_sessions TO authenticated;
GRANT SELECT ON public.program_v2_rescue_events TO authenticated;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_program_v2_progress_updated_at ON public.program_v2_progress;
CREATE TRIGGER trg_program_v2_progress_updated_at
    BEFORE UPDATE ON public.program_v2_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.set_program_progress_updated_at();

-- ---------------------------------------------------------------------------
-- Shared server-side helpers
-- ---------------------------------------------------------------------------

-- Next rung on the ladder, or NULL at the 10:00 top.
CREATE OR REPLACE FUNCTION public.program_v2_next_target(p_target_ms INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT MIN(target_ms)
    FROM (
        VALUES (120000), (150000), (180000), (210000), (240000), (270000),
               (300000), (360000), (420000), (480000), (540000), (600000)
    ) AS ladder(target_ms)
    WHERE target_ms > p_target_ms;
$$;

-- Conservative initial device target: ~50% of the hand target, floored to 30s, min 1:00.
CREATE OR REPLACE FUNCTION public.program_v2_sleeve_target(p_hand_target_ms INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT GREATEST(60000, ((p_hand_target_ms / 2) / 30000) * 30000);
$$;

-- ---------------------------------------------------------------------------
-- Onboarding: initialize V2 progress
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.initialize_program_v2(p_bucket TEXT DEFAULT 'unknown')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_bucket TEXT;
    v_target INTEGER;
    v_progress public.program_v2_progress%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_bucket := COALESCE(p_bucket, 'unknown');
    IF v_bucket NOT IN ('under_2', '2_3', '3_5', '5_plus', 'unknown') THEN
        RAISE EXCEPTION 'Invalid baseline bucket: %', v_bucket;
    END IF;

    -- Self-report is only a placement aid and never jumps above the 5:00 checkpoint.
    v_target := CASE v_bucket
        WHEN 'under_2' THEN 120000
        WHEN '2_3' THEN 150000
        WHEN '3_5' THEN 210000
        WHEN '5_plus' THEN 300000
        ELSE 120000
    END;

    SELECT *
    INTO v_progress
    FROM public.program_v2_progress
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.program_v2_progress (
            user_id,
            protocol_version,
            current_target_ms,
            status,
            initial_baseline_bucket,
            program_started_at,
            target_started_at
        )
        VALUES (
            v_user_id,
            2,
            v_target,
            'active',
            v_bucket,
            NOW(),
            NOW()
        )
        RETURNING *
        INTO v_progress;
    END IF;

    RETURN jsonb_build_object(
        'current_target_ms', v_progress.current_target_ms,
        'status', v_progress.status,
        'initial_baseline_bucket', v_progress.initial_baseline_bucket,
        'sleeve_target_ms', public.program_v2_sleeve_target(v_progress.current_target_ms)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_program_v2(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_program_v2(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Authoritative session recording
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_program_v2_session(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();

    v_progress public.program_v2_progress%ROWTYPE;
    v_prior_target INTEGER;
    v_current_target INTEGER;
    v_status TEXT;

    v_session_type TEXT;
    v_local_date DATE;
    v_started_at TIMESTAMPTZ;
    v_completed_at TIMESTAMPTZ;

    v_main_training_ms INTEGER;
    v_continuous_attempt_ms INTEGER;
    v_longest_block_ms INTEGER;
    v_time_in_range_ms INTEGER;
    v_highest_arousal INTEGER;
    v_control_rating INTEGER;
    v_breathing TEXT;
    v_notes TEXT;
    v_stimulus_type TEXT;
    v_lube_used BOOLEAN;
    v_porn_used BOOLEAN;
    v_standardized BOOLEAN;
    v_completed_protocol BOOLEAN;
    v_anti_loop BOOLEAN;
    v_ejaculation_outcome TEXT;

    v_rescue_count INTEGER;
    v_rescue_total_ms INTEGER;

    v_session_id UUID;
    v_obs_duration INTEGER;
    v_already_counted BOOLEAN;
    v_eligible BOOLEAN;
    v_target_passed BOOLEAN;
    v_days_since INTEGER;

    v_required_observations INTEGER;
    v_required_passes INTEGER;
    v_required_strict INTEGER;
    v_observation_count INTEGER;
    v_pass_count INTEGER;
    v_strict_pass_count INTEGER;
    v_should_advance BOOLEAN;
    v_next_target INTEGER;
    v_advanced BOOLEAN := FALSE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
        RAISE EXCEPTION 'A session payload object is required';
    END IF;

    v_session_type := p_payload->>'session_type';
    IF v_session_type IS NULL
       OR v_session_type NOT IN ('control', 'reset', 'endurance', 'easy', 'baseline', 'transfer') THEN
        RAISE EXCEPTION 'Invalid session type: %', v_session_type;
    END IF;

    BEGIN
        v_local_date := (p_payload->>'scheduled_local_date')::DATE;
    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'A valid scheduled_local_date is required';
    END;
    IF v_local_date IS NULL THEN
        RAISE EXCEPTION 'A valid scheduled_local_date is required';
    END IF;

    v_started_at := COALESCE((p_payload->>'started_at')::TIMESTAMPTZ, NOW());
    v_completed_at := COALESCE((p_payload->>'completed_at')::TIMESTAMPTZ, NOW());
    IF v_completed_at < v_started_at THEN
        RAISE EXCEPTION 'completed_at cannot precede started_at';
    END IF;

    v_ejaculation_outcome := p_payload->>'ejaculation_outcome';
    IF v_ejaculation_outcome IS NOT NULL
       AND v_ejaculation_outcome NOT IN ('none', 'during_training', 'intentional_after') THEN
        RAISE EXCEPTION 'Invalid ejaculation outcome: %', v_ejaculation_outcome;
    END IF;

    v_stimulus_type := COALESCE(p_payload->>'stimulus_type', 'hand');
    IF v_stimulus_type NOT IN ('hand', 'sleeve') THEN
        RAISE EXCEPTION 'Invalid stimulus type: %', v_stimulus_type;
    END IF;

    v_breathing := p_payload->>'breathing_maintained';
    IF v_breathing IS NOT NULL AND v_breathing NOT IN ('yes', 'mostly', 'no') THEN
        RAISE EXCEPTION 'Invalid breathing rating: %', v_breathing;
    END IF;

    v_main_training_ms := (p_payload->>'main_training_duration_ms')::INTEGER;
    v_continuous_attempt_ms := (p_payload->>'continuous_attempt_ms')::INTEGER;
    v_longest_block_ms := (p_payload->>'longest_continuous_block_ms')::INTEGER;
    v_time_in_range_ms := (p_payload->>'time_in_target_range_ms')::INTEGER;
    v_highest_arousal := (p_payload->>'highest_arousal_reached')::INTEGER;
    v_control_rating := (p_payload->>'control_rating')::INTEGER;
    v_notes := NULLIF(p_payload->>'notes', '');

    v_lube_used := (p_payload->>'lube_used')::BOOLEAN;
    v_porn_used := (p_payload->>'porn_used')::BOOLEAN;
    v_standardized := COALESCE((p_payload->>'standardized')::BOOLEAN, FALSE);
    v_completed_protocol := COALESCE((p_payload->>'completed_protocol')::BOOLEAN, FALSE);
    v_anti_loop := COALESCE((p_payload->>'anti_loop_terminated')::BOOLEAN, FALSE);

    -- Rescue events are the authority for the rescue count, never the client scalar.
    IF jsonb_typeof(p_payload->'rescue_events') = 'array' THEN
        v_rescue_count := jsonb_array_length(p_payload->'rescue_events');
    ELSE
        v_rescue_count := COALESCE((p_payload->>'rescue_stop_count')::INTEGER, 0);
    END IF;
    v_rescue_total_ms := COALESCE((p_payload->>'rescue_stop_total_ms')::INTEGER, 0);

    -- Load progress under lock so concurrent sessions cannot race an advance.
    SELECT *
    INTO v_progress
    FROM public.program_v2_progress
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.program_v2_progress (
            user_id, protocol_version, current_target_ms, status,
            initial_baseline_bucket, program_started_at, target_started_at
        )
        VALUES (v_user_id, 2, 120000, 'active', 'unknown', NOW(), NOW())
        RETURNING *
        INTO v_progress;
    END IF;

    v_prior_target := v_progress.current_target_ms;
    v_current_target := v_progress.current_target_ms;
    v_status := v_progress.status;

    -- Days since last ejaculation is context computed from stored history.
    IF v_progress.last_ejaculation_at IS NOT NULL THEN
        v_days_since := GREATEST(
            0,
            FLOOR(EXTRACT(EPOCH FROM (v_completed_at - v_progress.last_ejaculation_at)) / 86400)::INTEGER
        );
    END IF;

    INSERT INTO public.program_v2_sessions (
        user_id,
        session_type,
        scheduled_local_date,
        started_at,
        completed_at,
        target_duration_ms,
        main_training_duration_ms,
        continuous_attempt_ms,
        longest_continuous_block_ms,
        rescue_stop_count,
        rescue_stop_total_ms,
        time_in_target_range_ms,
        highest_arousal_reached,
        standardized,
        progression_eligible,
        target_passed,
        anti_loop_terminated,
        completed_protocol,
        stimulus_type,
        lube_used,
        porn_used,
        ejaculation_outcome,
        days_since_last_ejaculation,
        control_rating,
        breathing_maintained,
        notes
    )
    VALUES (
        v_user_id,
        v_session_type,
        v_local_date,
        v_started_at,
        v_completed_at,
        CASE
            WHEN v_session_type IN ('control', 'endurance', 'baseline') THEN v_current_target
            WHEN v_session_type = 'transfer' THEN public.program_v2_sleeve_target(v_current_target)
            ELSE NULL
        END,
        v_main_training_ms,
        v_continuous_attempt_ms,
        v_longest_block_ms,
        v_rescue_count,
        v_rescue_total_ms,
        v_time_in_range_ms,
        v_highest_arousal,
        v_standardized,
        FALSE,
        FALSE,
        v_anti_loop,
        v_completed_protocol,
        v_stimulus_type,
        v_lube_used,
        v_porn_used,
        v_ejaculation_outcome,
        v_days_since,
        v_control_rating,
        v_breathing,
        v_notes
    )
    RETURNING id INTO v_session_id;

    IF jsonb_typeof(p_payload->'rescue_events') = 'array' THEN
        INSERT INTO public.program_v2_rescue_events (
            session_id, user_id, started_offset_ms, ended_offset_ms, duration_ms, arousal_before, arousal_after
        )
        SELECT
            v_session_id,
            v_user_id,
            COALESCE((elem->>'started_offset_ms')::INTEGER, 0),
            (elem->>'ended_offset_ms')::INTEGER,
            (elem->>'duration_ms')::INTEGER,
            (elem->>'arousal_before')::INTEGER,
            (elem->>'arousal_after')::INTEGER
        FROM jsonb_array_elements(p_payload->'rescue_events') AS elem;
    END IF;

    -- ---- Server-side progression eligibility -----------------------------
    v_obs_duration := CASE v_session_type
        WHEN 'control' THEN v_longest_block_ms
        WHEN 'endurance' THEN v_continuous_attempt_ms
        WHEN 'baseline' THEN v_continuous_attempt_ms
        ELSE NULL
    END;

    v_eligible := FALSE;

    IF v_session_type = 'control' THEN
        v_eligible := v_completed_protocol AND NOT v_anti_loop AND v_rescue_count <= 3;
    ELSIF v_session_type = 'endurance' THEN
        v_eligible := v_completed_protocol;
    ELSIF v_session_type = 'baseline' THEN
        v_eligible := v_standardized
            AND v_stimulus_type = 'hand'
            AND COALESCE(v_lube_used, FALSE)
            AND NOT COALESCE(v_porn_used, FALSE);
    END IF;

    IF v_obs_duration IS NULL OR v_obs_duration < 0 THEN
        v_eligible := FALSE;
    END IF;

    -- Only one progression-eligible observation may count per local calendar day.
    IF v_eligible THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.program_v2_sessions other
            WHERE other.user_id = v_user_id
              AND other.scheduled_local_date = v_local_date
              AND other.progression_eligible
              AND other.id <> v_session_id
        )
        INTO v_already_counted;

        IF v_already_counted THEN
            v_eligible := FALSE;
        END IF;
    END IF;

    v_target_passed := v_eligible AND v_obs_duration >= v_current_target;

    UPDATE public.program_v2_sessions
    SET progression_eligible = v_eligible,
        target_passed = v_target_passed
    WHERE id = v_session_id;

    -- ---- Rolling gate ----------------------------------------------------
    IF v_current_target = 300000 THEN
        v_required_observations := 5;
        v_required_passes := 4;
        v_required_strict := 2;
    ELSE
        v_required_observations := 4;
        v_required_passes := 3;
        v_required_strict := 1;
    END IF;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (
            WHERE obs.observation_ms >= v_current_target
        ),
        COUNT(*) FILTER (
            WHERE obs.observation_ms >= v_current_target
              AND obs.session_type IN ('endurance', 'baseline')
        )
    INTO v_observation_count, v_pass_count, v_strict_pass_count
    FROM (
        SELECT
            CASE s.session_type
                WHEN 'control' THEN s.longest_continuous_block_ms
                WHEN 'endurance' THEN s.continuous_attempt_ms
                WHEN 'baseline' THEN s.continuous_attempt_ms
            END AS observation_ms,
            s.session_type
        FROM public.program_v2_sessions s
        WHERE s.user_id = v_user_id
          AND s.progression_eligible
          AND s.target_duration_ms = v_current_target
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT v_required_observations
    ) AS obs;

    v_should_advance :=
        v_observation_count >= v_required_observations
        AND v_pass_count >= v_required_passes
        AND v_strict_pass_count >= v_required_strict;

    IF v_should_advance THEN
        v_next_target := public.program_v2_next_target(v_current_target);

        IF v_next_target IS NULL THEN
            -- 10:00 established: maintenance, and never an eleventh target.
            v_status := 'maintenance';
        ELSE
            -- Exactly one rung. Never skip a target from a single session.
            v_current_target := v_next_target;
            v_advanced := TRUE;
        END IF;
    END IF;

    UPDATE public.program_v2_progress
    SET current_target_ms = v_current_target,
        status = v_status,
        target_started_at = CASE WHEN v_advanced THEN v_completed_at ELSE target_started_at END,
        last_session_at = v_completed_at,
        last_ejaculation_at = CASE
            WHEN v_ejaculation_outcome IN ('during_training', 'intentional_after') THEN v_completed_at
            ELSE last_ejaculation_at
        END
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'prior_target_ms', v_prior_target,
        'current_target_ms', v_current_target,
        'counted', v_eligible,
        'target_passed', v_target_passed,
        'advanced', v_advanced,
        'status', v_status,
        'gate', jsonb_build_object(
            'required_observations', v_required_observations,
            'required_passes', v_required_passes,
            'required_strict_passes', v_required_strict,
            'observation_count', v_observation_count,
            'pass_count', v_pass_count,
            'strict_pass_count', v_strict_pass_count,
            'should_advance', v_should_advance
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_program_v2_session(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_program_v2_session(JSONB) TO authenticated;
