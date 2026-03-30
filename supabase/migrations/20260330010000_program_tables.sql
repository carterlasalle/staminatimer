-- Program tables for guided training protocol

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
