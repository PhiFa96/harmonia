begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(34);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'pgtap-a@example.invalid',
    '{"id":"22222222-2222-4222-8222-222222222222","role":"service_role","display_name":"Forged","locale":"en-GB"}'),
  ('22222222-2222-4222-8222-222222222222', 'pgtap-b@example.invalid', '{}');

select is((select count(*)::integer from profiles where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')), 2, 'Signup creates exactly one profile per account');
select is((select locale from profiles where id = '11111111-1111-4111-8111-111111111111'), 'de', 'Locale defaults to de');
select ok((select display_name is null from profiles where id = '11111111-1111-4111-8111-111111111111'), 'User metadata cannot initialize profile fields');
select ok((select created_at is not null and updated_at is not null from profiles where id = '11111111-1111-4111-8111-111111111111'), 'Audit fields are initialized');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS is enabled');

set local role anon;
select throws_ok('select * from profiles', '42501', null, 'Anonymous requests cannot read profiles');
select throws_ok($$update profiles set display_name = 'Anon'$$, '42501', null, 'Anonymous requests cannot update profiles');
select throws_ok($$insert into profiles (id) values ('33333333-3333-4333-8333-333333333333')$$, '42501', null, 'Anonymous requests cannot create profiles');
select throws_ok('delete from profiles', '42501', null, 'Anonymous requests cannot delete profiles');

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';
select is((select count(*)::integer from profiles), 0, 'Authenticated role without a user ID sees nothing');

set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select results_eq('select id from profiles', array['11111111-1111-4111-8111-111111111111'::uuid], 'A sees only their profile despite forged metadata');
select is((select count(*)::integer from profiles where id = '22222222-2222-4222-8222-222222222222'), 0, 'A cannot read B');
select results_eq($$with changed as (update profiles set display_name = 'Hijacked' where id = '22222222-2222-4222-8222-222222222222' returning id) select count(*)::integer from changed$$, array[0], 'A cannot update B');
select lives_ok($$update profiles set display_name = 'Alice', locale = 'en-US' where id = '11111111-1111-4111-8111-111111111111'$$, 'A can update their editable fields');
select is((select display_name from profiles), 'Alice', 'Own name update is persisted');
select is((select locale from profiles), 'en-US', 'Own locale update is persisted');
select ok((select updated_at > created_at from profiles), 'The server advances the update timestamp');
select throws_ok($$update profiles set id = '33333333-3333-4333-8333-333333333333'$$, '42501', null, 'Clients cannot change profile identity');
select throws_ok($$update profiles set created_at = '2000-01-01'$$, '42501', null, 'Clients cannot forge creation timestamps');
select throws_ok($$update profiles set updated_at = '2000-01-01'$$, '42501', null, 'Clients cannot forge update timestamps');
select throws_ok($$insert into profiles (id) values ('33333333-3333-4333-8333-333333333333')$$, '42501', null, 'Clients cannot insert profiles');
select throws_ok('delete from profiles', '42501', null, 'Clients cannot delete profiles directly');
select throws_ok($$update profiles set display_name = '   '$$, '23514', null, 'Blank names are rejected');
select throws_ok($$update profiles set display_name = repeat('x', 61)$$, '23514', null, 'Names longer than 60 characters are rejected');
select throws_ok($$update profiles set locale = 'fr'$$, '23514', null, 'Unsupported locales are rejected');
select throws_ok('select private.create_profile_for_user()', '42501', null, 'Clients cannot invoke the privileged signup function');

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select results_eq('select id from profiles', array['22222222-2222-4222-8222-222222222222'::uuid], 'B sees only their profile');
select is((select count(*)::integer from profiles where id = '11111111-1111-4111-8111-111111111111'), 0, 'B cannot read A');
select results_eq($$with changed as (update profiles set locale = 'en-GB' where id = '11111111-1111-4111-8111-111111111111' returning id) select count(*)::integer from changed$$, array[0], 'B cannot update A');
select lives_ok($$update profiles set display_name = 'Bob', locale = 'en-GB'$$, 'B can update their own profile');

set local role service_role;
select is((select count(*)::integer from profiles where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')), 2, 'The trusted backend can read both profiles');

reset role;
select is((select display_name from profiles where id = '11111111-1111-4111-8111-111111111111'), 'Alice', 'Foreign updates left A unchanged');
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is((select count(*)::integer from profiles where id = '11111111-1111-4111-8111-111111111111'), 0, 'Account deletion cascades to its profile');
select is((select count(*)::integer from profiles where id = '22222222-2222-4222-8222-222222222222'), 1, 'Deleting A preserves B');

select * from finish();
rollback;
