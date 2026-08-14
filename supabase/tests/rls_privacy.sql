begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'privacy-user-1@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'privacy-user-2@example.test')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.sessions (
  id, user_id, start_time, total_duration, active_duration, edge_duration
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  now(),
  1000,
  1000,
  0
);

select is(
  (select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'owner can read their private session'
);

select lives_ok(
  $$update public.sessions set active_duration = 900, total_duration = 900 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'owner can update their private session'
);

select throws_ok(
  $$insert into public.sessions (user_id, start_time, total_duration, active_duration, edge_duration)
    values ('22222222-2222-2222-2222-222222222222', now(), 0, 0, 0)$$,
  'new row violates row-level security policy for table "sessions"',
  'user cannot create a session owned by another account'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is(
  (select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'second user cannot read first user session'
);

select lives_ok(
  $$update public.sessions set active_duration = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'cross-account update is filtered by RLS rather than leaking row existence'
);

reset role;
select is(
  (select active_duration from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  900,
  'cross-account update did not modify the owner row'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*)::integer from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'anonymous user cannot enumerate private sessions'
);

select is(
  (select count(*)::integer from public.shared_sessions),
  0,
  'anonymous user cannot enumerate shared-session rows'
);

select ok(
  has_function_privilege('anon', 'public.get_shared_session(uuid)', 'EXECUTE'),
  'anonymous sharing is exposed only through the narrow lookup function'
);

select * from finish();
rollback;
