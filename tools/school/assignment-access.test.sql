-- Continue the common no_plan() transaction after the school access cases.
insert into school_draft.org_members values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','teacher');
insert into school_draft.class_teachers values ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into school_draft.assignments(id,class_id,title,due_at,content_version,task_count,blocks) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Assignment fixture',now()+interval '1 day',20,2,'[]');
insert into school_draft.assignment_targets values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000006');
insert into school_draft.assignment_material values ('30000000-0000-4000-8000-000000000001',repeat('0',64),'[{}]');
insert into school_draft.assignment_attempts(assignment_id,class_id,actor_id,answers,correct) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000006','[{"answer":"fixture","correct":true}]',1);

select ok(not rolcanlogin and not rolsuper and not rolbypassrls,'Grader cannot log in or bypass RLS') from pg_roles where rolname='harmonia_school_grader';
select ok(not pg_has_role('harmonia_school_actor','harmonia_school_grader','SET'),'Actor cannot become the trusted grader');
select ok(not has_function_privilege('public','school_draft.assignment_class_lock(uuid)','execute'),'Assignment lock is not public');
select ok(not has_function_privilege('harmonia_school_actor','school_draft.assignment_class_lock(uuid)','execute'),'Only server grader can lock for mutation');
select throws_ok($$update school_draft.assignment_targets set class_id='20000000-0000-4000-8000-000000000002'$$,'23503',null,'Assignment target cannot point at a different class');

set local role harmonia_school_actor;
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000006',true);
select is((select count(*)::int from school_draft.assignments),1,'Assigned learner sees assignment');
select is((select correct from school_draft.assignment_attempts),1,'Learner sees own score without sharing');
select throws_ok($$select items from school_draft.assignment_material$$,'42501',null,'Learner cannot read solutions or future items');
select throws_ok($$select answers from school_draft.assignment_attempts$$,'42501',null,'Actor cannot read saved raw answers');
select throws_ok($$update school_draft.assignment_attempts set correct=2$$,'42501',null,'Actor cannot manufacture points');
select throws_ok($$update school_draft.assignments set due_at=now()+interval '2 days'$$,'42501',null,'Actor cannot change deadline');
select school_draft.set_sharing('20000000-0000-4000-8000-000000000001',true);
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from school_draft.assignments),1,'Assigned teacher sees assignment');
select is((select count(correct)::int from school_draft.assignment_attempts),0,'Shared work in progress remains hidden from teacher');
select throws_ok($$select items from school_draft.assignment_material$$,'42501',null,'Teacher browser cannot read private material');

reset role;
update school_draft.assignment_attempts set finished_at=now(),reason='submitted';
set local role harmonia_school_actor;
select is((select correct from school_draft.assignment_attempts),1,'Teacher sees finalized and shared result');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000003',true);
select is((select count(*)::int from school_draft.assignments),0,'Other teacher in same organization sees no assignment');
select is((select count(correct)::int from school_draft.assignment_attempts),0,'Other teacher sees no result');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000001',true);
select is((select count(*)::int from school_draft.assignments),0,'Organization management does not grant assignment access');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000007',true);
select is((select count(*)::int from school_draft.assignment_targets),0,'Other learner cannot discover recipients');

select set_config('school_draft.actor','00000000-0000-4000-8000-000000000006',true);
select school_draft.set_sharing('20000000-0000-4000-8000-000000000001',false);
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(correct)::int from school_draft.assignment_attempts),0,'Withdrawn assignment result disappears on next read');
reset role;
delete from school_draft.class_members where class_id='20000000-0000-4000-8000-000000000001' and actor_id='00000000-0000-4000-8000-000000000006';
select is((select count(*)::int from school_draft.assignment_targets),0,'Leaving deletes the old assignment target');
select is((select count(*)::int from school_draft.assignment_attempts),0,'Leaving cascades to saved answers and scores');
