create table public.access_policy (
  id boolean primary key default true check(id),revision bigint not null default 1 check(revision>0),
  policy jsonb not null,updated_at timestamptz not null default now()
);
insert into public.access_policy(policy) values('{"version":1,"model":"energy","energyCapacity":30,"energyRefillSeconds":600,"freeMaxLevel":2,"checkoutEnabled":false,"adsPrepared":true,"adsEnabled":false}');
create function public.access_policy_revision() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin if new.policy is distinct from old.policy then new.revision:=old.revision+1;new.updated_at:=now();else new.revision:=old.revision;end if;return new;end $$;
create trigger access_policy_revision before update on public.access_policy for each row execute function public.access_policy_revision();
create table public.access_grants (
  user_id uuid not null references auth.users(id) on delete cascade,client_id text not null check(length(client_id) between 1 and 256),
  source jsonb not null,exercise_count integer not null check(exercise_count between 1 and 200),
  tier text not null check(tier in ('free','premium','max')),day date not null default (now() at time zone 'UTC')::date,created_at timestamptz not null default now(),
  primary key(user_id,client_id)
);
create index access_grants_daily on public.access_grants(user_id,day);
alter table public.access_policy enable row level security;
alter table public.access_grants enable row level security;
revoke all on public.access_policy,public.access_grants from public,anon,authenticated;
grant all on public.access_policy,public.access_grants to service_role;
create table public.access_energy (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance integer not null check(balance>=0),refilled_at timestamptz not null,revision bigint not null
);
alter table public.access_energy enable row level security;
revoke all on public.access_energy from public,anon,authenticated;
grant all on public.access_energy to service_role;
create function public.access_status(actor uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare config access_policy; tier text; energy access_energy; capacity integer; seconds integer; ticks integer; clock timestamptz:=now();
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'Invalid actor';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into strict config from access_policy where id;
 capacity:=(config.policy->>'energyCapacity')::integer; seconds:=(config.policy->>'energyRefillSeconds')::integer;
 if capacity not between 20 and 1000 or seconds not between 60 and 86400 then raise exception 'Invalid energy policy';end if;
 select case when exists(select 1 from entitlements where user_id=actor and entitlement='max' and active and expires_at>clock) then 'max'
 when exists(select 1 from entitlements where user_id=actor and entitlement='premium' and active and expires_at>clock) then 'premium' else 'free' end into tier;
 insert into access_energy values(actor,capacity,clock,config.revision) on conflict do nothing;
 select * into strict energy from access_energy where user_id=actor;
 if energy.revision<>config.revision then
  energy.balance:=least(capacity,energy.balance);energy.refilled_at:=greatest(clock,energy.refilled_at);energy.revision:=config.revision;
 else
  ticks:=floor(greatest(0,extract(epoch from clock-energy.refilled_at))/seconds)::integer;
  energy.balance:=least(capacity,energy.balance+ticks);
  energy.refilled_at:=case when energy.balance=capacity then greatest(clock,energy.refilled_at) else energy.refilled_at+make_interval(secs=>ticks*seconds) end;
 end if;
 update access_energy set balance=energy.balance,refilled_at=energy.refilled_at,revision=energy.revision where user_id=actor;
 return jsonb_build_object('revision',config.revision,'policy',config.policy,'tier',tier,
 'resetAt',to_char((energy.refilled_at+make_interval(secs=>seconds)) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'fullAt',to_char((energy.refilled_at+make_interval(secs=>(capacity-energy.balance)*seconds)) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'used',capacity-energy.balance,'remaining',case when tier='free' then energy.balance else null end);
end $$;
create function public.reserve_access(actor uuid,client_id text,source jsonb,cost integer,level integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare status jsonb; previous access_grants; reason text:='allowed';
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) or cost is null or cost not between 1 and 200 or level is null or level not between 0 and 8 or jsonb_typeof(source) is distinct from 'object' then raise exception 'Invalid access source';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 status:=access_status(actor);
 select * into previous from access_grants where user_id=actor and access_grants.client_id=reserve_access.client_id;
 if found then
   if previous.source<>source or previous.exercise_count<>cost then reason:='conflict';end if;
 else
   if status->>'tier'='free' and level>(status->'policy'->>'freeMaxLevel')::integer then reason:='premium';
   elsif status->>'tier'='free' and status->>'remaining' is not null and cost>(status->>'remaining')::integer then reason:='limit';end if;
   if reason='allowed' then
    if status->>'tier'='free' then update access_energy set balance=balance-cost where user_id=actor;end if;
    insert into access_grants(user_id,client_id,source,exercise_count,tier) values(actor,client_id,source,cost,status->>'tier');
   end if;
 end if;
 return jsonb_build_object('allowed',reason='allowed','reason',reason,'status',access_status(actor),'id',client_id,'cost',cost);
end $$;
-- Legacy/offline imports get charged atomically too; a forged old timestamp never bypasses quota.
create function public.append_access_learning_results(actor uuid,events jsonb,rewards jsonb,proofs jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare proof jsonb; granted jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if jsonb_typeof(proofs) is distinct from 'array' then raise exception 'Invalid proofs';end if;
 for proof in select value from jsonb_array_elements(proofs) loop
  perform 1 from learning_events where user_id=actor and learning_events.client_id=proof->>'id';
  if not found then
   granted:=reserve_access(actor,proof->>'id',proof->'source',(proof->>'cost')::integer,(proof->>'level')::integer);
   if granted->>'reason'='conflict' then raise exception 'Access conflict';end if;
   if not (granted->>'allowed')::boolean then raise exception 'Access %',granted->>'reason';end if;
  end if;
 end loop;
 perform append_learning_results(actor,events,rewards);
end $$;
revoke all on function public.access_status(uuid),public.reserve_access(uuid,text,jsonb,integer,integer),public.append_access_learning_results(uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.access_status(uuid),public.reserve_access(uuid,text,jsonb,integer,integer),public.append_access_learning_results(uuid,jsonb,jsonb,jsonb) to service_role;
