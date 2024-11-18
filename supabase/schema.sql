create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  total_duration integer,
  active_duration integer,
  edge_duration integer,
  finished_during_edge boolean default false,
  created_at timestamp with time zone default now()
);

create table public.edge_events (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration integer
);

-- Enable RLS
alter table public.sessions enable row level security;
alter table public.edge_events enable row level security; 