create table public.privacy_policy (
 id boolean primary key default true check(id),policy jsonb not null
);
insert into privacy_policy values(true,'{"version":"privacy-v1","learningMonths":12,"tutorMonths":12,"reportMonths":12,"auditMonths":12,"receiptDays":30,"analyticsEnabled":false,"marketingEnabled":false,"legalPublished":false}');
create table public.privacy_consents (
 sequence bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null,purpose text not null check(purpose in ('analytics','push','marketing')),granted boolean not null,
 version text not null,locale text not null check(locale in ('de','en-US','en-GB')),received_at timestamptz not null default now(),unique(user_id,client_id)
);
create index privacy_consents_latest on privacy_consents(user_id,purpose,sequence desc);
create table public.privacy_erasure_receipts (
 id uuid primary key,owner_hash text not null,subject_id uuid,received_at timestamptz not null default now(),
 state text not null default 'processing' check(state in ('processing','deleted')),deleted_at timestamptz
);
create table public.privacy_external_erasure (
 id uuid primary key default gen_random_uuid(),receipt_id uuid not null references privacy_erasure_receipts(id),
 provider text not null check(provider in ('revenuecat','anthropic')),subject_reference text,
 state text not null default 'pending' check(state in ('pending','processing','completed','not_found')),
 created_at timestamptz not null default now(),completed_at timestamptz,proof_reference text,unique(receipt_id,provider)
);
create table public.privacy_deleted_actors (actor_hash text primary key,created_at timestamptz not null default now());
alter table privacy_policy enable row level security;
alter table privacy_consents enable row level security;
alter table privacy_erasure_receipts enable row level security;
alter table privacy_external_erasure enable row level security;
alter table privacy_deleted_actors enable row level security;
revoke all on privacy_policy,privacy_consents,privacy_erasure_receipts,privacy_external_erasure,privacy_deleted_actors from public,anon,authenticated;
grant all on privacy_policy,privacy_consents,privacy_erasure_receipts,privacy_external_erasure,privacy_deleted_actors to service_role;
grant usage,select on sequence privacy_consents_sequence_seq to service_role;
grant select on privacy_consents to authenticated;
create policy privacy_consents_own on privacy_consents for select to authenticated using(user_id=auth.uid());
create function public.privacy_choices(actor uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('analytics',coalesce((select granted from privacy_consents where user_id=actor and purpose='analytics' order by sequence desc limit 1),false),
 'push',coalesce((select granted from privacy_consents where user_id=actor and purpose='push' order by sequence desc limit 1),false),
 'marketing',coalesce((select granted from privacy_consents where user_id=actor and purpose='marketing' order by sequence desc limit 1),false));
$$;
create function public.set_privacy_consent(actor uuid,entry jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous privacy_consents; config jsonb;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) or entry->>'purpose' not in ('analytics','push','marketing') or jsonb_typeof(entry->'granted')<>'boolean' or entry->>'version'<>'privacy-v1' then raise exception 'Invalid consent';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into previous from privacy_consents where user_id=actor and client_id=(entry->>'id')::uuid;
 if found then
  if previous.purpose<>entry->>'purpose' or previous.granted<>(entry->>'granted')::boolean or previous.version<>entry->>'version' or previous.locale<>entry->>'locale' then raise exception 'Consent conflict';end if;
  return privacy_choices(actor);
 end if;
 select policy into strict config from privacy_policy where id;
 if (entry->>'granted')::boolean and ((entry->>'purpose'='analytics' and not (config->>'analyticsEnabled')::boolean) or (entry->>'purpose'='marketing' and not (config->>'marketingEnabled')::boolean) or (entry->>'purpose' in ('analytics','marketing') and not (config->>'legalPublished')::boolean)) then raise exception 'Purpose unavailable';end if;
 insert into privacy_consents(user_id,client_id,purpose,granted,version,locale) values(actor,(entry->>'id')::uuid,entry->>'purpose',(entry->>'granted')::boolean,entry->>'version',entry->>'locale');
 if entry->>'purpose'='push' and not (entry->>'granted')::boolean then
  update reminder_devices set push_token=null where user_id=actor;
  update motivation_preferences set preferences=jsonb_set(preferences,'{reminderConsent}','false') where user_id=actor;
 end if;
 return privacy_choices(actor);
end $$;
-- Keep the original receipt hash for idempotency while erasing actor references.
alter table billing_events add column payload_hash text;
update billing_events set payload_hash=encode(extensions.digest(payload::text,'sha256'),'hex');
alter table billing_events alter column payload_hash set not null;
create function public.privacy_redact_actor(data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare value jsonb; key text; result jsonb;
begin
 if jsonb_typeof(data)='string' then
  if exists(select 1 from privacy_deleted_actors where actor_hash=encode(extensions.digest(data#>>'{}','sha256'),'hex')) then return '"account-erased"'::jsonb;end if;return data;
 elsif jsonb_typeof(data)='array' then
  result:='[]';for value in select x.value from jsonb_array_elements(data) x loop result:=result||jsonb_build_array(privacy_redact_actor(value));end loop;return result;
 elsif jsonb_typeof(data)='object' then
  result:='{}';for key,value in select * from jsonb_each(data) loop result:=result||jsonb_build_object(key,privacy_redact_actor(value));end loop;return result;
 end if;return data;
end $$;
create or replace function public.billing_receive(receipt jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare id text:=receipt->'event'->>'id'; previous billing_events; body_hash text:=encode(extensions.digest(receipt::text,'sha256'),'hex');
begin
 if id is null or length(id) not between 1 and 256 or jsonb_typeof(receipt)<>'object' then raise exception 'Invalid billing receipt';end if;
 perform pg_advisory_xact_lock(hashtextextended('harmonia.billing.'||id,21900));
 select * into previous from billing_events where event_id=id;
 if found then
  if previous.payload_hash<>body_hash then return '{"state":"conflict"}'::jsonb;end if;
  if previous.processed_at is null then update billing_events set attempts=attempts+1 where event_id=id;end if;
  return jsonb_build_object('state',case when previous.processed_at is null then 'pending' else 'done' end);
 end if;
 insert into billing_events(event_id,payload,payload_hash,attempts) values(id,privacy_redact_actor(receipt),body_hash,1);
 return '{"state":"pending"}'::jsonb;
end $$;
create function public.prepare_privacy_erasure(actor uuid,request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous privacy_erasure_receipts; digest text:=encode(extensions.digest(actor::text,'sha256'),'hex');
begin
 if actor is null or request_id is null or not exists(select 1 from auth.users where id=actor) then raise exception 'Invalid erasure';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into previous from privacy_erasure_receipts where id=request_id;
 if found then if previous.owner_hash<>digest then raise exception 'Erasure conflict';end if;else
  insert into privacy_erasure_receipts(id,owner_hash,subject_id) values(request_id,digest,actor);
  insert into privacy_external_erasure(receipt_id,provider,subject_reference) values(request_id,'revenuecat',actor::text);
  if exists(select 1 from tutor_requests where user_id=actor) then insert into privacy_external_erasure(receipt_id,provider,subject_reference) values(request_id,'anthropic',actor::text);end if;
 end if;
 insert into privacy_deleted_actors(actor_hash) values(digest) on conflict do nothing;
 update billing_events set payload=privacy_redact_actor(payload) where payload::text like '%'||actor::text||'%';
 update reminder_devices set push_token=null where user_id=actor;
 return jsonb_build_object('id',request_id,'state','processing','receivedAt',(select to_char(received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from privacy_erasure_receipts where id=request_id),'externalPending',true);
end $$;
create function public.finish_privacy_erasure(request_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous privacy_erasure_receipts;
begin
 select * into strict previous from privacy_erasure_receipts where id=request_id;
 if previous.subject_id is not null and exists(select 1 from auth.users where id=previous.subject_id) then raise exception 'Account still exists';end if;
 update privacy_erasure_receipts set state='deleted',deleted_at=coalesce(deleted_at,now()),subject_id=null where id=request_id;
 return jsonb_build_object('id',request_id,'state','deleted','receivedAt',to_char(previous.received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'externalPending',exists(select 1 from privacy_external_erasure where receipt_id=request_id and state in ('pending','processing')));
end $$;
revoke all on function privacy_choices(uuid),set_privacy_consent(uuid,jsonb),privacy_redact_actor(jsonb),prepare_privacy_erasure(uuid,uuid),finish_privacy_erasure(uuid) from public,anon,authenticated;
grant execute on function privacy_choices(uuid),set_privacy_consent(uuid,jsonb),privacy_redact_actor(jsonb),prepare_privacy_erasure(uuid,uuid),finish_privacy_erasure(uuid) to service_role;
