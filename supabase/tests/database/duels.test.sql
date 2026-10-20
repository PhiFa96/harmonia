begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
 ('a3060000-0000-4000-8000-000000000001','duel-a@example.invalid'),
 ('a3060000-0000-4000-8000-000000000002','duel-b@example.invalid'),
 ('a3060000-0000-4000-8000-000000000003','duel-c@example.invalid'),
 ('a3060000-0000-4000-8000-000000000004','duel-d@example.invalid');
select is(duel_find('a3060000-0000-4000-8000-000000000001',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}','b3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000001')->>'phase','queue','First player waits');
select is(duel_find('a3060000-0000-4000-8000-000000000002',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}','b3060000-0000-4000-8000-000000000002','c3060000-0000-4000-8000-000000000002')->>'phase','game','Second player pairs');
select is((duel_status('a3060000-0000-4000-8000-000000000001')->'game'->>'id'),(duel_status('a3060000-0000-4000-8000-000000000002')->'game'->>'id'),'Both get one shared game');
select is((select count(*)::integer from duel_queue),0,'Paired entries leave queue');
select throws_ok($$select duel_answer('a3060000-0000-4000-8000-000000000003','c3060000-0000-4000-8000-000000000002',0,'C',true,10)$$,'P0001','duel_missing','Non-participant cannot answer');
update duel_games set starts_at=now()-interval '2 seconds',deadline=now()+interval '30 seconds' where id='c3060000-0000-4000-8000-000000000002';
update duel_players set last_at=now()-interval '1 second' where game_id='c3060000-0000-4000-8000-000000000002';
select is((duel_answer('a3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000002',0,'C',true,10)->'player'->>'score')::integer,10,'Server-evaluated step recorded');
select is((duel_answer('a3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000002',0,'C',true,10)->'player'->>'ordinal')::integer,1,'Identical retry is idempotent');
select throws_ok($$select duel_answer('a3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000002',0,'D',false,0)$$,'P0001','duel_conflict','Different retry rejected');
select throws_ok($$select duel_answer('a3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000002',1,'C',true,10)$$,'P0001','duel_fast','Implausibly fast next step rejected');
update duel_players set ordinal=3,correct=0,mistakes=3 where game_id='c3060000-0000-4000-8000-000000000002' and user_id='a3060000-0000-4000-8000-000000000001';
select throws_ok($$select duel_answer('a3060000-0000-4000-8000-000000000001','c3060000-0000-4000-8000-000000000002',3,'C',false,0)$$,'P0001','duel_conflict','Three mistakes end the answers like Theory Rush');
update duel_players set ordinal=1,correct=1,mistakes=0 where game_id='c3060000-0000-4000-8000-000000000002' and user_id='a3060000-0000-4000-8000-000000000001';
update duel_games set deadline=now()-interval '1 second' where id='c3060000-0000-4000-8000-000000000002';
select is(duel_settle('c3060000-0000-4000-8000-000000000002','[{"userId":"a3060000-0000-4000-8000-000000000001","rating":1600,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":1000},{"userId":"a3060000-0000-4000-8000-000000000002","rating":1400,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":1000}]'),true,'Live game settles once');
select is(duel_settle('c3060000-0000-4000-8000-000000000002','[]'),false,'Repeated settlement has no effect');
select is((select outcome from duel_players where game_id='c3060000-0000-4000-8000-000000000002' and user_id='a3060000-0000-4000-8000-000000000001'),'win','Winner outcome retained');
select is((select amount from xp_ledger where user_id='a3060000-0000-4000-8000-000000000001' and source_kind='duel'),10,'Live win awards canonical XP');
select is((select count(*)::integer from xp_ledger where user_id='a3060000-0000-4000-8000-000000000002' and source_kind='duel'),0,'Live loss without any answer awards no XP');
select is((select rating from duel_ratings where user_id='a3060000-0000-4000-8000-000000000001'),1600::double precision,'Rating committed with result');
select is(duel_invite_create('a3060000-0000-4000-8000-000000000001',repeat('a',64),'d3060000-0000-4000-8000-000000000001')->>'phase','invite','Friend link created');
select is(duel_invite_accept('a3060000-0000-4000-8000-000000000003','d3060000-0000-4000-8000-000000000001',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}','b3060000-0000-4000-8000-000000000003','c3060000-0000-4000-8000-000000000003')->'game'->>'kind','friend','Invite joins host');
select throws_ok($$select duel_invite_accept('a3060000-0000-4000-8000-000000000004','d3060000-0000-4000-8000-000000000001',repeat('a',64),'[{}]','{}',gen_random_uuid(),gen_random_uuid())$$,'P0001','duel_conflict','Invitation cannot be reused by another');
update duel_games set starts_at=now()-interval '4 minutes',deadline=now()-interval '1 minute' where id='c3060000-0000-4000-8000-000000000003';
select is(duel_settle('c3060000-0000-4000-8000-000000000003','[]'),true,'Friend duel settles without rating');
select is((select count(*)::integer from xp_ledger where duel_game_id='c3060000-0000-4000-8000-000000000003'),0,'Friend duel gives no XP');
insert into rush_runs(id,user_id,mode,bank,seed,pool,policy,state,started_at,deadline,last_at,finished_at,revision,correct,score)
 values('e3060000-0000-4000-8000-000000000001','a3060000-0000-4000-8000-000000000004','three',repeat('a',64),'f3060000-0000-4000-8000-000000000001','[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}','finished',now()-interval '1 hour',now()-interval '57 minutes',now()-interval '58 minutes',now()-interval '57 minutes',1,1,10);
insert into rush_steps(user_id,run_id,ordinal,answer,correct,points,received_at) values('a3060000-0000-4000-8000-000000000004','e3060000-0000-4000-8000-000000000001',0,'C',true,10,now()-interval '59 minutes');
select is(duel_find('a3060000-0000-4000-8000-000000000003',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}',gen_random_uuid(),gen_random_uuid())->>'phase','queue','Ghost does not appear immediately');
update duel_queue set joined_at=now()-interval '11 seconds' where user_id='a3060000-0000-4000-8000-000000000003';
select is(duel_find('a3060000-0000-4000-8000-000000000003',repeat('a',64),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}',gen_random_uuid(),'c3060000-0000-4000-8000-000000000004')->'game'->>'kind','ghost','Verified Rush source supplies ghost after wait');
select is((select ghost_score from duel_games where id='c3060000-0000-4000-8000-000000000004'),10,'Ghost keeps real recorded score');
set local role anon;
select throws_ok('select * from duel_games','42501',null,'Guest cannot enumerate games');
reset role;
set local role authenticated;
select throws_ok($$select duel_find('a3060000-0000-4000-8000-000000000001',repeat('a',64),'[]','{}',gen_random_uuid(),gen_random_uuid())$$,'42501',null,'Client cannot self-match');
select throws_ok('select * from duel_steps','42501',null,'Client cannot forge answers');
select throws_ok($$select duel_settle('c3060000-0000-4000-8000-000000000002','[]')$$,'42501',null,'Client cannot forge rating or XP');
reset role;
select * from finish();
rollback;
