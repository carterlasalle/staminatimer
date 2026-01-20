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
BEGIN
    UPDATE public.global_stats
    SET total_sessions_count = total_sessions_count + 1,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.global_stats LIMIT 1);
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
BEGIN
    UPDATE public.global_stats
    SET active_users_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM public.sessions
        WHERE created_at > NOW() - INTERVAL '30 days'
    ),
    last_updated = NOW()
    WHERE id = (SELECT id FROM public.global_stats LIMIT 1);
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