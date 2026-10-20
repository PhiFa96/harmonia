begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values('a3050000-0000-4000-8000-000000000001','rush-sql@example.invalid');
select is(rush_status('a3050000-0000-4000-8000-000000000001')->>'remaining','1','One free start');
select is(start_rush('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001','survival',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','c3050000-0000-4000-8000-000000000001')->>'state','active','Trusted server run');
select is(rush_status('a3050000-0000-4000-8000-000000000001')->>'remaining','0','Quota spent atomically');
select ok((select deadline is null from rush_runs where id='b3050000-0000-4000-8000-000000000001'),'Survival without timer');
select is(start_rush('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001','survival',repeat('b',64),'[{"different":true}]',gen_random_uuid())->>'bank',repeat('a',64),'Retry preserves original frozen bank');
select throws_ok($$select start_rush('a3050000-0000-4000-8000-000000000001',gen_random_uuid(),'three',repeat('a',64),'[{}]',gen_random_uuid())$$,'P0001','rush_active','One active run across devices');
select is(finish_rush('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001')->>'state','active','No premature reward');
-- Only trusted engine calls can reach the following replay fixtures.
do $$ begin
 for i in 0..34 loop
  update rush_runs set last_at=clock_timestamp()-interval '1 second' where id='b3050000-0000-4000-8000-000000000001';
  perform apply_rush_answer('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001',i,'C',true,10);
 end loop;
 for i in 35..37 loop
  update rush_runs set last_at=clock_timestamp()-interval '1 second' where id='b3050000-0000-4000-8000-000000000001';
  perform apply_rush_answer('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001',i,'D',false,0);
 end loop;
end $$;
select is((select state from rush_runs where id='b3050000-0000-4000-8000-000000000001'),'finished','Third mistake ends survival');
select is((select xp from rush_runs where id='b3050000-0000-4000-8000-000000000001'),30,'XP capped at 30');
select is((select score from rush_runs where id='b3050000-0000-4000-8000-000000000001'),350,'Verified points accumulate');
select is((select count(*)::int from xp_ledger where user_id='a3050000-0000-4000-8000-000000000001'),1,'One canonical ledger receipt');
select ok((select source_kind='rush' and learning_client_id is null and lesson_id is null and not qualified and coins=0 from xp_ledger where user_id='a3050000-0000-4000-8000-000000000001'),'Rush source explicit, no invented lesson or streak');
select is(finish_rush('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001')->>'xp','30','Retry XP stable');
select is((select count(*)::int from xp_ledger where user_id='a3050000-0000-4000-8000-000000000001'),1,'Retry never duplicates ledger');
select is((select xp from league_members where user_id='a3050000-0000-4000-8000-000000000001'),30::bigint,'League uses same canonical receipt');
select throws_ok($$select start_rush('a3050000-0000-4000-8000-000000000001',gen_random_uuid(),'three',repeat('a',64),'[{}]',gen_random_uuid())$$,'P0001','rush_limit','Free quota not refunded');
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','all',repeat('a',64))->'entries'->0->>'score','350','All-time best updated');
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','three','all',repeat('a',64))->'entries','[]'::jsonb,'Modes isolated');
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','all',repeat('b',64))->'entries','[]'::jsonb,'Bank versions isolated');
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','friends',repeat('a',64))->>'available','true','Friend scope supports an own best before first friendship');
set local role anon;
select throws_ok('select * from rush_runs','42501',null,'Guests cannot enumerate runs');
select throws_ok('select * from rush_steps','42501',null,'Guests cannot enumerate answers');
reset role;
set local role authenticated;
select throws_ok('select * from rush_runs','42501',null,'Accounts cannot enumerate runs');
select throws_ok($$select rush_status('a3050000-0000-4000-8000-000000000001')$$,'42501',null,'Trusted status only through JWT Edge');
select throws_ok($$select apply_rush_answer('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001',38,'C',true,50)$$,'42501',null,'Cannot forge engine results');
select throws_ok($$select finish_rush('a3050000-0000-4000-8000-000000000001','b3050000-0000-4000-8000-000000000001')$$,'42501',null,'Cannot mint XP');
select throws_ok('select close_expired_rush()','42501',null,'No client scheduler');
reset role;
-- UTC windows, own rows only. Ranking does not expose global account identities.
update rush_runs set finished_at=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'-interval '1 second' where id='b3050000-0000-4000-8000-000000000001';
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','week',repeat('a',64))->'entries','[]'::jsonb,'Prior-week result excluded');
select is(jsonb_array_length(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','all',repeat('a',64))->'entries'),1,'Prior-week best retained all time');
select is(rush_leaderboard('a3050000-0000-4000-8000-000000000001','survival','day',repeat('a',64))->'entries','[]'::jsonb,'Prior-day result excluded');
delete from auth.users where id='a3050000-0000-4000-8000-000000000001';
select is((select count(*)::int from rush_runs where user_id='a3050000-0000-4000-8000-000000000001'),0,'Erasure cascades runs');
select is((select count(*)::int from rush_steps where user_id='a3050000-0000-4000-8000-000000000001'),0,'Erasure cascades answers');
select * from finish();
rollback;
