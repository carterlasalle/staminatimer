-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table with user_id
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    total_duration INTEGER,
    active_duration INTEGER,
    edge_duration INTEGER,
    finished_during_edge BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create edge_events table with proper foreign key
CREATE TABLE IF NOT EXISTS public.edge_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    CONSTRAINT fk_session
        FOREIGN KEY(session_id)
        REFERENCES public.sessions(id)
        ON DELETE CASCADE
);

-- Add user_id column to existing sessions table
ALTER TABLE public.sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set default user_id for existing records (replace 'default-user-id' with an actual user ID)
-- You might want to handle this differently depending on your data
UPDATE public.sessions 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting defaults
ALTER TABLE public.sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_events ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Users can only see their own sessions" ON public.sessions;
CREATE POLICY "Users can only see their own sessions"
    ON public.sessions
    FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own edge events through sessions" ON public.edge_events;
CREATE POLICY "Users can only see their own edge events through sessions"
    ON public.edge_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.sessions
            WHERE sessions.id = edge_events.session_id
            AND sessions.user_id = auth.uid()
        )
    ); 