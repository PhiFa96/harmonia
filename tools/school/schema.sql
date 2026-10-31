-- P4.13 local draft only. Deliberately NOT a Supabase migration or exposed schema.
-- The local server supplies the actor after selecting a synthetic fixture session.
create schema school_draft;
create role harmonia_school_actor nologin nosuperuser nobypassrls;
grant usage on schema school_draft to harmonia_school_actor;

create table school_draft.actors (
  id uuid primary key,
  key text unique not null,
  kind text not null check (kind in ('staff','learner'))
);
create table school_draft.organizations (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) between 1 and 80)
);
create table school_draft.org_members (
  org_id uuid references school_draft.organizations on delete cascade,
  actor_id uuid references school_draft.actors on delete cascade,
  role text not null check (role in ('admin','teacher')),
  primary key (org_id,actor_id)
);
create table school_draft.classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references school_draft.organizations on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80),
  archived boolean not null default false,
  unique (org_id,id)
);
create table school_draft.class_teachers (
  org_id uuid not null,
  class_id uuid not null,
  actor_id uuid not null,
  primary key (class_id,actor_id),
  foreign key (org_id,class_id) references school_draft.classes(org_id,id) on delete cascade,
  foreign key (org_id,actor_id) references school_draft.org_members(org_id,actor_id) on delete cascade
);
create table school_draft.class_members (
  class_id uuid references school_draft.classes on delete cascade,
  actor_id uuid references school_draft.actors on delete cascade,
  alias text not null,
  sharing boolean not null default false,
  changed_at timestamptz not null default now(),
  primary key (class_id,actor_id),
  unique (class_id,alias)
);
create table school_draft.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references school_draft.organizations on delete cascade,
  class_id uuid,
  kind text not null check (kind in ('teacher','learner')),
  code_hash text unique not null,
  issuer uuid not null references school_draft.actors,
  expires_at timestamptz not null,
  remaining integer not null check (remaining between 0 and 30),
  revoked boolean not null default false,
  check ((kind='teacher' and class_id is null) or (kind='learner' and class_id is not null)),
  foreign key (org_id,class_id) references school_draft.classes(org_id,id) on delete cascade
);
create table school_draft.sharing_events (
  id bigint generated always as identity primary key,
  class_id uuid not null,
  actor_id uuid not null,
  enabled boolean not null,
  policy text not null default 'school-draft-sharing-v1',
  at timestamptz not null default now(),
  foreign key (class_id,actor_id) references school_draft.class_members on delete cascade
);
-- Read-only, synthetic evidence. No client, teacher or learner can submit points.
create table school_draft.sample_evidence (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references school_draft.actors on delete cascade,
  area text not null check (area in ('notation','intervals','rhythm')),
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0 and correct <= total),
  completed integer not null check (completed between 0 and 20),
  at timestamptz not null default now(),
  source text not null default 'synthetic' check (source='synthetic')
);
create index on school_draft.org_members(actor_id,org_id);
create index on school_draft.class_teachers(actor_id,class_id);
create index on school_draft.class_members(actor_id,class_id);
create index on school_draft.sample_evidence(actor_id,at);

create function school_draft.actor() returns uuid language sql stable
set search_path='' as $$ select nullif(current_setting('school_draft.actor',true),'')::uuid $$;
create function school_draft.is_admin(o uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.org_members where org_id=o and actor_id=school_draft.actor() and role='admin') $$;
create function school_draft.in_org(o uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.org_members where org_id=o and actor_id=school_draft.actor()) $$;
create function school_draft.teaches(c uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.class_teachers t join school_draft.classes k on k.id=t.class_id where t.class_id=c and t.actor_id=school_draft.actor() and not k.archived) $$;
create function school_draft.enrolled(c uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from school_draft.class_members where class_id=c and actor_id=school_draft.actor()) $$;
create function school_draft.can_read_evidence(a uuid) returns boolean language sql stable security definer
set search_path='' as $$ select a=school_draft.actor() or exists(select 1 from school_draft.class_members m where m.actor_id=a and m.sharing and school_draft.teaches(m.class_id)) $$;

alter table school_draft.actors enable row level security;
alter table school_draft.organizations enable row level security;
alter table school_draft.org_members enable row level security;
alter table school_draft.classes enable row level security;
alter table school_draft.class_teachers enable row level security;
alter table school_draft.class_members enable row level security;
alter table school_draft.invites enable row level security;
alter table school_draft.sharing_events enable row level security;
alter table school_draft.sample_evidence enable row level security;
create policy self on school_draft.actors for select to harmonia_school_actor using (id=school_draft.actor());
create policy organization on school_draft.organizations for select to harmonia_school_actor using (school_draft.in_org(id));
create policy colleagues on school_draft.org_members for select to harmonia_school_actor using (actor_id=school_draft.actor() or school_draft.is_admin(org_id));
create policy own_class on school_draft.classes for select to harmonia_school_actor using (school_draft.is_admin(org_id) or school_draft.teaches(id) or school_draft.enrolled(id));
create policy teachers on school_draft.class_teachers for select to harmonia_school_actor using (actor_id=school_draft.actor() or school_draft.is_admin(org_id));
create policy roster on school_draft.class_members for select to harmonia_school_actor using (actor_id=school_draft.actor() or school_draft.teaches(class_id));
create policy evidence on school_draft.sample_evidence for select to harmonia_school_actor using (school_draft.can_read_evidence(actor_id) and at>=now()-interval '30 days');
create policy sharing_log on school_draft.sharing_events for select to harmonia_school_actor using (actor_id=school_draft.actor());
-- Invitations have no read policy. Codes/hashes never appear in a dashboard query.
grant select on all tables in schema school_draft to harmonia_school_actor;

create function school_draft.create_org(label text) returns uuid language plpgsql security definer
set search_path='' as $$
declare result uuid;
begin
  if not exists(select 1 from school_draft.actors where id=school_draft.actor() and kind='staff') then raise exception 'forbidden' using errcode='42501'; end if;
  insert into school_draft.organizations(label) values(trim(create_org.label)) returning id into result;
  insert into school_draft.org_members values(result,school_draft.actor(),'admin');
  return result;
end $$;
create function school_draft.create_class(o uuid,label text) returns uuid language plpgsql security definer
set search_path='' as $$
declare result uuid;
begin
  if not school_draft.in_org(o) then raise exception 'forbidden' using errcode='42501'; end if;
  insert into school_draft.classes(org_id,label) values(o,trim(create_class.label)) returning id into result;
  insert into school_draft.class_teachers values(o,result,school_draft.actor());
  return result;
end $$;
create function school_draft.set_teacher(c uuid,a uuid,enabled boolean) returns void language plpgsql security definer
set search_path='' as $$
declare o uuid;
begin
  select org_id into o from school_draft.classes where id=c for update;
  if not school_draft.is_admin(o) or enabled is null then raise exception 'forbidden' using errcode='42501'; end if;
  if enabled then
    insert into school_draft.class_teachers values(o,c,a) on conflict do nothing;
  else
    delete from school_draft.class_teachers where class_id=c and actor_id=a;
    update school_draft.invites set revoked=true where class_id=c and issuer=a;
  end if;
end $$;
create function school_draft.remove_teacher(o uuid,a uuid) returns void language plpgsql security definer
set search_path='' as $$
begin
  if not school_draft.is_admin(o) then raise exception 'forbidden' using errcode='42501'; end if;
  perform 1 from school_draft.organizations where id=o for update;
  if exists(select 1 from school_draft.org_members where org_id=o and actor_id=a and role='admin') then raise exception 'forbidden' using errcode='42501'; end if;
  delete from school_draft.org_members where org_id=o and actor_id=a;
  update school_draft.invites set revoked=true where org_id=o and (issuer=a or kind='teacher');
end $$;
create function school_draft.issue_invite(o uuid,c uuid,kind text,code_hash text,uses integer) returns uuid language plpgsql security definer
set search_path='' as $$
declare result uuid;
begin
  if uses is null or uses not between 1 and 30 or code_hash is null or code_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid' using errcode='22023'; end if;
  if kind='teacher' and c is null and school_draft.is_admin(o) then
    perform 1 from school_draft.organizations where id=o for update;
  elsif kind='learner' and school_draft.teaches(c) then
    perform 1 from school_draft.classes where id=c and org_id=o and not archived for update;
    if not found then raise exception 'forbidden' using errcode='42501'; end if;
  else raise exception 'forbidden' using errcode='42501'; end if;
  update school_draft.invites i set revoked=true where i.org_id=o and i.class_id is not distinct from c and i.kind=issue_invite.kind;
  insert into school_draft.invites(org_id,class_id,kind,code_hash,issuer,expires_at,remaining)
    values(o,c,kind,code_hash,school_draft.actor(),now()+interval '24 hours',uses) returning id into result;
  return result;
end $$;
create function school_draft.revoke_invites(o uuid,c uuid) returns void language plpgsql security definer
set search_path='' as $$
begin
  if not (school_draft.is_admin(o) or (school_draft.teaches(c) and exists(select 1 from school_draft.classes where id=c and org_id=o))) then raise exception 'forbidden' using errcode='42501'; end if;
  update school_draft.invites set revoked=true where org_id=o and class_id is not distinct from c;
end $$;
create function school_draft.join_code(code_hash text) returns uuid language plpgsql security definer
set search_path='' as $$
declare i school_draft.invites; k text;
begin
  select * into i from school_draft.invites v where v.code_hash=join_code.code_hash;
  if not found then raise exception 'invalidCode' using errcode='22023'; end if;
  -- Match issue/archive lock order: parent first, invitation second.
  if i.class_id is null then perform 1 from school_draft.organizations where id=i.org_id for update;
  else perform 1 from school_draft.classes where id=i.class_id for update; end if;
  select * into i from school_draft.invites v where v.code_hash=join_code.code_hash for update;
  if not found or i.revoked or i.expires_at<=now() then raise exception 'invalidCode' using errcode='22023'; end if;
  select kind into k from school_draft.actors where id=school_draft.actor();
  if i.kind='teacher' and k='staff' then
    if not exists(select 1 from school_draft.org_members where org_id=i.org_id and actor_id=i.issuer and role='admin') then raise exception 'invalidCode' using errcode='22023'; end if;
    if exists(select 1 from school_draft.org_members where org_id=i.org_id and actor_id=school_draft.actor()) then return i.org_id; end if;
    if i.remaining=0 then raise exception 'invalidCode' using errcode='22023'; end if;
    insert into school_draft.org_members values(i.org_id,school_draft.actor(),'teacher') on conflict do nothing;
  elsif i.kind='learner' and k='learner' then
    perform 1 from school_draft.classes where id=i.class_id and not archived for update;
    if not found or not exists(select 1 from school_draft.class_teachers where class_id=i.class_id and actor_id=i.issuer) then raise exception 'invalidCode' using errcode='22023'; end if;
    if exists(select 1 from school_draft.class_members where class_id=i.class_id and actor_id=school_draft.actor()) then return i.class_id; end if;
    if i.remaining=0 then raise exception 'invalidCode' using errcode='22023'; end if;
    insert into school_draft.class_members(class_id,actor_id,alias) values(i.class_id,school_draft.actor(),'P-'||right(replace(school_draft.actor()::text,'-',''),8)) on conflict (class_id,actor_id) do nothing;
  else raise exception 'invalidCode' using errcode='22023'; end if;
  if found then update school_draft.invites set remaining=remaining-1 where id=i.id; end if;
  return coalesce(i.class_id,i.org_id);
end $$;
create function school_draft.set_sharing(c uuid,enabled boolean) returns void language plpgsql security definer
set search_path='' as $$
begin
  if enabled is null then raise exception 'invalid' using errcode='22023'; end if;
  perform 1 from school_draft.classes where id=c and not archived for update;
  if not found then raise exception 'forbidden' using errcode='42501'; end if;
  update school_draft.class_members set sharing=enabled,changed_at=now() where class_id=c and actor_id=school_draft.actor() and sharing is distinct from enabled;
  if found then insert into school_draft.sharing_events(class_id,actor_id,enabled) values(c,school_draft.actor(),enabled);
  elsif not school_draft.enrolled(c) then raise exception 'forbidden' using errcode='42501'; end if;
end $$;
create function school_draft.leave_class(c uuid) returns void language plpgsql security definer
set search_path='' as $$ begin
  delete from school_draft.class_members where class_id=c and actor_id=school_draft.actor();
end $$;
create function school_draft.remove_learner(c uuid,a uuid) returns void language plpgsql security definer
set search_path='' as $$ begin
  if not school_draft.teaches(c) then raise exception 'forbidden' using errcode='42501'; end if;
  delete from school_draft.class_members where class_id=c and actor_id=a;
  update school_draft.invites set revoked=true where class_id=c;
end $$;
create function school_draft.archive_class(c uuid) returns void language plpgsql security definer
set search_path='' as $$
declare o uuid;
begin
  select org_id into o from school_draft.classes where id=c for update;
  if not (school_draft.is_admin(o) or school_draft.teaches(c)) then raise exception 'forbidden' using errcode='42501'; end if;
  update school_draft.classes set archived=true where id=c;
  update school_draft.invites set revoked=true where class_id=c;
  -- A future reactivation must never silently restore a previous sharing decision.
  insert into school_draft.sharing_events(class_id,actor_id,enabled) select c,actor_id,false from school_draft.class_members where class_id=c and sharing;
  update school_draft.class_members set sharing=false,changed_at=now() where class_id=c;
end $$;
create function school_draft.delete_class(c uuid) returns void language plpgsql security definer
set search_path='' as $$
begin
  if not exists(select 1 from school_draft.classes where id=c and school_draft.is_admin(org_id)) then raise exception 'forbidden' using errcode='42501'; end if;
  delete from school_draft.classes where id=c;
end $$;

revoke all on all functions in schema school_draft from public;
grant execute on all functions in schema school_draft to harmonia_school_actor;
revoke all on schema school_draft from public;
