create table public.reward_rules (
  version integer primary key check (version > 0),
  effective_at bigint not null check (effective_at >= 0),
  rule jsonb not null check (jsonb_typeof(rule)='object' and (rule->>'version')::integer=version and (rule->>'effectiveAt')::bigint=effective_at)
);
insert into public.reward_rules values (1,0,'{"version":1,"effectiveAt":0,"lesson":10,"repeat":5,"accuracyBonus":5,"accuracyPercent":90,"independentBonus":3,"hintWeights":[100,90,80,0],"newCoins":3,"repeatCoins":1,"freezePrice":10}');
alter table public.reward_rules enable row level security;
revoke all on public.reward_rules from public,anon,authenticated;
grant select on public.reward_rules to anon,authenticated;
grant select,insert on public.reward_rules to service_role;
create policy reward_rules_read on public.reward_rules for select to anon,authenticated using(true);

alter table public.xp_ledger drop constraint xp_ledger_amount_check;
alter table public.xp_ledger add constraint xp_ledger_amount_check check(amount between 0 and 3000);
alter table public.xp_ledger drop constraint xp_ledger_rule_version_check;
alter table public.xp_ledger add constraint xp_ledger_rule_version_fkey foreign key(rule_version) references public.reward_rules(version);
alter table public.xp_ledger add column qualified boolean not null default false;
alter table public.xp_ledger add column coins integer not null default 0 check(coins between 0 and 1000);
update public.xp_ledger set qualified=(amount>0);
with ranked as (select x.user_id,x.client_id,row_number() over(partition by x.user_id,x.lesson_id,x.content_version order by e.sequence) as n from public.xp_ledger x join public.learning_events e on x.user_id=e.user_id and x.client_id=e.client_id where x.qualified)
update public.xp_ledger x set coins=case when r.n=1 then 3 else 1 end from ranked r where x.user_id=r.user_id and x.client_id=r.client_id;

create or replace function public.append_learning_results(actor uuid, events jsonb, rewards jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare receipt jsonb; source jsonb; awarded integer; prior boolean; rule jsonb; qualified boolean; rule_version integer;
begin
  if jsonb_typeof(rewards) is distinct from 'array' or jsonb_array_length(rewards)>50 then raise exception 'Invalid rewards'; end if;
  perform public.append_learning_events(actor,events);
  for receipt in select value from jsonb_array_elements(rewards) loop
    select value into source from jsonb_array_elements(events) where value->>'id'=receipt->>'id';
    if not found or source->>'kind'<>'lesson' or not(source ? 'timeZone') then raise exception 'Missing reward evidence'; end if;
    if exists(select 1 from public.xp_ledger where user_id=actor and client_id=receipt->>'id') then continue; end if;
    rule_version:=coalesce((receipt->>'ruleVersion')::integer,1);
    select r.rule into rule from public.reward_rules r where version=rule_version;
    if not found then raise exception 'Missing reward rule'; end if;
    select exists(select 1 from public.xp_ledger where user_id=actor and lesson_id=source->>'lessonId' and content_version=(source->>'contentVersion')::integer and xp_ledger.qualified) into prior;
    awarded:=(receipt->>(case when prior then 'repeatAmount' else 'newAmount' end))::integer;
    qualified:=coalesce((receipt->>'qualified')::boolean,awarded>0);
    if awarded is null or awarded<0 or awarded>((rule->>(case when prior then 'repeat' else 'lesson' end))::integer+(rule->>'accuracyBonus')::integer+(rule->>'independentBonus')::integer) or (not qualified and awarded<>0) then raise exception 'Invalid reward amount'; end if;
    insert into public.xp_ledger(user_id,client_id,lesson_id,content_version,amount,local_date,rule_version,qualified,coins)
    values(actor,receipt->>'id',source->>'lessonId',(source->>'contentVersion')::integer,awarded,(receipt->>'date')::date,rule_version,qualified,case when qualified then (rule->>(case when prior then 'repeatCoins' else 'newCoins' end))::integer else 0 end);
  end loop;
end;
$$;
create or replace function public.learning_reward_page(actor uuid,after_sequence bigint)
returns table(sequence bigint,event jsonb,reward jsonb) language sql stable security invoker set search_path='' as $$
 select e.sequence,e.event,case when x.client_id is null then null else jsonb_build_object('amount',x.amount,'date',x.local_date,'ruleVersion',x.rule_version,'qualified',x.qualified,'coins',x.coins) end
 from public.learning_events e left join public.xp_ledger x on x.user_id=e.user_id and x.client_id=e.client_id
 where e.user_id=actor and e.sequence>after_sequence order by e.sequence limit 201;
$$;

create table public.motivation_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferences jsonb not null check(jsonb_typeof(preferences)='object'),
 practiced_at bigint not null default 0 check(practiced_at>=0),
 reminded_at bigint not null default 0 check(reminded_at>=0)
);
create table public.freeze_purchases (
 sequence bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null, purchase jsonb not null check(jsonb_typeof(purchase)='object' and purchase->>'id'=client_id::text),
 unique(user_id,client_id)
);
create table public.streaks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 current integer not null default 0 check(current>=0), longest integer not null default 0 check(longest>=current),
 last_active_date date, freezes_available integer not null default 0 check(freezes_available between 0 and 2),
 calculated_at timestamptz not null default now()
);
create table public.reminder_devices (
 device_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 revoke_hash text not null, revision bigint not null check(revision>=0),
 push_token text unique, lease_until timestamptz not null default now(), seen_at timestamptz not null default now()
);
create table public.reminder_deliveries (
 user_id uuid not null references auth.users(id) on delete cascade, local_date date not null,
 device_id uuid references public.reminder_devices(device_id) on delete set null,
 status text not null check(status in ('pending','sent','failed','skipped')),
 ticket_id text, attempted_at timestamptz not null default now(), primary key(user_id,local_date)
);
do $$ declare tbl text; begin
 for tbl in select unnest(array['motivation_preferences','freeze_purchases','streaks','reminder_devices','reminder_deliveries']) loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public,anon,authenticated',tbl);
  execute format('grant select on public.%I to authenticated',tbl);
  execute format('grant all on public.%I to service_role',tbl);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid())=user_id)',tbl||'_own',tbl);
 end loop;
end $$;
grant usage,select on sequence public.freeze_purchases_sequence_seq to service_role;

create function public.motivation_history(actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'revision',coalesce((select max(sequence)::text from public.learning_events where user_id=actor),'0')||':'||(select count(*)::text from public.freeze_purchases where user_id=actor),
 'activities',coalesce((select jsonb_agg(jsonb_build_object('id',x.client_id,'at',(e.event->>'finishedAt')::bigint,'timeZone',e.event->>'timeZone','amount',x.amount,'qualified',x.qualified,'coins',x.coins) order by (e.event->>'finishedAt')::bigint,x.client_id) from public.xp_ledger x join public.learning_events e on e.user_id=x.user_id and e.client_id=x.client_id where x.user_id=actor),'[]'::jsonb),
 'purchases',coalesce((select jsonb_agg(purchase order by sequence) from public.freeze_purchases where user_id=actor),'[]'::jsonb));
$$;
create function public.append_freeze_purchase(actor uuid,entry jsonb,expected_revision text) returns void language plpgsql security invoker set search_path='' as $$
declare previous jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select purchase into previous from public.freeze_purchases where user_id=actor and client_id=(entry->>'id')::uuid;
 if found then if previous<>entry then raise exception 'Conflicting purchase'; end if; return; end if;
 if public.motivation_history(actor)->>'revision' is distinct from expected_revision then raise exception 'History changed'; end if;
 insert into public.freeze_purchases(user_id,client_id,purchase) values(actor,(entry->>'id')::uuid,entry);
end;
$$;
create function public.register_reminder_device(actor uuid,device uuid,secret_hash text,new_revision bigint,token text) returns void language plpgsql security invoker set search_path='' as $$
declare previous public.reminder_devices;
begin
 perform pg_advisory_xact_lock(hashtextextended(device::text,1));
 select * into previous from public.reminder_devices where device_id=device;
 if found and (previous.revoke_hash<>secret_hash or previous.revision>new_revision) then raise exception 'Device changed'; end if;
 insert into public.reminder_devices(device_id,user_id,revoke_hash,revision,push_token,lease_until) values(device,actor,secret_hash,new_revision,token,now()+interval '7 days')
 on conflict(device_id) do update set user_id=actor,revision=new_revision,push_token=token,lease_until=now()+interval '7 days',seen_at=now();
end;
$$;
create function public.retire_reminder_device(device uuid,secret_hash text,new_revision bigint) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(device::text,1));
 update public.reminder_devices set push_token=null,revision=new_revision where device_id=device and revoke_hash=secret_hash and revision<=new_revision;
end;
$$;
create function public.claim_reminder_delivery(actor uuid,day date,device uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from public.reminder_deliveries where user_id=actor and attempted_at>now()-interval '23 hours') then return false; end if;
 insert into public.reminder_deliveries(user_id,local_date,device_id,status) values(actor,day,device,'pending') on conflict do nothing;
 return found;
end;
$$;
revoke all on function public.motivation_history(uuid),public.append_freeze_purchase(uuid,jsonb,text),public.register_reminder_device(uuid,uuid,text,bigint,text),public.retire_reminder_device(uuid,text,bigint),public.claim_reminder_delivery(uuid,date,uuid) from public,anon,authenticated;
grant execute on function public.motivation_history(uuid),public.append_freeze_purchase(uuid,jsonb,text),public.register_reminder_device(uuid,uuid,text,bigint,text),public.retire_reminder_device(uuid,text,bigint),public.claim_reminder_delivery(uuid,date,uuid) to service_role;
