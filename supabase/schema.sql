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

-- Policy for updating global stats (Restrict as needed, e.g., to a specific role or function)
DROP POLICY IF EXISTS "update_global_stats_policy" ON public.global_stats;
CREATE POLICY "Authenticated users can update global stats" -- Example: Allow any auth user
    ON public.global_stats
    FOR UPDATE
    USING (auth.role() = 'authenticated') -- Or check for a specific admin role if needed
    WITH CHECK (auth.role() = 'authenticated');

-- Rate Limits (if using)
-- DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.rate_limits;
-- CREATE POLICY "Enable read for authenticated users" ON public.rate_limits FOR SELECT USING (auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rate_limits;
-- CREATE POLICY "Enable insert for authenticated users" ON public.rate_limits FOR INSERT WITH CHECK (auth.role() = 'authenticated');