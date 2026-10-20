begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
-- Fachprüfung P3.04 Befund 6: der reine Leseweg nimmt keine globale Ligasperre,
-- der Abschluss einer alten Gruppe aber weiterhin.
insert into auth.users(id,email) values
 ('a3040000-0000-4000-8000-000000000001','league-lock-a@example.invalid'),
 ('a3040000-0000-4000-8000-000000000002','league-lock-b@example.invalid');
-- Fixture ohne credit_league, damit die Sperre nicht schon durch den Aufbau gehalten wird.
insert into league_cohorts(id,week_start,tier,capacity,movement) values
 ('c3040000-0000-4000-8000-000000000001',league_week(clock_timestamp()),0,30,5),
 ('c3040000-0000-4000-8000-000000000002',league_week(clock_timestamp())-14,0,30,5);
insert into league_accounts(user_id) values ('a3040000-0000-4000-8000-000000000001'),('a3040000-0000-4000-8000-000000000002');
insert into league_members(user_id,week_start,cohort_id,slot,xp,joined_at) values
 ('a3040000-0000-4000-8000-000000000001',league_week(clock_timestamp()),'c3040000-0000-4000-8000-000000000001',1,20,now());
select is((select count(*)::integer from pg_locks where locktype='advisory' and classid=304 and objid=1 and pid=pg_backend_pid()),0,'Fixture holds no league lock');
select set_config('request.jwt.claims',jsonb_build_object('sub','a3040000-0000-4000-8000-000000000001','role','authenticated')::text,true);
select is((learner_league()->'cohort'->'entries'->0->>'xp')::integer,20,'Reading returns the live roster');
select is((select count(*)::integer from pg_locks where locktype='advisory' and classid=304 and objid=1 and pid=pg_backend_pid()),0,'Reading takes no global league lock');
insert into league_members(user_id,week_start,cohort_id,slot,xp,joined_at) values
 ('a3040000-0000-4000-8000-000000000002',league_week(clock_timestamp())-14,'c3040000-0000-4000-8000-000000000002',1,5,now()-interval '15 days');
select set_config('request.jwt.claims',jsonb_build_object('sub','a3040000-0000-4000-8000-000000000002','role','authenticated')::text,true);
select is((learner_league()->'result'->>'outcome'),'stayed','A pending old group is still closed on read');
select is((select count(*)::integer from pg_locks where locktype='advisory' and classid=304 and objid=1 and pid=pg_backend_pid()),1,'Closing an old group still serialises on the league lock');
select * from finish();
rollback;
