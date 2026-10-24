-- Internal P4.14 only; loaded after schema.sql in a disposable local database.
-- This role is never selected by a browser: it is the server's engine writer.
create role harmonia_school_grader nologin nosuperuser nobypassrls in role harmonia_school_actor;
create table school_draft.assignments (
  id uuid primary key,
  class_id uuid not null references school_draft.classes on delete cascade,
  title text not null check(length(trim(title)) between 1 and 80),
  created_at timestamptz not null default clock_timestamp(),
  due_at timestamptz not null,
  closed_at timestamptz,
  content_version integer not null,
  task_count integer not null check(task_count between 1 and 40),
  blocks jsonb not null check(jsonb_typeof(blocks)='array'),
  unique(id,class_id),
  check(due_at>created_at and due_at<=created_at+interval '31 days')
);
create table school_draft.assignment_targets (
  assignment_id uuid not null,
  class_id uuid not null,
  actor_id uuid not null,
  primary key(assignment_id,actor_id),
  unique(assignment_id,class_id,actor_id),
  foreign key(assignment_id,class_id) references school_draft.assignments(id,class_id) on delete cascade,
  foreign key(class_id,actor_id) references school_draft.class_members on delete cascade
);
create table school_draft.assignment_material (
  assignment_id uuid primary key references school_draft.assignments on delete cascade,
  digest text not null check(digest ~ '^[a-f0-9]{64}$'),
  items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 40)
);
create table school_draft.assignment_attempts (
  assignment_id uuid not null,
  class_id uuid not null,
  actor_id uuid not null,
  answers jsonb not null default '[]' check(jsonb_typeof(answers)='array'),
  answered integer generated always as (jsonb_array_length(answers)) stored,
  correct integer not null default 0 check(correct between 0 and 40),
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  reason text check(reason in ('completed','submitted','deadline','closed')),
  primary key(assignment_id,actor_id),
  foreign key(assignment_id,class_id,actor_id) references school_draft.assignment_targets(assignment_id,class_id,actor_id) on delete cascade,
  check(correct<=answered),
  check((finished_at is null)=(reason is null))
);
create index on school_draft.assignment_targets(actor_id,assignment_id);
create index on school_draft.assignments(class_id,due_at);

-- Definers prevent policy recursion; they only answer authorization questions
-- about the server-bound actor, never return another account's private data.
create function school_draft.assignment_target(a uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.assignment_targets t join school_draft.classes c on c.id=t.class_id where t.assignment_id=a and t.actor_id=school_draft.actor() and not c.archived) $$;
create function school_draft.assignment_teacher(a uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.assignments where id=a and school_draft.teaches(class_id)) $$;
create function school_draft.assignment_result_visible(a uuid,u uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.assignments x join school_draft.class_members m on m.class_id=x.class_id and m.actor_id=u where x.id=a and m.sharing and school_draft.teaches(x.class_id)) $$;
revoke all on function school_draft.assignment_target(uuid),school_draft.assignment_teacher(uuid),school_draft.assignment_result_visible(uuid,uuid) from public;
grant execute on function school_draft.assignment_target(uuid),school_draft.assignment_teacher(uuid),school_draft.assignment_result_visible(uuid,uuid) to harmonia_school_actor;

alter table school_draft.assignments enable row level security;
alter table school_draft.assignment_targets enable row level security;
alter table school_draft.assignment_material enable row level security;
alter table school_draft.assignment_attempts enable row level security;
create policy assignment_read on school_draft.assignments for select to harmonia_school_actor using (school_draft.teaches(class_id) or school_draft.assignment_target(id));
create policy assignment_create on school_draft.assignments for insert to harmonia_school_grader with check(school_draft.teaches(class_id));
create policy assignment_close on school_draft.assignments for update to harmonia_school_grader using(school_draft.teaches(class_id)) with check(school_draft.teaches(class_id));
create policy target_read on school_draft.assignment_targets for select to harmonia_school_actor using (school_draft.assignment_teacher(assignment_id) or (actor_id=school_draft.actor() and school_draft.assignment_target(assignment_id)));
create policy target_create on school_draft.assignment_targets for insert to harmonia_school_grader with check(school_draft.assignment_teacher(assignment_id));
create policy material_read on school_draft.assignment_material for select to harmonia_school_grader using(school_draft.assignment_teacher(assignment_id) or school_draft.assignment_target(assignment_id));
create policy material_create on school_draft.assignment_material for insert to harmonia_school_grader with check(school_draft.assignment_teacher(assignment_id));
create policy attempt_read on school_draft.assignment_attempts for select to harmonia_school_actor using (
  (actor_id=school_draft.actor() and school_draft.assignment_target(assignment_id)) or
  (school_draft.assignment_result_visible(assignment_id,actor_id) and (finished_at is not null or exists(select 1 from school_draft.assignments a where a.id=assignment_id and (a.closed_at is not null or a.due_at<=now()))))
);
create policy attempt_create on school_draft.assignment_attempts for insert to harmonia_school_grader with check(actor_id=school_draft.actor() and school_draft.assignment_target(assignment_id));
create policy attempt_update on school_draft.assignment_attempts for update to harmonia_school_grader using(actor_id=school_draft.actor() and school_draft.assignment_target(assignment_id)) with check(actor_id=school_draft.actor() and school_draft.assignment_target(assignment_id));

grant select on school_draft.assignments,school_draft.assignment_targets to harmonia_school_actor;
grant select(assignment_id,class_id,actor_id,answered,correct,started_at,finished_at,reason) on school_draft.assignment_attempts to harmonia_school_actor;
grant insert on school_draft.assignments,school_draft.assignment_targets,school_draft.assignment_material,school_draft.assignment_attempts to harmonia_school_grader;
grant select on school_draft.assignment_material,school_draft.assignment_attempts to harmonia_school_grader;
grant update(closed_at) on school_draft.assignments to harmonia_school_grader;
grant update(answers,correct,finished_at,reason) on school_draft.assignment_attempts to harmonia_school_grader;

create function school_draft.assignment_class_lock(c uuid) returns void language plpgsql security definer
set search_path='' as $$ begin
  perform 1 from school_draft.classes where id=c and not archived for update;
  if not found or not(school_draft.teaches(c) or school_draft.enrolled(c)) then raise exception 'forbidden' using errcode='42501'; end if;
  perform 1 from school_draft.class_members where class_id=c and actor_id=school_draft.actor() for update;
end $$;
revoke all on function school_draft.assignment_class_lock(uuid) from public;
grant execute on function school_draft.assignment_class_lock(uuid) to harmonia_school_grader;
