begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
-- Fachprüfung P3.06 Befund 4: Duell-XP setzen mindestens eine richtige Antwort voraus.
insert into auth.users(id,email) values
 ('a3190000-0000-4000-8000-000000000001','duel-p1@example.invalid'),
 ('a3190000-0000-4000-8000-000000000002','duel-p2@example.invalid'),
 ('a3190000-0000-4000-8000-000000000003','duel-p3@example.invalid'),
 ('a3190000-0000-4000-8000-000000000004','duel-p4@example.invalid');
insert into duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline) values
 ('c3190000-0000-4000-8000-000000000001','live',repeat('a',64),gen_random_uuid(),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}',now()-interval '4 minutes',now()-interval '1 minute');
insert into duel_players(game_id,user_id,last_at) values
 ('c3190000-0000-4000-8000-000000000001','a3190000-0000-4000-8000-000000000001',now()-interval '4 minutes'),
 ('c3190000-0000-4000-8000-000000000001','a3190000-0000-4000-8000-000000000002',now()-interval '4 minutes');
select is(duel_settle('c3190000-0000-4000-8000-000000000001','[{"userId":"a3190000-0000-4000-8000-000000000001","rating":1500,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":1000},{"userId":"a3190000-0000-4000-8000-000000000002","rating":1500,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":1000}]'),true,'Game without any answer settles');
select is((select outcome from duel_players where game_id='c3190000-0000-4000-8000-000000000001' and user_id='a3190000-0000-4000-8000-000000000001'),'draw','No answers is a draw');
select is((select count(*)::integer from xp_ledger where source_kind='duel' and duel_game_id='c3190000-0000-4000-8000-000000000001'),0,'A draw without a single answer awards no XP');
insert into duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline) values
 ('c3190000-0000-4000-8000-000000000002','live',repeat('a',64),gen_random_uuid(),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}',now()-interval '4 minutes',now()-interval '1 minute');
insert into duel_players(game_id,user_id,last_at,ordinal,correct,score) values
 ('c3190000-0000-4000-8000-000000000002','a3190000-0000-4000-8000-000000000001',now()-interval '4 minutes',2,2,20),
 ('c3190000-0000-4000-8000-000000000002','a3190000-0000-4000-8000-000000000003',now()-interval '4 minutes',1,1,10);
select is(duel_settle('c3190000-0000-4000-8000-000000000002','[{"userId":"a3190000-0000-4000-8000-000000000001","rating":1510,"deviation":290,"volatility":0.06,"attempts":2,"updatedAt":2000},{"userId":"a3190000-0000-4000-8000-000000000003","rating":1490,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":2000}]'),true,'Game with answers on both sides settles');
select is((select amount from xp_ledger where user_id='a3190000-0000-4000-8000-000000000001' and duel_game_id='c3190000-0000-4000-8000-000000000002'),10,'Player with a correct answer earns XP');
select is((select amount from xp_ledger where user_id='a3190000-0000-4000-8000-000000000003' and duel_game_id='c3190000-0000-4000-8000-000000000002'),3,'Loser with a correct answer still earns the loss XP');
insert into duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline) values
 ('c3190000-0000-4000-8000-000000000003','live',repeat('a',64),gen_random_uuid(),'[{"spec":{"type":"NOTE_NAME","params":{}},"difficulty":1}]','{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}',now()-interval '4 minutes',now()-interval '1 minute');
insert into duel_players(game_id,user_id,last_at,ordinal,correct,score) values
 ('c3190000-0000-4000-8000-000000000003','a3190000-0000-4000-8000-000000000002',now()-interval '4 minutes',1,1,10),
 ('c3190000-0000-4000-8000-000000000003','a3190000-0000-4000-8000-000000000004',now()-interval '4 minutes',0,0,0);
select is(duel_settle('c3190000-0000-4000-8000-000000000003','[{"userId":"a3190000-0000-4000-8000-000000000002","rating":1510,"deviation":290,"volatility":0.06,"attempts":2,"updatedAt":3000},{"userId":"a3190000-0000-4000-8000-000000000004","rating":1490,"deviation":300,"volatility":0.06,"attempts":1,"updatedAt":3000}]'),true,'Game with one participant settles');
select is((select amount from xp_ledger where user_id='a3190000-0000-4000-8000-000000000002' and duel_game_id='c3190000-0000-4000-8000-000000000003'),10,'Participating winner earns XP');
select is((select count(*)::integer from xp_ledger where user_id='a3190000-0000-4000-8000-000000000004'),0,'Player without any answer earns no XP, even as loser');
select * from finish();
rollback;
