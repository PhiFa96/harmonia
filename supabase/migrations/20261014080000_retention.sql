-- The original check references event and client_id. PostgreSQL can therefore
-- name it learning_events_check rather than the column-style legacy name.
alter table public.learning_events drop constraint if exists learning_events_event_check;
alter table public.learning_events drop constraint if exists learning_events_check;
alter table public.learning_events add constraint learning_events_event_check check(jsonb_typeof(event)='object' and event ? 'kind' and event ? 'id' and event->>'kind' in ('lesson','placement','retained') and event->>'id'=client_id);
alter table public.learning_events add column event_hash text;
alter table public.learning_events add column retained_summary jsonb;
alter table public.learning_events add column retained_at timestamptz;
update learning_events set event_hash=encode(extensions.digest(event::text,'sha256'),'hex');
alter table learning_events alter column event_hash set not null;
create function public.learning_event_hash() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.event_hash:=encode(extensions.digest(new.event::text,'sha256'),'hex');return new;end $$;
create trigger learning_event_hash before insert on learning_events for each row execute function learning_event_hash();
create or replace function public.append_learning_events(actor uuid,events jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare entry jsonb; previous_hash text; body_hash text;
begin
 if jsonb_typeof(events) is distinct from 'array' or jsonb_array_length(events)>50 then raise exception 'Invalid learning batch';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 for entry in select value from jsonb_array_elements(events) loop
  if entry->>'kind' not in ('lesson','placement') then raise exception 'Only raw verified uploads';end if;
  body_hash:=encode(extensions.digest(entry::text,'sha256'),'hex');
  select event_hash into previous_hash from public.learning_events where user_id=actor and client_id=entry->>'id';
  if found and previous_hash<>body_hash then raise exception 'Conflicting learning ID';end if;
  insert into public.learning_events(user_id,client_id,event,event_hash) values(actor,entry->>'id',entry,body_hash) on conflict(user_id,client_id) do nothing;
 end loop;
end $$;
create function public.append_privacy_learning_results(actor uuid,events jsonb,rewards jsonb,proofs jsonb,summaries jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare summary jsonb;
begin
 perform append_access_learning_results(actor,events,rewards,proofs);
 if jsonb_typeof(summaries) is distinct from 'array' then raise exception 'Invalid summaries';end if;
 for summary in select value from jsonb_array_elements(summaries) loop
  if summary->>'kind'<>'retained' or not exists(select 1 from jsonb_array_elements(events) e where e->>'id'=summary->>'id') then raise exception 'Invalid summary source';end if;
  update learning_events set retained_summary=coalesce(retained_summary,summary) where user_id=actor and client_id=summary->>'id';
 end loop;
end $$;
create function public.retain_learning_event(actor uuid,client_id text,expected_hash text,summary jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if summary->>'kind'<>'retained' or summary->>'id'<>client_id then raise exception 'Invalid retained summary';end if;
 update learning_events set event=coalesce(retained_summary,summary),retained_summary=null,retained_at=now()
 where user_id=actor and learning_events.client_id=retain_learning_event.client_id and event_hash=expected_hash and retained_at is null
 and received_at<now()-interval '12 months';
 return found;
end $$;
revoke all on function append_privacy_learning_results(uuid,jsonb,jsonb,jsonb,jsonb),retain_learning_event(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function append_privacy_learning_results(uuid,jsonb,jsonb,jsonb,jsonb),retain_learning_event(uuid,text,text,jsonb) to service_role;

alter table public.access_grants add column source_hash text;
update access_grants set source_hash=encode(extensions.digest(source::text,'sha256'),'hex');
alter table access_grants alter column source_hash set not null;
alter table access_grants alter column source drop not null;
create function public.access_source_hash() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.source_hash:=encode(extensions.digest(new.source::text,'sha256'),'hex');return new;end $$;
create trigger access_source_hash before insert on access_grants for each row execute function access_source_hash();
alter table cancellation_requests add column hold_until timestamptz;
alter table cancellation_requests add column hold_reason text;
create or replace function public.reserve_access(actor uuid,client_id text,source jsonb,cost integer,level integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare status jsonb; previous access_grants; reason text:='allowed';
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) or cost is null or cost not between 1 and 200 or level is null or level not between 0 and 8 or jsonb_typeof(source) is distinct from 'object' then raise exception 'Invalid access source';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 status:=access_status(actor);
 select * into previous from access_grants where user_id=actor and access_grants.client_id=reserve_access.client_id;
 if found then
   if previous.source_hash<>encode(extensions.digest(source::text,'sha256'),'hex') or previous.exercise_count<>cost then reason:='conflict';end if;
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
create function public.privacy_filter_billing(data jsonb,actor uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare key text; value jsonb; result jsonb:='{}'::jsonb;
begin
 for key,value in select * from jsonb_each(data) loop
  if key in ('app_user_id','original_app_user_id') then result:=result||jsonb_build_object(key,case when value#>>'{}'=actor::text then actor::text else 'other-account' end);
  elsif key in ('aliases','transferred_from','transferred_to') then result:=result||jsonb_build_object(key,coalesce((select jsonb_agg(x.value) from jsonb_array_elements(value) x where x.value#>>'{}'=actor::text),'[]'::jsonb));
  elsif key='event' then result:=result||jsonb_build_object(key,privacy_filter_billing(value,actor));
  else result:=result||jsonb_build_object(key,value);end if;
 end loop;return result;
end $$;
create function public.privacy_export_billing(actor uuid,after_id text) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('event_id',event_id,'provider',provider,'payload',privacy_filter_billing(payload,actor),'received_at',received_at,'processed_at',processed_at,'outcome',outcome) order by event_id),'[]'::jsonb) from (select * from billing_events where event_id>after_id and payload::text like '%'||actor::text||'%' order by event_id limit 101) x;
$$;
revoke all on function privacy_filter_billing(jsonb,uuid),privacy_export_billing(uuid,text) from public,anon,authenticated;
grant execute on function privacy_filter_billing(jsonb,uuid),privacy_export_billing(uuid,text) to service_role;
