-- P4.13-P4.16 combined internal revision. Loaded only in an isolated fixture schema.
-- Supabase uses its existing auth.uid(); the disposable PostgreSQL fixture supplies a shim.
create or replace function school_draft.actor() returns uuid language sql stable security definer
set search_path='' as $$ select auth.uid() $$;
revoke all on school_draft.operators from harmonia_school_actor;
create or replace function school_draft.license_operator() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.operators where actor_id=school_draft.actor()) $$;

alter table school_draft.class_members add column id uuid not null default gen_random_uuid() unique;
alter table school_draft.class_members alter column alias set default ('P-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
alter table school_draft.class_members add column sharing_policy text;
-- A legacy flag never silently acquires the expanded purpose.
update school_draft.class_members set sharing_policy='school-draft-sharing-v1' where sharing;
create function school_draft.sharing_policy() returns text language sql immutable set search_path='' as $$ select 'school-draft-sharing-v2'::text $$;
create function school_draft.sharing_current(c uuid,a uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.class_members where class_id=c and actor_id=a and sharing and sharing_policy=school_draft.sharing_policy() and (a=school_draft.actor() or school_draft.teaches(c))) $$;
alter table school_draft.sharing_events drop constraint sharing_events_class_id_actor_id_fkey;
alter table school_draft.sharing_events alter column class_id drop not null;
alter table school_draft.sharing_events alter column actor_id drop not null;
alter table school_draft.sharing_events add foreign key(class_id) references school_draft.classes on delete set null;
alter table school_draft.sharing_events add foreign key(actor_id) references school_draft.actors on delete set null;
alter table school_draft.sharing_events alter column policy set default 'school-draft-sharing-v2';
alter table school_draft.invites drop constraint invites_issuer_fkey;
alter table school_draft.invites add foreign key(issuer) references school_draft.actors on delete cascade;
alter table school_draft.license_events drop constraint license_events_actor_id_fkey;
alter table school_draft.license_events alter column actor_id drop not null;
alter table school_draft.license_events add foreign key(actor_id) references school_draft.actors on delete set null;

create or replace function school_draft.can_read_evidence(a uuid) returns boolean language sql stable security definer set search_path='' as $$
 select a=school_draft.actor() or exists(select 1 from school_draft.class_members m where m.actor_id=a and school_draft.sharing_current(m.class_id,a) and school_draft.teaches(m.class_id)) $$;
drop function school_draft.set_sharing(uuid,boolean);
create function school_draft.set_sharing(c uuid,enabled boolean,policy text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if enabled is null then raise exception 'invalid' using errcode='22023'; end if;
 perform 1 from school_draft.classes where id=c and not archived for update;
 if not found or not school_draft.enrolled(c) then raise exception 'forbidden' using errcode='42501'; end if;
 if enabled and policy is distinct from school_draft.sharing_policy() then raise exception 'sharingPolicy' using errcode='22023'; end if;
 update school_draft.class_members set sharing=enabled,sharing_policy=case when enabled then policy else null end,changed_at=clock_timestamp()
 where class_id=c and actor_id=school_draft.actor() and (sharing is distinct from enabled or (enabled and sharing_policy is distinct from policy));
 if found then insert into school_draft.sharing_events(class_id,actor_id,enabled,policy) values(c,school_draft.actor(),enabled,school_draft.sharing_policy()); end if;
end $$;
create or replace function school_draft.assignment_result_visible(a uuid,u uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.assignments x where x.id=a and school_draft.sharing_current(x.class_id,u) and school_draft.teaches(x.class_id)) $$;
drop policy quiz_answer_read on school_draft.quiz_answers;
create policy quiz_answer_read on school_draft.quiz_answers for select to harmonia_school_grader using(school_draft.quiz_allowed(quiz_id) and (actor_id=school_draft.actor() or
 (school_draft.quiz_teacher(quiz_id) and exists(select 1 from school_draft.quizzes q where q.id=quiz_id and q.phase='finished' and school_draft.sharing_current(q.class_id,quiz_answers.actor_id)))));
drop policy quiz_players_read on school_draft.quiz_players;
create policy quiz_players_read on school_draft.quiz_players for select to harmonia_school_actor using(actor_id=school_draft.actor() and school_draft.quiz_allowed(quiz_id));
create policy quiz_players_server_read on school_draft.quiz_players for select to harmonia_school_grader using(school_draft.quiz_allowed(quiz_id));
revoke select on school_draft.license_events from harmonia_school_actor;
grant select(id,invoice_id,kind,at) on school_draft.license_events to harmonia_school_actor;

create table school_draft.teacher_events (
 id bigint generated always as identity primary key,
 class_id uuid references school_draft.classes on delete set null,
 changed_by uuid references school_draft.actors on delete set null,
 teacher_id uuid references school_draft.actors on delete set null,
 enabled boolean not null, at timestamptz not null default clock_timestamp()
);
alter table school_draft.teacher_events enable row level security;
create policy teacher_event_read on school_draft.teacher_events for select to harmonia_school_actor using(school_draft.enrolled(class_id) or school_draft.teaches(class_id) or exists(select 1 from school_draft.classes c where c.id=class_id and school_draft.is_admin(c.org_id)));
-- Audit reads use a scoped definer below; direct account mappings stay private.
create function school_draft.log_teacher() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then insert into school_draft.teacher_events(class_id,changed_by,teacher_id,enabled) values((select id from school_draft.classes where id=new.class_id),(select id from school_draft.actors where id=school_draft.actor()),(select id from school_draft.actors where id=new.actor_id),true);
 else insert into school_draft.teacher_events(class_id,changed_by,teacher_id,enabled) values((select id from school_draft.classes where id=old.class_id),(select id from school_draft.actors where id=school_draft.actor()),(select id from school_draft.actors where id=old.actor_id),false); end if;
 return null;
end $$;
create trigger teacher_audit after insert or delete on school_draft.class_teachers for each row execute function school_draft.log_teacher();
create or replace function school_draft.set_teacher(c uuid,a uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
declare o uuid;
begin
 select org_id into o from school_draft.classes where id=c and not archived for update;
 if not school_draft.is_admin(o) or enabled is null then raise exception 'forbidden' using errcode='42501'; end if;
 if enabled then
  if a=school_draft.actor() and not exists(select 1 from school_draft.class_teachers where class_id=c and actor_id=a) then raise exception 'selfAssignment' using errcode='P0001'; end if;
  insert into school_draft.class_teachers values(o,c,a) on conflict do nothing;
 else
  delete from school_draft.class_teachers where class_id=c and actor_id=a;
  update school_draft.invites set revoked=true where class_id=c and issuer=a;
 end if;
end $$;
create function school_draft.teacher_history(c uuid) returns table(enabled boolean,at timestamptz,teacher text) language plpgsql security definer set search_path='' as $$
begin
 if not(school_draft.enrolled(c) or school_draft.teaches(c) or exists(select 1 from school_draft.classes where id=c and school_draft.is_admin(org_id))) then raise exception 'forbidden' using errcode='42501';end if;
 return query select e.enabled,e.at,coalesce(a.key,'') from school_draft.teacher_events e left join school_draft.actors a on a.id=e.teacher_id where e.class_id=c order by e.id;
end $$;

create table school_draft.join_limits (
 actor_id uuid not null references school_draft.actors on delete cascade,
 kind text not null check(kind in ('roster','quiz')),started_at timestamptz not null,attempts int not null,
 primary key(actor_id,kind)
);
alter table school_draft.join_limits enable row level security;
create function school_draft.consume_join(k text) returns boolean language plpgsql security definer set search_path='' as $$
declare n int;
begin
 if k not in ('roster','quiz') or not exists(select 1 from school_draft.actors where id=school_draft.actor()) then raise exception 'forbidden' using errcode='42501';end if;
 insert into school_draft.join_limits values(school_draft.actor(),k,clock_timestamp(),1)
 on conflict(actor_id,kind) do update set
 attempts=case when school_draft.join_limits.started_at<=clock_timestamp()-interval '1 minute' then 1 else least(school_draft.join_limits.attempts+1,11) end,
 started_at=case when school_draft.join_limits.started_at<=clock_timestamp()-interval '1 minute' then clock_timestamp() else school_draft.join_limits.started_at end
 returning attempts into n;
 return n<=10;
end $$;

-- Read snapshots share the class lock; independent streams no longer queue behind one another.
create function school_draft.assignment_class_read(c uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from school_draft.classes where id=c and not archived for share;
 if not found or not(school_draft.teaches(c) or school_draft.enrolled(c)) then raise exception 'forbidden' using errcode='42501';end if;
 perform 1 from school_draft.class_members where class_id=c and actor_id=school_draft.actor() for share;
end $$;

create function school_draft.guard_attempt() returns trigger language plpgsql set search_path='' as $$
declare a school_draft.assignments; stop_at timestamptz; n int; counted int;
begin
 if current_user not in ('harmonia_school_actor','harmonia_school_grader') then return new;end if;
 select * into a from school_draft.assignments where id=new.assignment_id;
 stop_at=least(a.due_at,coalesce(a.closed_at,a.due_at));
 n=jsonb_array_length(new.answers);
 select count(*) filter(where e->>'correct'='true') into counted from jsonb_array_elements(new.answers) e;
 if n>a.task_count or counted<>new.correct then raise exception 'forbidden' using errcode='42501';end if;
 if tg_op='INSERT' then
  if clock_timestamp()>=stop_at or a.closed_at is not null or n<>0 or new.correct<>0 or new.finished_at is not null then raise exception 'forbidden' using errcode='42501';end if;
  new.started_at=clock_timestamp();return new;
 end if;
 if old.finished_at is not null then
  if new is distinct from old then raise exception 'forbidden' using errcode='42501';end if;return new;
 end if;
 if new.answers is distinct from old.answers then
  if clock_timestamp()>=stop_at or a.closed_at is not null or n<>jsonb_array_length(old.answers)+1 or
   (new.answers - (n-1))<>old.answers then raise exception 'forbidden' using errcode='42501';end if;
 elsif new.correct<>old.correct then raise exception 'forbidden' using errcode='42501';end if;
 if new.finished_at is not null then
  if new.reason in ('deadline','closed') then
   if new.answers<>old.answers or clock_timestamp()<stop_at or new.reason<>(case when a.closed_at is not null and a.closed_at<=a.due_at then 'closed' else 'deadline' end) then raise exception 'forbidden' using errcode='42501';end if;
   new.finished_at=stop_at;
  elsif new.reason in ('completed','submitted') then
   if clock_timestamp()>=stop_at or a.closed_at is not null or (new.reason='completed' and n<>a.task_count) then raise exception 'forbidden' using errcode='42501';end if;
   new.finished_at=clock_timestamp();
  else raise exception 'forbidden' using errcode='42501';end if;
 elsif new.reason is not null or n=a.task_count then raise exception 'forbidden' using errcode='42501';end if;
 return new;
end $$;
create trigger assignment_answer_guard before insert or update on school_draft.assignment_attempts for each row execute function school_draft.guard_attempt();
create function school_draft.guard_quiz_answer() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('harmonia_school_actor','harmonia_school_grader') and not exists(select 1 from school_draft.quizzes q where q.id=new.quiz_id and q.phase='question' and q.round_index=new.round_index and q.due_at>clock_timestamp() and q.expires_at>clock_timestamp()) then raise exception 'forbidden' using errcode='42501';end if;
 return new;
end $$;
create trigger quiz_answer_guard before insert on school_draft.quiz_answers for each row execute function school_draft.guard_quiz_answer();

revoke all on all functions in schema school_draft from public;
grant execute on function school_draft.sharing_policy(),school_draft.sharing_current(uuid,uuid),school_draft.set_sharing(uuid,boolean,text),school_draft.teacher_history(uuid),school_draft.consume_join(text) to harmonia_school_actor;
grant execute on function school_draft.assignment_class_read(uuid) to harmonia_school_grader;

-- Licence allocation uses organisation-scoped handles and voluntary learner requests.
alter table school_draft.org_members add column id uuid not null default gen_random_uuid() unique;
create table school_draft.license_requests (
 id uuid not null default gen_random_uuid() unique,
 org_id uuid not null references school_draft.organizations on delete cascade,
 actor_id uuid not null references school_draft.actors on delete cascade,
 label text not null default ('L-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 at timestamptz not null default clock_timestamp(), primary key(org_id,actor_id)
);
alter table school_draft.license_requests enable row level security;
drop function school_draft.license_candidates(uuid);
create function school_draft.license_candidates(o uuid) returns table(id uuid,key text,label text) language plpgsql security definer set search_path='' as $$
begin
 if not school_draft.is_admin(o) then raise exception 'forbidden' using errcode='42501';end if;
 return query select m.id,a.key,null::text from school_draft.org_members m join school_draft.actors a on a.id=m.actor_id where m.org_id=o
 union all select r.id,null::text,r.label from school_draft.license_requests r where r.org_id=o and school_draft.license_eligible(o,r.actor_id);
end $$;
create function school_draft.license_own_requests() returns table(org uuid,organization text,requested boolean,label text) language sql stable security definer set search_path='' as $$
 select o.id,o.label,r.id is not null,r.label from school_draft.organizations o
 left join school_draft.license_requests r on r.org_id=o.id and r.actor_id=school_draft.actor()
 where school_draft.license_eligible(o.id,school_draft.actor()) and exists(select 1 from school_draft.actors where id=school_draft.actor() and kind='learner') order by o.label,o.id $$;
create function school_draft.license_request(o uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if enabled is null or not exists(select 1 from school_draft.actors where id=school_draft.actor() and kind='learner') then raise exception 'forbidden' using errcode='42501';end if;
 if enabled then
  perform 1 from school_draft.classes where org_id=o and not archived for share;
  perform 1 from school_draft.class_members m join school_draft.classes c on c.id=m.class_id where c.org_id=o and m.actor_id=school_draft.actor() for share of m;
  if not school_draft.license_eligible(o,school_draft.actor()) then raise exception 'forbidden' using errcode='42501';end if;
  insert into school_draft.license_requests(org_id,actor_id) values(o,school_draft.actor()) on conflict do nothing;
 else
  perform 1 from school_draft.license_invoices where org_id=o order by id for update;
  delete from school_draft.license_requests where org_id=o and actor_id=school_draft.actor();
 end if;
end $$;
create function school_draft.license_request_ended() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from school_draft.license_seats where org_id=old.org_id and actor_id=old.actor_id;return null;
end $$;
create trigger licence_request_end after delete on school_draft.license_requests for each row execute function school_draft.license_request_ended();
create or replace function school_draft.license_cleanup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from school_draft.license_seats s where not school_draft.license_eligible(s.org_id,s.actor_id);
 delete from school_draft.license_requests r where not school_draft.license_eligible(r.org_id,r.actor_id);
 return null;
end $$;
drop policy license_seat_read on school_draft.license_seats;
create policy license_seat_read on school_draft.license_seats for select to harmonia_school_actor using(actor_id=school_draft.actor());
create function school_draft.license_public_seats() returns table(invoice uuid,member uuid) language sql stable security definer set search_path='' as $$
 select s.invoice_id,coalesce(m.id,r.id) from school_draft.license_seats s
 left join school_draft.org_members m on m.org_id=s.org_id and m.actor_id=s.actor_id
 left join school_draft.license_requests r on r.org_id=s.org_id and r.actor_id=s.actor_id
 where school_draft.is_admin(s.org_id) $$;

-- Account data stays available to its owner after leaving a class; records are bounded below.
create table school_draft.organization_events (
 id bigint generated always as identity primary key,
 org_id uuid references school_draft.organizations on delete set null,
 changed_by uuid references school_draft.actors on delete set null,
 successor uuid references school_draft.actors on delete set null,
 at timestamptz not null default clock_timestamp()
);
alter table school_draft.organization_events enable row level security;
create function school_draft.transfer_admin(o uuid,a uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from school_draft.organizations where id=o for update;
 if not school_draft.is_admin(o) or a=school_draft.actor() or not exists(select 1 from school_draft.org_members where org_id=o and actor_id=a) then raise exception 'forbidden' using errcode='42501';end if;
 update school_draft.org_members set role='admin' where org_id=o and actor_id=a;
 update school_draft.org_members set role='teacher' where org_id=o and actor_id=school_draft.actor();
 insert into school_draft.organization_events(org_id,changed_by,successor) values(o,school_draft.actor(),a);
end $$;
create function school_draft.export_actor() returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid=school_draft.actor(); result jsonb;
begin
 if not exists(select 1 from school_draft.actors where id=a) then raise exception 'forbidden' using errcode='42501';end if;
 select jsonb_build_object('schemaVersion',1,'scope','school-internal-draft','exportedAt',clock_timestamp(),
 'actor',(select to_jsonb(x) from school_draft.actors x where id=a),
 'memberships',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('classLabel',c.label,'organization',c.org_id)),'[]') from school_draft.class_members x join school_draft.classes c on c.id=x.class_id where x.actor_id=a),
 'organizations',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('label',o.label)),'[]') from school_draft.org_members x join school_draft.organizations o on o.id=x.org_id where x.actor_id=a),
 'sharingEvents',(select coalesce(jsonb_agg(x),'[]') from school_draft.sharing_events x where actor_id=a),
 'teachingEvents',(select coalesce(jsonb_agg(jsonb_build_object('class',class_id,'enabled',enabled,'at',at)),'[]') from school_draft.teacher_events where teacher_id=a or changed_by=a),
 'sampleEvidence',(select coalesce(jsonb_agg(x),'[]') from school_draft.sample_evidence x where actor_id=a),
 'assignmentTargets',(select coalesce(jsonb_agg(x),'[]') from school_draft.assignment_targets x where actor_id=a),
 'assignmentAttempts',(select coalesce(jsonb_agg(jsonb_build_object('assignment',x.assignment_id,'startedAt',x.started_at,'finishedAt',x.finished_at,'reason',x.reason,'answers',(select coalesce(jsonb_agg(e->'answer'),'[]') from jsonb_array_elements(x.answers)e),'correct',case when x.finished_at is not null or least(q.due_at,coalesce(q.closed_at,q.due_at))<=clock_timestamp() then x.correct else null end)),'[]') from school_draft.assignment_attempts x join school_draft.assignments q on q.id=x.assignment_id where x.actor_id=a),
 'quizParticipation',(select coalesce(jsonb_agg(x),'[]') from school_draft.quiz_players x where actor_id=a),
 'quizAnswers',(select coalesce(jsonb_agg(jsonb_build_object('quiz',x.quiz_id,'round',x.round_index,'answer',x.answer,'at',x.at,'correct',case when x.round_index<q.round_index or q.phase in ('review','finished') then x.correct else null end)),'[]') from school_draft.quiz_answers x join school_draft.quizzes q on q.id=x.quiz_id where x.actor_id=a),
 'licenseRequests',(select coalesce(jsonb_agg(x),'[]') from school_draft.license_requests x where actor_id=a),
 'licenseSeats',(select coalesce(jsonb_agg(x),'[]') from school_draft.license_seats x where actor_id=a),
 'licensePractice',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'source',source,'createdAt',created_at,'answer',answer,'correct',correct)),'[]') from school_draft.license_practice where actor_id=a),
 'licenseEvents',(select coalesce(jsonb_agg(jsonb_build_object('invoice',invoice_id,'kind',kind,'at',at)),'[]') from school_draft.license_events where actor_id=a or target=a),
 'invitationsIssued',(select coalesce(jsonb_agg(jsonb_build_object('organization',org_id,'class',class_id,'kind',kind,'expiresAt',expires_at,'revoked',revoked)),'[]') from school_draft.invites where issuer=a),
 'organizationEvents',(select coalesce(jsonb_agg(jsonb_build_object('organization',org_id,'at',at)),'[]') from school_draft.organization_events where changed_by=a or successor=a)
 ) into result;return result;
end $$;
create function school_draft.delete_actor() returns void language plpgsql security definer set search_path='' as $$
declare a uuid=school_draft.actor();
begin
 perform 1 from school_draft.organizations where id in (select org_id from school_draft.org_members where actor_id=a and role='admin') order by id for update;
 delete from school_draft.organizations o where school_draft.is_admin(o.id) and not exists(select 1 from school_draft.org_members m where m.org_id=o.id and m.actor_id<>a) and not exists(select 1 from school_draft.classes c join school_draft.class_members m on m.class_id=c.id where c.org_id=o.id);
 if exists(select 1 from school_draft.org_members m where m.actor_id=a and m.role='admin' and not exists(select 1 from school_draft.org_members n where n.org_id=m.org_id and n.actor_id<>a and n.role='admin')) then raise exception 'adminTransferRequired' using errcode='P0001';end if;
 delete from school_draft.actors where id=a;
 if not found then raise exception 'forbidden' using errcode='42501';end if;
end $$;
-- Draft demonstration policy, not an approved legal retention schedule. No remote job.
create function school_draft.purge_expired() returns jsonb language plpgsql security definer set search_path='' as $$
declare assignments_count int;quizzes_count int;samples_count int;practice_count int;audit_count int;invites_count int;more int;
begin
 if not school_draft.license_operator() then raise exception 'forbidden' using errcode='42501';end if;
 delete from school_draft.assignments where coalesce(closed_at,due_at)<clock_timestamp()-interval '30 days';get diagnostics assignments_count=row_count;
 delete from school_draft.quizzes where expires_at<clock_timestamp()-interval '7 days';get diagnostics quizzes_count=row_count;
 delete from school_draft.sample_evidence where at<clock_timestamp()-interval '30 days';get diagnostics samples_count=row_count;
 delete from school_draft.license_practice where created_at<clock_timestamp()-interval '1 day';get diagnostics practice_count=row_count;
 delete from school_draft.invites where expires_at<clock_timestamp()-interval '1 day';get diagnostics invites_count=row_count;
 delete from school_draft.sharing_events where at<clock_timestamp()-interval '180 days';get diagnostics audit_count=row_count;
 delete from school_draft.teacher_events where at<clock_timestamp()-interval '180 days';get diagnostics more=row_count;audit_count=audit_count+more;
 delete from school_draft.organization_events where at<clock_timestamp()-interval '180 days';get diagnostics more=row_count;audit_count=audit_count+more;
 delete from school_draft.license_events where at<clock_timestamp()-interval '180 days';get diagnostics more=row_count;audit_count=audit_count+more;
 delete from school_draft.join_limits where started_at<clock_timestamp()-interval '1 day';
 delete from school_draft.classes where archived_at<clock_timestamp()-interval '30 days';
 delete from school_draft.license_invoices where ends_at<clock_timestamp()-interval '180 days';
 return jsonb_build_object('assignments',assignments_count,'quizzes',quizzes_count,'samples',samples_count,'practice',practice_count,'invitations',invites_count,'audit',audit_count);
end $$;
revoke all on all functions in schema school_draft from public;
grant execute on function school_draft.license_candidates(uuid),school_draft.license_own_requests(),school_draft.license_request(uuid,boolean),school_draft.license_public_seats(),school_draft.transfer_admin(uuid,uuid),school_draft.export_actor(),school_draft.delete_actor(),school_draft.purge_expired() to harmonia_school_actor;

alter table school_draft.classes add column archived_at timestamptz;
create function school_draft.stamp_archive() returns trigger language plpgsql set search_path='' as $$
begin if new.archived is distinct from old.archived then new.archived_at=case when new.archived then clock_timestamp() else null end;end if;return new;end $$;
create trigger archive_time before update of archived on school_draft.classes for each row execute function school_draft.stamp_archive();
revoke all on function school_draft.stamp_archive() from public;
