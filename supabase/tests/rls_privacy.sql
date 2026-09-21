begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'privacy-user-1@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'privacy-user-2@example.test')
on conflict (id) do nothing;

insert into public.achievements (id, name, description, category, condition_type, condition_value, condition_comparison, points, icon)
values ('33333333-3333-3333-3333-333333333333', 'Privacy fixture', 'RLS test fixture', 'special', 'duration', 1, 'greater', 1, 'Trophy')
on conflict (id) do nothing;

-- An already-expired share must also have been created before it expired: the
-- `check_shared_sessions_expiry_after_creation` constraint forbids the reverse.
insert into public.shared_sessions (id, created_by, sessions_data, created_at, expires_at)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '[{"safe":"active"}]'::jsonb, now() - interval '1 hour', now() + interval '1 hour'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '[{"safe":"expired"}]'::jsonb, now() - interval '2 hours', now() - interval '1 hour');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.sessions (id, user_id, start_time, total_duration, active_duration, edge_duration)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', now(), 1000, 1000, 0);

select is((select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 1, 'owner can read their private session');
select lives_ok($$update public.sessions set active_duration = 900, total_duration = 900 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'owner can update their private session');
select throws_ok($$insert into public.sessions (user_id, start_time, total_duration, active_duration, edge_duration) values ('22222222-2222-2222-2222-222222222222', now(), 0, 0, 0)$$, 'new row violates row-level security policy for table "sessions"', 'user cannot create a session owned by another account');
select lives_ok($$insert into public.edge_events (id, session_id, start_time) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now())$$, 'owner can create an edge event for their session');
select lives_ok($$insert into public.user_achievements (id, user_id, achievement_id, progress) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 10)$$, 'owner can create achievement progress');
select lives_ok($$insert into public.program_sessions (id, user_id, phase) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 1)$$, 'owner can create a program session');
select lives_ok($$insert into public.program_progress (id, user_id) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111')$$, 'owner can create program progress');
select is((select count(*)::integer from public.shared_sessions where created_by = '11111111-1111-1111-1111-111111111111'), 2, 'creator can list only their own shared-session rows');

-- ---------------------------------------------------------------------------
-- Guided Program V2: owner writes go through the RPC, reads are RLS-scoped
-- ---------------------------------------------------------------------------

select lives_ok($$select public.initialize_program_v2('under_2')$$, 'owner can initialize v2 progress through the rpc');
select lives_ok(
  $$select public.record_program_v2_session('{"session_type":"control","scheduled_local_date":"2026-01-05","started_at":"2026-01-05T10:00:00Z","completed_at":"2026-01-05T10:20:00Z","longest_continuous_block_ms":130000,"completed_protocol":true,"rescue_stop_count":1}'::jsonb)$$,
  'owner can record a v2 session through the rpc'
);
select is((select count(*)::integer from public.program_v2_progress where user_id = '11111111-1111-1111-1111-111111111111'), 1, 'owner can read their v2 progress');
select is((select count(*)::integer from public.program_v2_sessions where user_id = '11111111-1111-1111-1111-111111111111'), 1, 'owner can read their v2 sessions');
select is((select count(*)::integer from public.program_v2_rescue_events where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'owner can read their v2 rescue events');
select throws_ok(
  $$insert into public.program_v2_sessions (user_id, session_type, scheduled_local_date, started_at) values ('11111111-1111-1111-1111-111111111111', 'control', '2026-01-06', now())$$,
  'permission denied for table program_v2_sessions',
  'clients cannot insert v2 sessions directly'
);
select throws_ok(
  $$update public.program_v2_progress set current_target_ms = 600000 where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'permission denied for table program_v2_progress',
  'clients cannot advance their v2 target directly'
);
select is((select total_sessions from public.program_progress where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 0, 'v1 progress rows are preserved and untouched by v2 writes');
select is((select count(*)::integer from public.program_sessions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 1, 'v1 program session rows are preserved by the v2 migration');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0, 'second user cannot read first user session');
select is((select count(*)::integer from public.edge_events where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 0, 'second user cannot read first user edge events');
select is((select count(*)::integer from public.user_achievements where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0, 'second user cannot read first user achievement progress');
select is((select count(*)::integer from public.program_sessions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 0, 'second user cannot read first user program sessions');
select is((select count(*)::integer from public.program_progress where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 0, 'second user cannot read first user program progress');
select is((select count(*)::integer from public.program_v2_progress where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'second user cannot read first user v2 progress');
select is((select count(*)::integer from public.program_v2_sessions where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'second user cannot read first user v2 sessions');
select is((select count(*)::integer from public.program_v2_rescue_events where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'second user cannot read first user v2 rescue events');
select is((select count(*)::integer from public.shared_sessions where created_by = '11111111-1111-1111-1111-111111111111'), 0, 'second user cannot enumerate first user shared-session rows');
select lives_ok($$update public.sessions set active_duration = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'cross-account update is filtered by RLS rather than leaking row existence');

reset role;
select is((select active_duration from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 900, 'cross-account update did not modify the owner row');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select * from public.shared_sessions$$, 'permission denied for table shared_sessions', 'anonymous user cannot enumerate shared-session rows');
select throws_ok($$select * from public.program_v2_sessions$$, 'permission denied for table program_v2_sessions', 'anonymous user cannot read v2 sessions');
select throws_ok($$select * from public.program_v2_progress$$, 'permission denied for table program_v2_progress', 'anonymous user cannot read v2 progress');
select is(public.get_shared_session('44444444-4444-4444-4444-444444444444'::uuid), '[{"safe":"active"}]'::jsonb, 'anonymous lookup returns only the requested active share payload');
select is(public.get_shared_session('55555555-5555-5555-5555-555555555555'::uuid), null::jsonb, 'anonymous lookup returns no payload for an expired share');

select * from finish();
rollback;
