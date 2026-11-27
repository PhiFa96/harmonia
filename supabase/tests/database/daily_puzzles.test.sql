begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
set local time zone 'UTC';
select no_plan();
insert into auth.users(id,email) values('a3070000-0000-4000-8000-000000000001','puzzle-a@example.invalid');
select is(puzzle_fill(jsonb_build_array(jsonb_build_object('day',current_date,'bank',repeat('a',64),
 'spec','{"type":"NOTE_NAME","params":{}}'::jsonb,'seed','fixed-seed','difficulty',1))),1,'Day is materialized');
select is(puzzle_fill(jsonb_build_array(jsonb_build_object('day',current_date,'bank',repeat('b',64),
 'spec','{"type":"NOTE_NAME","params":{}}'::jsonb,'seed','changed','difficulty',2))),0,'Existing day stays frozen');
select is((select bank from daily_puzzles where day=current_date),repeat('a',64),'New bank hash cannot replace the frozen day');
select is(puzzle_status('a3070000-0000-4000-8000-000000000001',current_date)->'puzzle'->>'seed','fixed-seed','All users see the frozen seed');
select is((puzzle_answer('a3070000-0000-4000-8000-000000000001',current_date,'UTC','C',true)->>'streak')::integer,1,'Correct answer starts own streak');
select is((puzzle_answer('a3070000-0000-4000-8000-000000000001',current_date,'UTC','C',true)->'result'->>'answer'),'C','Identical retry is idempotent');
select throws_ok($$select puzzle_answer('a3070000-0000-4000-8000-000000000001',current_date,'UTC','D',false)$$,'P0001','puzzle_conflict','Second guess is rejected');
select throws_ok($$select puzzle_answer('a3070000-0000-4000-8000-000000000001',current_date+1,'UTC','C',true)$$,'P0001','puzzle_day','Tomorrow cannot be answered early');
insert into daily_puzzles(day,bank,spec,seed,difficulty) values(current_date-1,repeat('a',64),'{"type":"NOTE_NAME","params":{}}','yesterday',1);
insert into daily_puzzle_results(user_id,day,answer,correct,time_zone) values('a3070000-0000-4000-8000-000000000001',current_date-1,'C',true,'UTC');
select is(puzzle_streak('a3070000-0000-4000-8000-000000000001',current_date),2,'Adjacent solved days count');
update daily_puzzle_results set answered_at=now()-interval '13 months' where day=current_date-1;
select is((retain_daily_puzzles()->>'changed')::integer,1,'Old raw answers are removed');
select is((select answer is null and time_zone is null and answered_at is null and correct
 from daily_puzzle_results where day=current_date-1),true,'Streak proof survives raw-data retention');
insert into auth.users(id,email) values('a3070000-0000-4000-8000-000000000002','puzzle-travel@example.invalid');
insert into daily_puzzles(day,bank,spec,seed,difficulty)
 select (clock_timestamp() at time zone 'Pacific/Kiritimati')::date,repeat('a',64),'{"type":"NOTE_NAME","params":{}}','travel',1
 on conflict (day) do nothing;
select is((puzzle_answer('a3070000-0000-4000-8000-000000000002',(clock_timestamp() at time zone 'Pacific/Kiritimati')::date,'Pacific/Kiritimati','C',true)->>'streak')::integer,1,'First answer sets the puzzle zone');
select is(puzzle_request_zone('a3070000-0000-4000-8000-000000000002','Etc/GMT+12'),false,'An immediate switch is denied');
select throws_ok($$select puzzle_answer('a3070000-0000-4000-8000-000000000002',(clock_timestamp() at time zone 'Etc/GMT+12')::date,'Etc/GMT+12','C',true)$$,'P0001','puzzle_zone','An immediate switch adds no answer');
select is(puzzle_streak('a3070000-0000-4000-8000-000000000002',(clock_timestamp() at time zone 'Pacific/Kiritimati')::date),1,'The original streak remains');
update daily_puzzle_zones set changed_at=clock_timestamp()-interval '20 hours 1 minute' where user_id='a3070000-0000-4000-8000-000000000002';
select is(puzzle_request_zone('a3070000-0000-4000-8000-000000000002','Etc/GMT+12'),true,'A change can be requested after the waiting period');
insert into daily_puzzles(day,bank,spec,seed,difficulty)
 select (clock_timestamp() at time zone 'Etc/GMT+12')::date,repeat('a',64),'{"type":"NOTE_NAME","params":{}}','travel-return',1
 on conflict (day) do nothing;
select lives_ok($$select puzzle_answer('a3070000-0000-4000-8000-000000000002',(clock_timestamp() at time zone 'Etc/GMT+12')::date,'Etc/GMT+12','C',true)$$,'An answer can adopt a new zone after the waiting period');
select is((select time_zone from daily_puzzle_zones where user_id='a3070000-0000-4000-8000-000000000002'),'Etc/GMT+12','The accepted answer stores the new zone');
delete from auth.users where id='a3070000-0000-4000-8000-000000000002';
select is((select count(*)::integer from daily_puzzle_zones where user_id='a3070000-0000-4000-8000-000000000002'),0,'Account deletion removes the stored zone');

set local role anon;
select throws_ok('select * from daily_puzzles','42501',null,'Guest cannot enumerate future puzzles');
reset role;
set local role authenticated;
select throws_ok($$select puzzle_answer('a3070000-0000-4000-8000-000000000001',current_date,'UTC','C',true)$$,'42501',null,'Client cannot forge a result');
select throws_ok('select * from daily_puzzle_results','42501',null,'Client cannot enumerate results');
reset role;
select * from finish();
rollback;
