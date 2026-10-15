-- P2.22: own consent-only analytics. No provider, replay, device identifiers or backfill.
create table public.analytics_participants (
 user_id uuid primary key references auth.users(id) on delete cascade,
 consent_id uuid not null, enrolled_at timestamptz not null default now(),
 already_premium boolean not null
);
create table public.analytics_events (
 sequence bigint generated always as identity primary key,
 user_id uuid not null references analytics_participants(user_id) on delete cascade,
 dedupe_key text not null check(length(dedupe_key) between 1 and 256),
 name text not null check(name in ('app_active','onboarding_completed','lesson_started','lesson_completed','paywall_viewed','purchase_completed','tutor_question_asked','tutor_request_finished')),
 properties jsonb not null check(jsonb_typeof(properties)='object' and octet_length(properties::text)<=1024),
 occurred_at timestamptz not null default now(), unique(user_id,dedupe_key)
);
create index analytics_events_cohort on analytics_events(user_id,occurred_at,name);
create index analytics_events_retention on analytics_events(occurred_at);
alter table analytics_participants enable row level security;
alter table analytics_events enable row level security;
revoke all on analytics_participants,analytics_events from public,anon,authenticated;
grant all on analytics_participants,analytics_events to service_role;
grant usage,select on sequence analytics_events_sequence_seq to service_role;
grant select on analytics_participants,analytics_events to authenticated;
create policy analytics_participants_own on analytics_participants for select to authenticated using(user_id=auth.uid());
create policy analytics_events_own on analytics_events for select to authenticated using(user_id=auth.uid());

create or replace function public.privacy_choices(actor uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('analytics',coalesce((select granted and version='analytics-supabase-v1' from privacy_consents where user_id=actor and purpose='analytics' order by sequence desc limit 1),false),
 'push',coalesce((select granted from privacy_consents where user_id=actor and purpose='push' order by sequence desc limit 1),false),
 'marketing',coalesce((select granted from privacy_consents where user_id=actor and purpose='marketing' order by sequence desc limit 1),false));
$$;
-- P2.21's idempotent consent RPC remains the sole writer. Extend its accepted version.
create or replace function public.set_privacy_consent(actor uuid,entry jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous privacy_consents; config jsonb;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) or entry->>'purpose' not in ('analytics','push','marketing') or jsonb_typeof(entry->'granted')<>'boolean' or (entry->>'version' not in ('privacy-v1','analytics-supabase-v1') or (entry->>'purpose'<>'analytics' and entry->>'version'<>'privacy-v1')) then raise exception 'Invalid consent';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into previous from privacy_consents where user_id=actor and client_id=(entry->>'id')::uuid;
 if found then
  if previous.purpose<>entry->>'purpose' or previous.granted<>(entry->>'granted')::boolean or previous.version<>entry->>'version' or previous.locale<>entry->>'locale' then raise exception 'Consent conflict';end if;
  return privacy_choices(actor);
 end if;
 select policy into strict config from privacy_policy where id;
 if (entry->>'granted')::boolean and ((entry->>'purpose'='analytics' and not (config->>'analyticsEnabled')::boolean) or (entry->>'purpose'='marketing' and not (config->>'marketingEnabled')::boolean) or (entry->>'purpose' in ('analytics','marketing') and not (config->>'legalPublished')::boolean)) then raise exception 'Purpose unavailable';end if;
 if entry->>'purpose'='analytics' and (entry->>'granted')::boolean and entry->>'version'<>'analytics-supabase-v1' then raise exception 'Purpose unavailable';end if;
 insert into privacy_consents(user_id,client_id,purpose,granted,version,locale) values(actor,(entry->>'id')::uuid,entry->>'purpose',(entry->>'granted')::boolean,entry->>'version',entry->>'locale');
 if entry->>'purpose'='push' and not (entry->>'granted')::boolean then
  update reminder_devices set push_token=null where user_id=actor;
  update motivation_preferences set preferences=jsonb_set(preferences,'{reminderConsent}','false') where user_id=actor;
 end if;
 return privacy_choices(actor);
end $$;
create function public.analytics_consent_changed() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.purpose='analytics' then
  if not new.granted then delete from analytics_participants where user_id=new.user_id;
  elsif new.version='analytics-supabase-v1' then
   insert into analytics_participants(user_id,consent_id,already_premium)
   values(new.user_id,new.client_id,exists(select 1 from entitlements where user_id=new.user_id and active and expires_at>now()))
   on conflict(user_id) do update set consent_id=excluded.consent_id;
  end if;
 end if;
 return new;
end $$;
create trigger analytics_consent_changed after insert on privacy_consents for each row execute function analytics_consent_changed();
create function public.analytics_allowed(actor uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce((select (policy->>'analyticsEnabled')::boolean and (policy->>'legalPublished')::boolean from privacy_policy where id),false)
 and (privacy_choices(actor)->>'analytics')::boolean
 and exists(select 1 from analytics_participants where user_id=actor and enrolled_at>=now()-interval '12 months')
 and not exists(select 1 from privacy_deleted_actors where actor_hash=encode(extensions.digest(actor::text,'sha256'),'hex'));
$$;
create function public.analytics_store(actor uuid,event_key text,event_name text,details jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if not analytics_allowed(actor) then return false;end if;
 insert into analytics_events(user_id,dedupe_key,name,properties) values(actor,event_key,event_name,details) on conflict(user_id,dedupe_key) do nothing;
 return true;
end $$;
create function public.analytics_ingest(actor uuid,entry jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare item jsonb:=entry->'event'; key text; details jsonb; expected uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select consent_id into expected from analytics_participants where user_id=actor;
 if expected is null or expected is distinct from (entry->>'consentId')::uuid or not analytics_allowed(actor) then return false;end if;
 if (select count(*) from analytics_events where user_id=actor and occurred_at>now()-interval '1 minute')>=120 then return false;end if;
 if item->>'name' not in ('app_active','onboarding_completed','lesson_started','paywall_viewed') then raise exception 'Invalid analytics event';end if;
 key:=case item->>'name' when 'app_active' then 'active:'||(now() at time zone 'UTC')::date::text when 'onboarding_completed' then 'onboarding' when 'lesson_started' then 'start:'||(item->>'attemptId') else 'view:'||(entry->>'id') end;
 details:=(item-'name')||jsonb_build_object('platform',entry->>'platform','locale',entry->>'locale');
 return analytics_store(actor,key,item->>'name',details);
end $$;

-- Only newly verified evidence, never historic offline uploads or replayed rows.
create function public.analytics_learning() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if old.retained_summary is null and new.retained_summary->>'sourceKind'='lesson'
 and to_timestamp((new.event->>'finishedAt')::double precision/1000)>=(select enrolled_at from analytics_participants where user_id=new.user_id) then
  perform analytics_store(new.user_id,'complete:'||new.client_id,'lesson_completed',jsonb_build_object('attemptId',new.client_id,'lessonId',new.event->>'lessonId','contentVersion',new.event->'contentVersion','passed',new.retained_summary->'progress'->'passed'));
 end if;
 return new;
exception when others then
 -- Optional measurement must not roll back learning, a tutor request or a receipt.
 return new;
end $$;
create trigger analytics_learning after update of retained_summary on learning_events for each row execute function analytics_learning();
create function public.analytics_tutor() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if TG_OP='INSERT' then
  perform analytics_store(new.user_id,'question:'||new.id,'tutor_question_asked','{}');
 elsif old.state='reserved' and new.state<>'reserved' and new.created_at>=(select enrolled_at from analytics_participants where user_id=new.user_id) then
  perform analytics_store(new.user_id,'cost:'||new.id,'tutor_request_finished',jsonb_build_object('costNanoUsd',new.cost,'estimated',coalesce((new.usage->>'estimated')::boolean,true),'state',new.state));
 end if;
 return new;
exception when others then
 -- Optional measurement must not roll back learning, a tutor request or a receipt.
 return new;
end $$;
create trigger analytics_tutor after insert or update of state on tutor_requests for each row execute function analytics_tutor();
-- Production non-trial purchase/paid trial conversion + current provider-verified grant.
create function public.analytics_purchase() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare e jsonb:=new.payload->'event'; actor uuid;
begin
 if old.processed_at is null and new.outcome='processed' and new.processed_at is not null
 and e->>'environment'='PRODUCTION' and ((e->>'type'='INITIAL_PURCHASE' and e->>'period_type'='NORMAL') or (e->>'type'='RENEWAL' and e->>'is_trial_conversion'='true'))
 and e->>'app_user_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  actor:=(e->>'app_user_id')::uuid;
  if exists(select 1 from entitlements where user_id=actor and active and expires_at>now() and store<>'manual')
  and to_timestamp((e->>'event_timestamp_ms')::double precision/1000)>=(select enrolled_at from analytics_participants where user_id=actor) then
   perform analytics_store(actor,'purchase:'||new.event_id,'purchase_completed','{"tier":"paid"}');
  end if;
 end if;
 return new;
exception when others then
 -- Optional measurement must not roll back learning, a tutor request or a receipt.
 return new;
end $$;
create trigger analytics_purchase after update of processed_at on billing_events for each row execute function analytics_purchase();

-- Explicit service-only operation. Its scheduler remains the existing unactivated privacy template.
create function public.analytics_retention() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare removed integer;
begin
 delete from analytics_participants where user_id in(select user_id from analytics_participants where enrolled_at<now()-interval '12 months' order by enrolled_at limit 100);
 get diagnostics removed=row_count;
 return removed;
end $$;

create function public.analytics_dashboard(first_day date,last_day date,as_of date default (now() at time zone 'UTC')::date) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if first_day is null or last_day is null or as_of is null or first_day>=last_day or last_day-first_day>366 or as_of>(now() at time zone 'UTC')::date then raise exception 'Invalid analytics range';end if;
 with cohort as (
  select *, (enrolled_at at time zone 'UTC')::date as day from analytics_participants where enrolled_at>=first_day::timestamp at time zone 'UTC' and enrolled_at<last_day::timestamp at time zone 'UTC'
 ), events as (
  select *, (occurred_at at time zone 'UTC')::date as day from analytics_events where occurred_at<as_of::timestamp at time zone 'UTC'
 ), activation as (
  select count(*) as eligible,count(*) filter(where exists(select 1 from events e where e.user_id=c.user_id and e.name='lesson_completed' and e.properties->>'passed'='true' and e.day<c.day+7)) as converted from cohort c where c.day+7<=as_of
 ), conversion as (
  select count(*) as eligible,count(*) filter(where exists(select 1 from events e where e.user_id=c.user_id and e.name='purchase_completed' and e.day<c.day+30)) as converted from cohort c where not already_premium and c.day+30<=as_of
 ), retention as (
  select n,count(c.user_id) as eligible,count(c.user_id) filter(where exists(select 1 from events e where e.user_id=c.user_id and e.name='app_active' and e.day=c.day+n)) as returned
  from (values(1),(7),(30)) d(n) left join cohort c on c.day+n<as_of group by n
 ), starts as (
  select * from events where name='lesson_started' and day>=first_day and day<last_day
 ), lessons as (
  select s.properties->>'lessonId' as lesson,s.properties->'contentVersion' as version,count(*) as started,
   count(*) filter(where exists(select 1 from events e where e.user_id=s.user_id and e.name='lesson_completed' and e.properties->>'attemptId'=s.properties->>'attemptId' and e.properties->>'lessonId'=s.properties->>'lessonId' and e.properties->'contentVersion'=s.properties->'contentVersion')) as completed,
   count(*) filter(where exists(select 1 from events e where e.user_id=s.user_id and e.name='lesson_completed' and e.properties->>'attemptId'=s.properties->>'attemptId' and e.properties->>'lessonId'=s.properties->>'lessonId' and e.properties->'contentVersion'=s.properties->'contentVersion' and e.properties->>'passed'='true')) as passed
   from starts s group by s.properties->>'lessonId',s.properties->'contentVersion'
 ), costs as (
  select count(*) as requests,coalesce(sum((properties->>'costNanoUsd')::numeric),0) as nano_usd,count(*) filter(where properties->>'estimated'='true') as estimated
  from events where name='tutor_request_finished' and day>=first_day and day<last_day
 )
 select jsonb_build_object('version',1,'from',first_day,'toExclusive',last_day,'closedBefore',as_of,
 'collectionEnabled',coalesce((select (policy->>'analyticsEnabled')::boolean and (policy->>'legalPublished')::boolean from privacy_policy where id),false),
 'participants',(select count(*) from cohort),'activation',(select to_jsonb(a) from activation a),'premiumConversion',(select to_jsonb(c) from conversion c),
 'retention',(select jsonb_agg(to_jsonb(r) order by n) from retention r),'lessons',coalesce((select jsonb_agg(to_jsonb(l) order by lesson,version) from lessons l),'[]'),
 'aiCosts',(select to_jsonb(c) from costs c),
 'events',coalesce((select jsonb_object_agg(name,total) from(select name,count(*) as total from events where day>=first_day and day<last_day group by name) t),'{}')) into result;
 return result;
end $$;
revoke all on function analytics_consent_changed(),analytics_allowed(uuid),analytics_store(uuid,text,text,jsonb),analytics_ingest(uuid,jsonb),analytics_learning(),analytics_tutor(),analytics_purchase(),analytics_retention(),analytics_dashboard(date,date,date) from public,anon,authenticated;
grant execute on function analytics_allowed(uuid),analytics_store(uuid,text,text,jsonb),analytics_ingest(uuid,jsonb),analytics_retention(),analytics_dashboard(date,date,date) to service_role;
