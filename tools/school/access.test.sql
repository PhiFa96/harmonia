select no_plan();
select ok(relrowsecurity,'RLS enabled: '||relname) from pg_class where relnamespace='school_draft'::regnamespace and relkind='r' order by relname;
select ok(not rolbypassrls and not rolsuper and not rolcanlogin,'Actor role cannot log in or bypass RLS') from pg_roles where rolname='harmonia_school_actor';
select ok(not has_schema_privilege('public','school_draft','usage'),'Draft schema has no public access');
select ok(not has_function_privilege('public','school_draft.create_org(text)','execute'),'Public cannot invoke draft mutations');

insert into school_draft.organizations values ('10000000-0000-4000-8000-000000000001','Synthetic A'),('10000000-0000-4000-8000-000000000002','Synthetic B');
insert into school_draft.org_members values
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','admin'),
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','teacher'),
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','teacher'),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004','admin');
insert into school_draft.classes(id,org_id,label) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Class A'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Class B'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Foreign class');
insert into school_draft.class_teachers values
('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'),
('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003');
insert into school_draft.class_members(class_id,actor_id,alias) values
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000006','P-A'),
('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000006','P-A');

set local role harmonia_school_actor;
select set_config('school_draft.actor','',true);
select is((select count(*)::int from school_draft.classes),0,'No actor sees no class');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from school_draft.classes),1,'Teacher A sees exactly their assigned class');
select is((select label from school_draft.classes),'Class A','Same-organization and foreign classes both hidden');
select is((select count(*)::int from school_draft.class_members),1,'Teacher sees only their roster');
select is((select count(*)::int from school_draft.sample_evidence),0,'Joining does not share any learning data');
select is((select count(*)::int from school_draft.invites),0,'Invitation hashes hidden even from teachers');
select throws_ok($$update school_draft.org_members set role='admin'$$,'42501',null,'No direct privilege escalation');
select throws_ok($$update school_draft.sample_evidence set correct=total$$,'42501',null,'Teachers cannot manufacture evidence');
select throws_ok($$select school_draft.set_teacher('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002',true)$$,'42501','forbidden','Teacher cannot assign themselves another class');

select set_config('school_draft.actor','00000000-0000-4000-8000-000000000006',true);
select is((select count(*)::int from school_draft.class_members),2,'Learner sees only their own memberships');
select is((select count(*)::int from school_draft.sample_evidence),3,'Learner can see own samples');
select lives_ok($$select school_draft.set_sharing('20000000-0000-4000-8000-000000000001',true)$$,'Learner explicitly shares with Class A');
select is((select count(*)::int from school_draft.sharing_events),1,'Sharing decision has a versioned event');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from school_draft.sample_evidence),3,'Assigned teacher can read shared samples');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000003',true);
select is((select count(*)::int from school_draft.sample_evidence),0,'Same learner in another class remains private');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000001',true);
select is((select count(*)::int from school_draft.classes),2,'Admin can manage organization classes');
select is((select count(*)::int from school_draft.sample_evidence),0,'Admin has no implicit progress access');
select throws_ok($$select school_draft.delete_class('20000000-0000-4000-8000-000000000003')$$,'42501','forbidden','Admin cannot delete another organization class');

select set_config('school_draft.actor','00000000-0000-4000-8000-000000000006',true);
select lives_ok($$select school_draft.set_sharing('20000000-0000-4000-8000-000000000001',false)$$,'Learner withdraws sharing');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from school_draft.sample_evidence),0,'Withdrawal affects the next database read');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000007',true);
select is((select count(*)::int from school_draft.class_members),0,'Other learner cannot read a roster');
select is((select count(*)::int from school_draft.classes),0,'Unenrolled learner sees no classes');
select throws_ok($$select school_draft.set_sharing('20000000-0000-4000-8000-000000000001',true)$$,'42501','forbidden','Other learner cannot grant sharing on behalf of a member');
select throws_ok($$select school_draft.create_org('Forged')$$,'42501','forbidden','Learner cannot become an administrator');

select set_config('school_draft.actor','00000000-0000-4000-8000-000000000001',true);
select lives_ok($$select school_draft.remove_teacher('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002')$$,'Administrator removes a teacher');
select set_config('school_draft.actor','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from school_draft.classes),0,'Removed teacher loses class access');
select is((select count(*)::int from school_draft.class_members),0,'Removed teacher loses roster access');
reset role;
