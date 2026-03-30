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
CREATE POLICY "Public can view non-expired shared links"
    ON public.shared_sessions
    FOR SELECT
    USING ((expires_at IS NULL) OR (expires_at > now())); -- Public access based on expiry

DROP POLICY IF EXISTS "Only authenticated users can create shared sessions" ON public.shared_sessions;
CREATE POLICY "Authenticated users can create shared sessions"
    ON public.shared_sessions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

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
