-- Ein dauerhaft ungültiges Token bleibt stillgelegt, bis das SDK ein neues liefert.
alter table public.reminder_devices add column invalid_token text;
create or replace function public.register_reminder_device(actor uuid,device uuid,secret_hash text,new_revision bigint,token text) returns void language plpgsql security invoker set search_path='' as $$
declare previous public.reminder_devices;
begin
 perform pg_advisory_xact_lock(hashtextextended(device::text,1));
 select * into previous from public.reminder_devices where device_id=device;
 if found and (previous.revoke_hash<>secret_hash or previous.revision>new_revision) then raise exception 'Device changed'; end if;
 insert into public.reminder_devices(device_id,user_id,revoke_hash,revision,push_token,lease_until,invalid_token)
 values(device,actor,secret_hash,new_revision,case when previous.invalid_token=token then null else token end,now()+interval '7 days',case when token is null or previous.invalid_token=token then previous.invalid_token else null end)
 on conflict(device_id) do update set user_id=actor,revision=new_revision,push_token=excluded.push_token,lease_until=excluded.lease_until,invalid_token=excluded.invalid_token,seen_at=now();
end;
$$;

-- Prüft den aktuellen Widerruf und heutiges Üben nochmals unter dem Kontolock,
-- bevor mehrere Jobläufe denselben Tagesversuch beanspruchen können.
create or replace function public.claim_reminder_delivery(actor uuid,day date,device uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare zone text; practice bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select d.time_zone,p.practiced_at into zone,practice from public.reminder_devices d join public.motivation_preferences p on p.user_id=d.user_id
 where d.device_id=device and d.user_id=actor and d.push_token is not null and d.lease_until>now() and p.preferences->>'reminderConsent'='true';
 if not found then return false; end if;
 if practice>0 and (to_timestamp(practice/1000.0) at time zone zone)::date=day then return false; end if;
 if exists(select 1 from public.learning_events e join public.xp_ledger x on x.user_id=e.user_id and x.client_id=e.client_id where e.user_id=actor and (to_timestamp((e.event->>'finishedAt')::bigint/1000.0) at time zone zone)::date=day) then return false; end if;
 if exists(select 1 from public.reminder_deliveries where user_id=actor and attempted_at>now()-interval '23 hours') then return false; end if;
 insert into public.reminder_deliveries(user_id,local_date,device_id,status) values(actor,day,device,'pending') on conflict do nothing;
 return found;
end;
$$;
