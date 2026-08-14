begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'privacy-user-1@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'privacy-user-2@example.test')
on conflict (id) do nothing;

insert into public.achievements (id, name, description, category, condition_type, condition_value, points)
values ('33333333-3333-3333-3333-333333333333', 'Privacy fixture', 'RLS test fixture', 'special', 'duration', 1, 1)
on conflict (id) do nothing;

insert into public.shared_sessions (id, created_by, sessions_data, expires_at)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '[{"safe":"active"}]'::jsonb, now() + interval '1 hour'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '[{"safe":"expired"}]'::jsonb, now() - interval '1 hour');

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

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0, 'second user cannot read first user session');
select is((select count(*)::integer from public.edge_events where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 0, 'second user cannot read first user edge events');
select is((select count(*)::integer from public.user_achievements where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0, 'second user cannot read first user achievement progress');
select is((select count(*)::integer from public.program_sessions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 0, 'second user cannot read first user program sessions');
select is((select count(*)::integer from public.program_progress where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 0, 'second user cannot read first user program progress');
select is((select count(*)::integer from public.shared_sessions where created_by = '11111111-1111-1111-1111-111111111111'), 0, 'second user cannot enumerate first user shared-session rows');
select lives_ok($$update public.sessions set active_duration = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'cross-account update is filtered by RLS rather than leaking row existence');

reset role;
select is((select active_duration from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 900, 'cross-account update did not modify the owner row');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select * from public.shared_sessions$$, 'permission denied for table shared_sessions', 'anonymous user cannot enumerate shared-session rows');
select is(public.get_shared_session('44444444-4444-4444-4444-444444444444'::uuid), '[{"safe":"active"}]'::jsonb, 'anonymous lookup returns only the requested active share payload');
select is(public.get_shared_session('55555555-5555-5555-5555-555555555555'::uuid), null::jsonb, 'anonymous lookup returns no payload for an expired share');

select * from finish();
rollback;
