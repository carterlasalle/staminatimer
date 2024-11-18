-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for all users" ON public.sessions
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON public.edge_events
    FOR ALL USING (true); 