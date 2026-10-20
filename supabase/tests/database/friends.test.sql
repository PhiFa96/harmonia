begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
set local time zone 'UTC';
select no_plan();
insert into auth.users(id,email) values
 ('a3080000-0000-4000-8000-000000000001','friend-a@example.invalid'),
 ('a3080000-0000-4000-8000-000000000002','friend-b@example.invalid'),
 ('a3080000-0000-4000-8000-000000000003','friend-c@example.invalid');
create temp table invite_token(k text primary key,token uuid not null);
insert into invite_token select 'first',(friend_invite_create('a3080000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000')->'invite'->>'token')::uuid;
select isnt((select token from invite_token where k='first'),'00000000-0000-0000-0000-000000000000'::uuid,'Server ignores a client-chosen code');
select is((select substring(token::text from 15 for 1) from invite_token where k='first'),'4','Server generates a random version 4 code');
select is((select count(*)::integer from friend_invites where host_id='a3080000-0000-4000-8000-000000000001'),1,'Host holds exactly one open invitation');
select is(friend_invite_accept('a3080000-0000-4000-8000-000000000002',(select token from invite_token where k='first'))->'friends'->0->>'id','a3080000-0000-4000-8000-000000000001','Guest sees accepted host');
select is(friend_pair_active('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002'),true,'Acceptance is reciprocal');
select is((friend_invite_accept('a3080000-0000-4000-8000-000000000002',(select token from invite_token where k='first'))->'friends')::text,(friend_status('a3080000-0000-4000-8000-000000000002')->'friends')::text,'Same guest retry is idempotent');
select throws_ok($$select friend_invite_accept('a3080000-0000-4000-8000-000000000003',(select token from invite_token where k='first'))$$,'P0001','friend_missing','Code is single-use');
select is((friend_status('a3080000-0000-4000-8000-000000000001')::text like '%@example%'),false,'No email is returned');
select is((friend_quest_start('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002')->'quest'->>'target')::integer,300,'Paired quest has fixed target');
select is((friend_status('a3080000-0000-4000-8000-000000000001')->>'questUsed')::boolean,true,'Week is claimed by both friends');
select is((select count(*)::integer from friend_quests),1,'Quest exists once');
select is((friend_quest_start('a3080000-0000-4000-8000-000000000002','a3080000-0000-4000-8000-000000000001')->'quest'->>'target')::integer,300,'Reverse retry returns same quest');
insert into rush_runs(id,user_id,mode,bank,policy,state,started_at,deadline,last_at,finished_at)
 select gen_random_uuid(),'a3080000-0000-4000-8000-000000000001','three',repeat('a',64),'{}'::jsonb,'finished',now()-interval '1 minute',now()-interval '30 seconds',now()-interval '40 seconds',now()-interval '30 seconds' from generate_series(1,10);
insert into xp_ledger(user_id,client_id,content_version,amount,local_date,source_kind,rush_run_id)
 select user_id,'rush:'||id::text,1,30,current_date,'rush',id from rush_runs
 where user_id='a3080000-0000-4000-8000-000000000001' order by id limit 9;
select is((friend_status('a3080000-0000-4000-8000-000000000001')->'quest'->>'completed')::boolean,false,'270 XP do not complete quest');
insert into xp_ledger(user_id,client_id,content_version,amount,local_date,source_kind,rush_run_id)
 select user_id,'rush:'||id::text,1,30,current_date,'rush',id from rush_runs r
 where user_id='a3080000-0000-4000-8000-000000000001' and not exists(select 1 from xp_ledger x where x.rush_run_id=r.id);
select is((select count(*)::integer from friend_quest_awards),2,'Canonical XP atomically awards both badges');
select is((friend_status('a3080000-0000-4000-8000-000000000001')->'quest'->>'completed')::boolean,true,'Quest is complete for both');
select is((select count(*)::integer from xp_ledger where user_id='a3080000-0000-4000-8000-000000000002'),0,'Quest does not mint bonus XP');
select is((friend_remove('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002',true)->'friends')::text,'[]','Block hides former friend');
select is((friend_remove('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002',false)->'blocked')::text,'["a3080000-0000-4000-8000-000000000002"]','Plain removal does not lift an existing block');
select is(friend_pair_active('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002'),false,'Blocked pair cannot enter friends board');
select is((select count(*)::integer from friend_quest_awards),2,'Earned badges survive pair removal');
insert into invite_token select 'blocked',(friend_invite_create('a3080000-0000-4000-8000-000000000002',gen_random_uuid())->'invite'->>'token')::uuid;
select is((select count(*)::integer from invite_token where k='blocked'),1,'Blocked peer can create their own code');
select throws_ok($$select friend_invite_accept('a3080000-0000-4000-8000-000000000001',(select token from invite_token where k='blocked'))$$,'P0001','friend_missing','Blocked pair cannot reconnect by code');
select is((friend_unblock('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002')->'blocked')::text,'[]','Unblock clears own block');
insert into invite_token select 'again',(friend_invite_create('a3080000-0000-4000-8000-000000000001',gen_random_uuid())->'invite'->>'token')::uuid;
select is((select count(*)::integer from invite_token where k='again'),1,'Former friends need a new invitation');
select is((friend_invite_accept('a3080000-0000-4000-8000-000000000002',(select token from invite_token where k='again'))->'friends'->0->>'id'),'a3080000-0000-4000-8000-000000000001','Fresh acceptance restores relationship');
select throws_ok($$select friend_quest_start('a3080000-0000-4000-8000-000000000001','a3080000-0000-4000-8000-000000000002')$$,'P0001','friend_quest_active','Removal cannot unlock a second weekly quest');
update friend_invites set expires_at=now()-interval '31 days' where token=(select token from invite_token where k='first');
select is((retain_friend_quests()->>'changed')::integer,1,'Expired invitation is pruned');
set local role anon;
select throws_ok('select * from friend_quests','42501',null,'Guest cannot enumerate quests');
reset role;
set local role authenticated;
select throws_ok($$select friend_status('a3080000-0000-4000-8000-000000000001')$$,'42501',null,'Client cannot impersonate another actor');
select throws_ok('select * from friend_invites','42501',null,'Client cannot enumerate codes');
reset role;
select * from finish();
rollback;
