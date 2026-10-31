-- P4.16 internal local draft only. No production billing or migration.
create function school_draft.license_operator() returns boolean language sql stable security definer set search_path='' as $$
 select school_draft.actor()='00000000-0000-4000-8000-000000000009'::uuid and exists(select 1 from school_draft.actors where id=school_draft.actor() and key='operator' and kind='staff') $$;
create function school_draft.license_eligible(o uuid,a uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.org_members where org_id=o and actor_id=a) or exists(select 1 from school_draft.class_members m join school_draft.classes c on c.id=m.class_id where c.org_id=o and not c.archived and m.actor_id=a) $$;
create table school_draft.license_invoices (
 id uuid primary key, org_id uuid not null references school_draft.organizations on delete cascade,
 organization text not null, reference text not null unique,
 seats int not null check(seats between 1 and 1000), unit_cents int not null check(unit_cents between 1 and 100000),
 total_cents int generated always as(seats*unit_cents) stored, currency text not null default 'EUR' check(currency='EUR'),
 starts_at timestamptz not null, ends_at timestamptz not null,
 state text not null default 'draft' check(state in ('draft','paid','void')),
 created_at timestamptz not null default clock_timestamp(), request jsonb not null,
 unique(id,org_id),check(ends_at>starts_at and ends_at<=starts_at+interval '366 days')
);
create table school_draft.license_seats (
 invoice_id uuid not null,org_id uuid not null,actor_id uuid not null references school_draft.actors on delete cascade,
 assigned_at timestamptz not null default clock_timestamp(),primary key(invoice_id,actor_id),
 foreign key(invoice_id,org_id) references school_draft.license_invoices(id,org_id) on delete cascade
);
create table school_draft.license_events (
 id bigint generated always as identity primary key,
 invoice_id uuid not null references school_draft.license_invoices on delete cascade,
 kind text not null check(kind in ('created','paid','void','assigned','released')),
 at timestamptz not null default clock_timestamp(),actor_id uuid not null references school_draft.actors,
 target uuid references school_draft.actors on delete set null
);
create table school_draft.license_practice (
 id uuid primary key,actor_id uuid not null references school_draft.actors on delete cascade,
 source text not null check(source in ('notes','intervals','hearing')),item jsonb not null,digest text not null,
 created_at timestamptz not null default clock_timestamp(),answer text,correct boolean,
 check((answer is null)=(correct is null))
);
create function school_draft.license_seated(i uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.license_seats s where s.invoice_id=i and s.actor_id=school_draft.actor() and school_draft.license_eligible(s.org_id,s.actor_id)) $$;
create function school_draft.license_access() returns jsonb language sql volatile security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'organization',i.organization,'endsAt',i.ends_at) order by i.ends_at desc),'[]'::jsonb)
 from school_draft.license_seats s join school_draft.license_invoices i on i.id=s.invoice_id
 where s.actor_id=school_draft.actor() and i.state='paid' and i.starts_at<=clock_timestamp() and i.ends_at>clock_timestamp() and school_draft.license_eligible(s.org_id,s.actor_id) $$;
create function school_draft.license_orgs() returns table(id uuid,label text) language plpgsql security definer set search_path='' as $$ begin
 if not school_draft.license_operator() then raise exception 'forbidden' using errcode='42501';end if;
 return query select o.id,o.label from school_draft.organizations o order by o.label,o.id;end $$;
create function school_draft.license_candidates(o uuid) returns table(id uuid,key text) language plpgsql security definer set search_path='' as $$ begin
 if not school_draft.is_admin(o) then raise exception 'forbidden' using errcode='42501';end if;
 return query select a.id,a.key from school_draft.actors a where school_draft.license_eligible(o,a.id) order by a.key;end $$;
create function school_draft.license_usage(i uuid) returns int language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from school_draft.license_invoices where id=i and (school_draft.license_operator() or school_draft.is_admin(org_id))) then raise exception 'forbidden' using errcode='42501';end if;
 return (select count(*)::int from school_draft.license_seats where invoice_id=i);end $$;
create function school_draft.license_create(i uuid,o uuid,n int,c int,d int,start_time timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
 declare old school_draft.license_invoices; requested jsonb;name text;begins timestamptz;
 begin
 if not school_draft.license_operator() then raise exception 'forbidden' using errcode='42501';end if;
 if n is null or c is null or d is null or n not between 1 and 1000 or c not between 1 and 100000 or d not in (30,90,365) then raise exception 'invalid' using errcode='22023';end if;
 select label into name from school_draft.organizations where id=o for update;
 if not found then raise exception 'forbidden' using errcode='42501';end if;
 requested=jsonb_build_object('org',o,'seats',n,'unitCents',c,'days',d,'startsAt',start_time);
 select * into old from school_draft.license_invoices where id=i;
 if found then if old.request<>requested then raise exception 'licenseConflict' using errcode='P0001';end if;return i;end if;
 begins=coalesce(start_time,clock_timestamp());
 if start_time is not null and (begins<clock_timestamp() or begins>clock_timestamp()+interval '366 days') then raise exception 'invalid' using errcode='22023';end if;
 insert into school_draft.license_invoices(id,org_id,organization,reference,seats,unit_cents,starts_at,ends_at,request)
 values(i,o,name,'PROBE-'||i::text,n,c,begins,begins+d*interval '24 hours',requested);
 insert into school_draft.license_events(invoice_id,kind,actor_id) values(i,'created',school_draft.actor());return i;
 end $$;
create function school_draft.license_transition(i uuid,next_state text) returns void language plpgsql security definer set search_path='' as $$
 declare old school_draft.license_invoices;
 begin
 if not school_draft.license_operator() then raise exception 'forbidden' using errcode='42501';end if;
 select * into old from school_draft.license_invoices where id=i for update;
 if not found then raise exception 'forbidden' using errcode='42501';end if;
 if next_state is null or next_state not in ('paid','void') then raise exception 'invalid' using errcode='22023';end if;
 if old.state=next_state then return;end if;
 if old.state='void' or (next_state='paid' and old.ends_at<=clock_timestamp()) then raise exception 'licenseState' using errcode='P0001';end if;
 update school_draft.license_invoices set state=next_state where id=i;
 insert into school_draft.license_events(invoice_id,kind,actor_id) values(i,next_state,school_draft.actor());end $$;
create function school_draft.license_assign(i uuid,a uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
 declare invoice school_draft.license_invoices;
 begin
 select * into invoice from school_draft.license_invoices where id=i for update;
 if not found or not school_draft.is_admin(invoice.org_id) then raise exception 'forbidden' using errcode='42501';end if;
 if enabled is null then raise exception 'invalid' using errcode='22023';end if;
 if enabled then
  perform 1 from school_draft.classes where org_id=invoice.org_id and not archived for share;
  perform 1 from school_draft.org_members where org_id=invoice.org_id and actor_id=a for update;
  perform 1 from school_draft.class_members m join school_draft.classes c on c.id=m.class_id where c.org_id=invoice.org_id and not c.archived and m.actor_id=a for update of m;
  if invoice.state<>'paid' or invoice.ends_at<=clock_timestamp() then raise exception 'licenseState' using errcode='P0001';end if;
  if not school_draft.license_eligible(invoice.org_id,a) then raise exception 'forbidden' using errcode='42501';end if;
  if exists(select 1 from school_draft.license_seats where invoice_id=i and actor_id=a) then return;end if;
  if (select count(*) from school_draft.license_seats where invoice_id=i)>=invoice.seats then raise exception 'licenseFull' using errcode='P0001';end if;
  insert into school_draft.license_seats(invoice_id,org_id,actor_id) values(i,invoice.org_id,a);
 else delete from school_draft.license_seats where invoice_id=i and actor_id=a;if not found then return;end if;
 end if;
 insert into school_draft.license_events(invoice_id,kind,actor_id,target) values(i,case when enabled then 'assigned' else 'released' end,school_draft.actor(),a);
 end $$;
-- Membership/archival changes invalidate seats immediately, including before a rejoin.
create function school_draft.license_cleanup() returns trigger language plpgsql security definer set search_path='' as $$ begin
 delete from school_draft.license_seats s where not school_draft.license_eligible(s.org_id,s.actor_id);return null;end $$;
create trigger license_member_cleanup after delete on school_draft.class_members for each statement execute function school_draft.license_cleanup();
create trigger license_staff_cleanup after delete on school_draft.org_members for each statement execute function school_draft.license_cleanup();
create trigger license_class_cleanup after update of archived on school_draft.classes for each statement execute function school_draft.license_cleanup();

alter table school_draft.license_invoices enable row level security;
alter table school_draft.license_seats enable row level security;
alter table school_draft.license_events enable row level security;
alter table school_draft.license_practice enable row level security;
create policy license_invoice_read on school_draft.license_invoices for select to harmonia_school_actor using(school_draft.license_operator() or school_draft.is_admin(org_id));
create policy license_seat_read on school_draft.license_seats for select to harmonia_school_actor using(school_draft.is_admin(org_id) or actor_id=school_draft.actor());
create policy license_event_read on school_draft.license_events for select to harmonia_school_actor using(exists(select 1 from school_draft.license_invoices where id=invoice_id));
create policy license_practice_read on school_draft.license_practice for select to harmonia_school_grader using(actor_id=school_draft.actor() and jsonb_array_length(school_draft.license_access())>0);
create policy license_practice_insert on school_draft.license_practice for insert to harmonia_school_grader with check(actor_id=school_draft.actor() and jsonb_array_length(school_draft.license_access())>0);
create policy license_practice_answer on school_draft.license_practice for update to harmonia_school_grader using(actor_id=school_draft.actor() and jsonb_array_length(school_draft.license_access())>0) with check(actor_id=school_draft.actor() and jsonb_array_length(school_draft.license_access())>0);
grant select on school_draft.license_invoices,school_draft.license_seats,school_draft.license_events to harmonia_school_actor;
grant select,insert on school_draft.license_practice to harmonia_school_grader;
grant update(answer,correct) on school_draft.license_practice to harmonia_school_grader;
revoke all on function school_draft.license_operator(),school_draft.license_eligible(uuid,uuid),school_draft.license_seated(uuid),school_draft.license_access(),school_draft.license_orgs(),school_draft.license_candidates(uuid),school_draft.license_usage(uuid),school_draft.license_create(uuid,uuid,int,int,int,timestamptz),school_draft.license_transition(uuid,text),school_draft.license_assign(uuid,uuid,boolean),school_draft.license_cleanup() from public;
grant execute on function school_draft.license_operator(),school_draft.license_seated(uuid),school_draft.license_access(),school_draft.license_orgs(),school_draft.license_candidates(uuid),school_draft.license_usage(uuid),school_draft.license_create(uuid,uuid,int,int,int,timestamptz),school_draft.license_transition(uuid,text),school_draft.license_assign(uuid,uuid,boolean) to harmonia_school_actor;
