-- Enable UUID extension
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Already seems enabled based on JSON dump

-- Drop existing tables if needed for a clean slate (Use with caution!)
-- DROP TABLE IF EXISTS public.edge_events CASCADE;
-- DROP TABLE IF EXISTS public.sessions CASCADE;

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    total_duration INTEGER,
    active_duration INTEGER,
    edge_duration INTEGER,
    finished_during_edge BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create edge_events table with proper foreign key
CREATE TABLE IF NOT EXISTS public.edge_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    CONSTRAINT fk_session
        FOREIGN KEY(session_id)
        REFERENCES public.sessions(id)
        ON DELETE CASCADE
);
ALTER TABLE public.edge_events ENABLE ROW LEVEL SECURITY;

-- Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL, -- 'endurance', 'control', 'progress', 'special'
    condition_type TEXT NOT NULL, -- 'duration', 'edge_count', 'edge_duration', 'streak', 'custom'
    condition_value INTEGER NOT NULL,
    condition_comparison TEXT, -- 'greater', 'less', 'equal' (optional)
    points INTEGER DEFAULT 0,
    icon TEXT -- Identifier for icon (e.g., Lucide icon name)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    UNIQUE (user_id, achievement_id) -- Ensure user has only one entry per achievement
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Shared Sessions Table
CREATE TABLE IF NOT EXISTS public.shared_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Keep record even if user is deleted
    sessions_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Global Stats Table (assuming single row for simplicity)
CREATE TABLE IF NOT EXISTS public.global_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Or just use a fixed ID like 'global'
    active_users_count INTEGER DEFAULT 0,
    total_sessions_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;
-- Seed initial global stats if needed
-- INSERT INTO public.global_stats (id, active_users_count, total_sessions_count) VALUES (gen_random_uuid(), 0, 0) ON CONFLICT DO NOTHING;

-- Rate Limits Table (Optional - if using DB-based rate limiting)
-- CREATE TABLE IF NOT EXISTS public.rate_limits (
--    id SERIAL PRIMARY KEY,
--    key TEXT UNIQUE NOT NULL,
--    count INTEGER DEFAULT 1,
--    created_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies --

-- Sessions
DROP POLICY IF EXISTS "Users can only see their own sessions" ON public.sessions;
CREATE POLICY "Users can manage their own sessions"
    ON public.sessions
    FOR ALL
    USING (auth.uid() = user_id);

-- Edge Events
DROP POLICY IF EXISTS "Users can only see their own edge events through sessions" ON public.edge_events;
CREATE POLICY "Users can manage their own edge events"
    ON public.edge_events
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = edge_events.session_id AND sessions.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = edge_events.session_id AND sessions.user_id = auth.uid()));

-- Achievements
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements"
    ON public.achievements
    FOR SELECT
    USING (true);

-- User Achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert/update user achievements" ON public.user_achievements;
CREATE POLICY "Users can insert/update their own achievement progress" -- Renamed for clarity
    ON public.user_achievements
    FOR ALL -- Allow INSERT and UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); -- Restrict to authenticated user modifying their own record

-- Shared Sessions
DROP POLICY IF EXISTS "Users can view their own shared sessions or valid shared links" ON public.shared_sessions;
DROP POLICY IF EXISTS "Public can view non-expired shared links" ON public.shared_sessions;
DROP POLICY IF EXISTS "Creators can view own shared sessions" ON public.shared_sessions;
CREATE POLICY "Creators can view own shared sessions"
    ON public.shared_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Only authenticated users can create shared sessions" ON public.shared_sessions;
CREATE POLICY "Authenticated users can create shared sessions"
    ON public.shared_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Public share reads must go through a narrow SECURITY DEFINER function.
-- Granting anon SELECT on the table would allow enumeration of every active share.
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

-- Global Stats
DROP POLICY IF EXISTS "Anyone can view global stats" ON public.global_stats;
CREATE POLICY "Anyone can view global stats"
    ON public.global_stats
    FOR SELECT
    USING (true);

-- SECURITY FIX: Remove direct update policy for global stats
-- Global stats should only be updated via triggers with SECURITY DEFINER
-- This prevents any user from manipulating global statistics
DROP POLICY IF EXISTS "update_global_stats_policy" ON public.global_stats;
DROP POLICY IF EXISTS "Authenticated users can update global stats" ON public.global_stats;
-- No UPDATE policy = no direct updates allowed from client

-- Trigger function to auto-increment session count (SECURITY DEFINER bypasses RLS)
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

-- Trigger to increment session count when a new session is created
DROP TRIGGER IF EXISTS on_session_created ON public.sessions;
CREATE TRIGGER on_session_created
    AFTER INSERT ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION increment_global_sessions();

-- Trigger function to update active users count (based on users with sessions in last 30 days)
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

-- Trigger to update active users on session insert
DROP TRIGGER IF EXISTS on_session_update_active_users ON public.sessions;
CREATE TRIGGER on_session_update_active_users
    AFTER INSERT ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_active_users_count();

-- Rate Limits (if using)
-- DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.rate_limits;
-- CREATE POLICY "Enable read for authenticated users" ON public.rate_limits FOR SELECT USING (auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rate_limits;
-- CREATE POLICY "Enable insert for authenticated users" ON public.rate_limits FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- These indexes optimize common query patterns

-- Sessions: Sorting by created_at is common (recent sessions, charts)
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);

-- Sessions: Composite index for user's recent sessions (streak calculation, dashboard)
-- This is the most used query pattern: WHERE user_id = ? ORDER BY created_at DESC
-- Note: This composite index also serves queries filtering only on user_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.sessions(user_id, created_at DESC);

-- Sessions: Index on total_duration for sorting by duration
CREATE INDEX IF NOT EXISTS idx_sessions_total_duration ON public.sessions(total_duration DESC);

-- Edge events: Foreign key lookups and joins
CREATE INDEX IF NOT EXISTS idx_edge_events_session_id ON public.edge_events(session_id);

-- User achievements: User lookups for dashboard
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- User achievements: Finding users with specific achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- Shared sessions: Cleanup of expired sessions and validity checks
CREATE INDEX IF NOT EXISTS idx_shared_sessions_expires_at ON public.shared_sessions(expires_at)
    WHERE expires_at IS NOT NULL;

-- Shared sessions: Find sessions created by a user
CREATE INDEX IF NOT EXISTS idx_shared_sessions_created_by ON public.shared_sessions(created_by)
    WHERE created_by IS NOT NULL;

-- =====================================================
-- SERVER-SIDE VALIDATION CONSTRAINTS
-- =====================================================
-- These CHECK constraints enforce data integrity at the database level
-- They prevent client-side manipulation of sensitive values

-- Sessions: Enforce reasonable duration bounds
-- Max duration: 24 hours (86400000ms) - no legitimate session would be longer
-- Min duration: 0 (allows partial/incomplete sessions)
ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS check_session_total_duration;
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_total_duration
    CHECK (total_duration IS NULL OR (total_duration >= 0 AND total_duration <= 86400000));

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS check_session_active_duration;
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_active_duration
    CHECK (active_duration IS NULL OR (active_duration >= 0 AND active_duration <= 86400000));

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS check_session_edge_duration;
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_edge_duration
    CHECK (edge_duration IS NULL OR (edge_duration >= 0 AND edge_duration <= 86400000));

-- Sessions: Ensure durations are logically consistent
-- Total duration should equal active + edge (with some tolerance for rounding)
ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS check_session_duration_consistency;
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_duration_consistency
    CHECK (
        total_duration IS NULL OR
        active_duration IS NULL OR
        edge_duration IS NULL OR
        -- Allow 1 second tolerance for timing edge cases
        ABS(total_duration - (active_duration + edge_duration)) <= 1000
    );

-- Edge events: Enforce reasonable duration bounds
ALTER TABLE public.edge_events
    DROP CONSTRAINT IF EXISTS check_edge_event_duration;
ALTER TABLE public.edge_events
    ADD CONSTRAINT check_edge_event_duration
    CHECK (duration IS NULL OR (duration >= 0 AND duration <= 86400000));

-- User achievements: Progress should be 0-100
ALTER TABLE public.user_achievements
    DROP CONSTRAINT IF EXISTS check_achievement_progress;
ALTER TABLE public.user_achievements
    ADD CONSTRAINT check_achievement_progress
    CHECK (progress >= 0 AND progress <= 100);

-- =====================================================
-- PROGRAM TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.program_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 8),
    session_number_in_phase INTEGER NOT NULL DEFAULT 1 CHECK (session_number_in_phase >= 1),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
    cycles_completed INTEGER DEFAULT 0 CHECK (cycles_completed IS NULL OR cycles_completed >= 0),
    complete_stops INTEGER DEFAULT 0 CHECK (complete_stops IS NULL OR complete_stops >= 0),
    time_in_zone_ms INTEGER DEFAULT 0 CHECK (time_in_zone_ms IS NULL OR time_in_zone_ms >= 0),
    highest_arousal_reached INTEGER DEFAULT 0 CHECK (highest_arousal_reached IS NULL OR highest_arousal_reached BETWEEN 0 AND 10),
    accidentally_finished BOOLEAN DEFAULT false,
    ended_early BOOLEAN DEFAULT false,
    self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),
    breathing_maintained TEXT CHECK (breathing_maintained IN ('yes', 'mostly', 'no')),
    imagery_rating INTEGER CHECK (imagery_rating BETWEEN 1 AND 5),
    positions_used TEXT[],
    notes TEXT,
    lube_used BOOLEAN,
    toy_used BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.program_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 8),
    sessions_in_current_phase INTEGER DEFAULT 0 CHECK (sessions_in_current_phase >= 0),
    qualifying_sessions_in_phase INTEGER DEFAULT 0 CHECK (qualifying_sessions_in_phase >= 0),
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    sessions_since_ejaculation INTEGER DEFAULT 0 CHECK (sessions_since_ejaculation >= 0),
    last_ejaculation_session INTEGER CHECK (last_ejaculation_session IS NULL OR last_ejaculation_session >= 0),
    last_session_at TIMESTAMPTZ,
    phase_started_at TIMESTAMPTZ DEFAULT NOW(),
    program_started_at TIMESTAMPTZ DEFAULT NOW(),
    phase_8_entered_at TIMESTAMPTZ,
    daily_squat_streak INTEGER DEFAULT 0 CHECK (daily_squat_streak >= 0),
    last_squat_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own program sessions" ON public.program_sessions;
CREATE POLICY "Users can manage their own program sessions"
    ON public.program_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own program progress" ON public.program_progress;
CREATE POLICY "Users can manage their own program progress"
    ON public.program_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_program_sessions_user_started_at
    ON public.program_sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_sessions_user_phase_created_at
    ON public.program_sessions(user_id, phase, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_progress_user_id
    ON public.program_progress(user_id);

CREATE OR REPLACE FUNCTION public.set_program_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_program_progress_updated_at ON public.program_progress;
CREATE TRIGGER trg_program_progress_updated_at
  BEFORE UPDATE ON public.program_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_program_progress_updated_at();

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

-- =====================================================
-- GUIDED PROGRAM V2 (mirrors 20260920000000_program_v2.sql)
-- =====================================================

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

-- =====================================================
-- INTEGRITY CONSTRAINTS (mirrors 20260407045713_repair_integrity_tables.sql)
-- =====================================================

-- Integrity constraints that the hosted project's own history added.
--
-- Reconstructed from the live database so a database rebuilt from this migration
-- set enforces the same invariants the hosted project does. The original file for
-- this version is not in the repository; only the constraints it installed are
-- reproduced here, and each one is guarded so the migration is safe on a database
-- that already has it.
--
-- Note: a share may never expire before it was created. Fixtures that need an
-- already-expired share must therefore backdate `created_at` as well.

ALTER TABLE public.shared_sessions
    DROP CONSTRAINT IF EXISTS check_shared_sessions_expiry_after_creation;
ALTER TABLE public.shared_sessions
    ADD CONSTRAINT check_shared_sessions_expiry_after_creation
    CHECK (expires_at IS NULL OR created_at IS NULL OR expires_at >= created_at);

-- The hosted `sessions` table carries a `scopes` column that the checked-in schema
-- does not define, so this constraint is only applied where that column exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sessions'
          AND column_name = 'scopes'
    ) THEN
        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_scopes_length;
        ALTER TABLE public.sessions
            ADD CONSTRAINT sessions_scopes_length CHECK (char_length(scopes) <= 4096);
    END IF;
END $$;

-- =====================================================
-- PRIVATE TABLE ACCESS HARDENING (mirrors 20260921060000_harden_private_table_access.sql)
-- =====================================================

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
