-- Baseline schema required to rebuild StaminaTimer from migration history alone.
-- This captures the core tables that pre-dated the first checked-in migration.

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

CREATE TABLE IF NOT EXISTS public.edge_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    CONSTRAINT fk_session FOREIGN KEY(session_id)
        REFERENCES public.sessions(id) ON DELETE CASCADE
);
ALTER TABLE public.edge_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    condition_comparison TEXT,
    points INTEGER DEFAULT 0,
    icon TEXT
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    UNIQUE (user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sessions_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.global_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    active_users_count INTEGER DEFAULT 0,
    total_sessions_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
    ON public.sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own edge events"
    ON public.edge_events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = edge_events.session_id
          AND sessions.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = edge_events.session_id
          AND sessions.user_id = auth.uid()
    ));

CREATE POLICY "Anyone can view achievements"
    ON public.achievements FOR SELECT
    USING (true);

CREATE POLICY "Users can insert/update their own achievement progress"
    ON public.user_achievements FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view own shared sessions"
    ON public.shared_sessions FOR SELECT TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create shared sessions"
    ON public.shared_sessions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view global stats"
    ON public.global_stats FOR SELECT
    USING (true);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at
    ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created
    ON public.sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_total_duration
    ON public.sessions(total_duration DESC);
CREATE INDEX IF NOT EXISTS idx_edge_events_session_id
    ON public.edge_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
    ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id
    ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_expires_at
    ON public.shared_sessions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_sessions_created_by
    ON public.shared_sessions(created_by) WHERE created_by IS NOT NULL;

ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_total_duration
    CHECK (total_duration IS NULL OR (total_duration >= 0 AND total_duration <= 86400000));
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_active_duration
    CHECK (active_duration IS NULL OR (active_duration >= 0 AND active_duration <= 86400000));
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_edge_duration
    CHECK (edge_duration IS NULL OR (edge_duration >= 0 AND edge_duration <= 86400000));
ALTER TABLE public.sessions
    ADD CONSTRAINT check_session_duration_consistency
    CHECK (
        total_duration IS NULL OR active_duration IS NULL OR edge_duration IS NULL OR
        ABS(total_duration - (active_duration + edge_duration)) <= 1000
    );
ALTER TABLE public.edge_events
    ADD CONSTRAINT check_edge_event_duration
    CHECK (duration IS NULL OR (duration >= 0 AND duration <= 86400000));
ALTER TABLE public.user_achievements
    ADD CONSTRAINT check_achievement_progress
    CHECK (progress >= 0 AND progress <= 100);

CREATE OR REPLACE FUNCTION public.increment_global_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats_id UUID;
BEGIN
    SELECT id INTO v_stats_id FROM public.global_stats LIMIT 1;
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

CREATE OR REPLACE FUNCTION public.update_active_users_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats_id UUID;
    v_active_users_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO v_active_users_count
    FROM public.sessions
    WHERE created_at > NOW() - INTERVAL '30 days';

    SELECT id INTO v_stats_id FROM public.global_stats LIMIT 1;
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

CREATE TRIGGER on_session_created
    AFTER INSERT ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.increment_global_sessions();

CREATE TRIGGER on_session_update_active_users
    AFTER INSERT ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_active_users_count();
