begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
 ('55555555-5555-4555-8555-555555555561','adaptive-a@example.invalid'),
 ('55555555-5555-4555-8555-555555555562','adaptive-b@example.invalid');
insert into skill_progress values
 ('55555555-5555-4555-8555-555555555561','adaptive.own',1600,100,0.06,2,now()),
 ('55555555-5555-4555-8555-555555555562','adaptive.foreign',1200,100,0.06,3,now());
insert into item_difficulty values('g2:1:adaptive-test',1400,100,0.06,5,now());
set local role anon;
select throws_ok('select learner_rating_snapshot()','42501',null,'Guest has no snapshot RPC');
select throws_ok('select adaptive_beta_report(current_date-7,current_date)','42501',null,'Guest has no beta report');
set local role authenticated;
set local request.jwt.claims='{"sub":"55555555-5555-4555-8555-555555555561","role":"authenticated"}';
select is(learner_rating_snapshot()->'skills'->'adaptive.own'->>'rating','1600','Snapshot reads own skill');
select ok(not (learner_rating_snapshot()->'skills' ? 'adaptive.foreign'),'Snapshot excludes foreign skills');
select is(learner_rating_snapshot()->'buckets','{}'::jsonb,'No aggregate buckets returned unless requested');
select is(learner_rating_snapshot('["g2:1:adaptive-test"]')->'buckets'->'g2:1:adaptive-test'->>'rating','1400','Requested anonymous difficulty is available');
select ok(not (learner_rating_snapshot() ? 'actor'),'Snapshot has no owner identifiers');
select throws_ok('select learner_rating_snapshot(''{}'')','P0001',null,'Reject non-array bucket list');
select throws_ok('select learner_rating_snapshot(''[{}]'')','P0001',null,'Reject non-string bucket list');
select throws_ok('select learner_rating_snapshot((select jsonb_agg(''x''::text) from generate_series(1,2001)))','P0001',null,'Bound bucket count');
select throws_ok('select adaptive_beta_report(current_date-7,current_date)','42501',null,'Learner cannot read private beta report');
set local request.jwt.claims='{"sub":"55555555-5555-4555-8555-555555555562","role":"authenticated"}';
select ok(not (learner_rating_snapshot()->'skills' ? 'adaptive.own'),'Second account never inherits first account snapshot');
set local request.jwt.claims='{}';
select throws_ok('select learner_rating_snapshot()','P0001',null,'Authenticated role without subject is rejected');
reset role;
insert into learning_events(user_id,client_id,event,event_hash) values
 ('55555555-5555-4555-8555-555555555561','adaptive-pending','{"kind":"placement","id":"adaptive-pending"}',repeat('a',64));
set local role authenticated;
set local request.jwt.claims='{"sub":"55555555-5555-4555-8555-555555555561","role":"authenticated"}';
select throws_ok('select learner_rating_snapshot()','P0001',null,'Unprojected receipts cannot be mistaken for a complete snapshot');
reset role;
update learning_events set rating_version=1,rating_outcome='no_evidence',rated_at=now() where user_id='55555555-5555-4555-8555-555555555561';
set local role authenticated;
select is((learner_rating_snapshot()->>'throughSequence')::bigint,(select max(sequence) from learning_events),'Snapshot cursor belongs to completed projection');
reset role;
insert into analytics_participants(user_id,consent_id,already_premium) values
 ('55555555-5555-4555-8555-555555555561','55555555-5555-4555-8555-555555555561',false),
 ('55555555-5555-4555-8555-555555555562','55555555-5555-4555-8555-555555555562',false);
insert into analytics_events(user_id,dedupe_key,name,properties,occurred_at) values
 ('55555555-5555-4555-8555-555555555561','a-start','lesson_started','{"attemptId":"a","lessonId":"test","contentVersion":1,"selectionExperiment":"p302-beta-v1","selectionGroup":"adaptive","selectionUsed":"adaptive"}',now()-interval '2 days'),
 ('55555555-5555-4555-8555-555555555561','a-end','lesson_completed','{"attemptId":"a","lessonId":"test","contentVersion":1}',now()-interval '2 days'+interval '1 hour'),
 ('55555555-5555-4555-8555-555555555562','b-start','lesson_started','{"attemptId":"b","lessonId":"test","contentVersion":1,"selectionExperiment":"p302-beta-v1","selectionGroup":"control","selectionUsed":"fixed"}',now()-interval '2 days'),
 ('55555555-5555-4555-8555-555555555562','b-start-immature','lesson_started','{"attemptId":"new","lessonId":"test","contentVersion":1,"selectionExperiment":"p302-beta-v1","selectionGroup":"control","selectionUsed":"fixed"}',now()-interval '1 hour'),
 ('55555555-5555-4555-8555-555555555561','forced-start','lesson_started','{"attemptId":"forced","lessonId":"test","contentVersion":1,"selectionGroup":"adaptive","selectionUsed":"adaptive"}',now()-interval '2 days');
set local role service_role;
select is(jsonb_array_length(adaptive_beta_report(current_date-7,current_date+1)->'strata'),2,'Private report retains both assigned groups');
select is((select sum((value->>'started')::integer)::integer from jsonb_array_elements(adaptive_beta_report(current_date-7,current_date+1)->'strata')),2,'Denominator includes abandonment and excludes immature starts');
select is((select sum((value->>'completed')::integer)::integer from jsonb_array_elements(adaptive_beta_report(current_date-7,current_date+1)->'strata')),1,'Only matching completed attempt counts');
select is(adaptive_beta_report(current_date-7,current_date+1)->>'nonInferiorityEstablished','false','Synthetic counts never establish empirical acceptance');
select throws_ok('select adaptive_beta_report(current_date,current_date-1)','P0001',null,'Reject inverted beta window');
select * from finish();
rollback;
