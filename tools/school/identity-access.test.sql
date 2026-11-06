-- Same assertions against the minimal provider fixture and real local Supabase Auth.
reset role;
select ok(exists(select 1 from pg_constraint where conrelid='school_draft.actors'::regclass and confrelid='auth.users'::regclass and contype='f' and confdeltype='c'),'School identities cascade from Auth accounts');
select throws_ok($$insert into school_draft.actors values('ffffffff-ffff-4fff-8fff-ffffffffffff','Orphan','learner')$$,'23503',null,'An unregistered Auth account cannot acquire a school identity');
select ok(not rolcanlogin and not rolinherit and not rolsuper and not rolbypassrls and not rolcreaterole,'Backend capability cannot log in, inherit, bypass RLS or create roles') from pg_roles where rolname='harmonia_school_backend';
select ok(pg_has_role('harmonia_school_backend','harmonia_school_grader','SET'),'Only the backend can explicitly select the grader');
select ok(not pg_has_role('harmonia_school_actor','harmonia_school_backend','SET'),'Actor cannot become the backend');
select ok(not pg_has_role('harmonia_school_grader','harmonia_school_backend','SET'),'Grader cannot resolve provider identities');
select ok(not has_function_privilege('public','school_draft.resolve_identity(uuid,uuid)','execute'),'No public identity resolver');
select ok(not has_function_privilege('harmonia_school_actor','school_draft.resolve_identity(uuid,uuid)','execute'),'No client-side identity resolver');
select ok(not has_table_privilege('harmonia_school_backend','auth.users','select'),'Backend has no raw Auth account access');
select ok(not has_table_privilege('harmonia_school_backend','auth.sessions','select'),'Backend has no raw Auth session access');
select ok(not pg_has_role(rolname,'harmonia_school_backend','SET') and not pg_has_role(rolname,'harmonia_school_grader','SET'),'No backend or grader via API role: '||rolname) from pg_roles where rolname in ('anon','authenticated','authenticator','service_role');

set local role harmonia_school_backend;
select is((select count(*)::int from school_draft.resolve_identity('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000006')),1,'Live matching Auth session resolves exactly one school identity');
select is((select count(*)::int from school_draft.resolve_identity('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000007')),0,'A session from another account grants no identity');
select throws_ok($$select * from auth.sessions$$,'42501',null,'Backend cannot enumerate provider sessions');
reset role;
update auth.users set banned_until=clock_timestamp()+interval '1 hour' where id='00000000-0000-4000-8000-000000000006';
select is((select count(*)::int from school_draft.resolve_identity('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000006')),0,'A banned provider account cannot resolve');
update auth.users set banned_until=null where id='00000000-0000-4000-8000-000000000006';
delete from auth.sessions where id='00000000-0000-4000-8000-000000000006';
select is((select count(*)::int from school_draft.resolve_identity('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000006')),0,'A revoked provider session cannot resolve');
delete from auth.users where id='00000000-0000-4000-8000-000000000006';
select is((select count(*)::int from school_draft.actors where id='00000000-0000-4000-8000-000000000006'),0,'Provider account deletion removes the school identity');
