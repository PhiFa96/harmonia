-- Geräte behalten ihre lokale Zeitzone; verzögerte Push-Tickets dürfen kein
-- inzwischen neu zugeordnetes Token löschen. Ausschließlich service_role schreibt.
alter table public.reminder_devices add column time_zone text not null default 'UTC', add column locale text not null default 'en-US' check(locale in ('de','en-US','en-GB'));
alter table public.reminder_deliveries add column push_token text, add column receipt_checked_at timestamptz;
alter table public.reminder_deliveries drop constraint reminder_deliveries_status_check;
alter table public.reminder_deliveries add constraint reminder_deliveries_status_check check(status in ('pending','sent','delivered','failed','skipped'));

create or replace function public.retire_reminder_device(device uuid,secret_hash text,new_revision bigint) returns void language plpgsql security invoker set search_path='' as $$
declare previous public.reminder_devices;
begin
 perform pg_advisory_xact_lock(hashtextextended(device::text,1));
 select * into previous from public.reminder_devices where device_id=device;
 if not found then return; end if;
 if previous.revoke_hash<>secret_hash or previous.revision>new_revision then raise exception 'Device changed'; end if;
 update public.reminder_devices set push_token=null,revision=new_revision where device_id=device;
end;
$$;

-- Monotone Praxis-/Erinnerungsmarker auch bei gleichzeitigem Sync zweier Geräte.
create function public.save_motivation_preferences(actor uuid,prefs jsonb,practice bigint,reminded bigint) returns public.motivation_preferences language plpgsql security invoker set search_path='' as $$
declare previous public.motivation_preferences;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into previous from public.motivation_preferences where user_id=actor;
 insert into public.motivation_preferences(user_id,preferences,practiced_at,reminded_at)
 values(actor,coalesce(prefs,previous.preferences,'{"dailyGoal":20,"reminderConsent":false,"reminderTime":"18:00","locale":"en-US","timeZone":"UTC"}'::jsonb),greatest(coalesce(previous.practiced_at,0),practice),greatest(coalesce(previous.reminded_at,0),reminded))
 on conflict(user_id) do update set preferences=excluded.preferences,practiced_at=excluded.practiced_at,reminded_at=excluded.reminded_at
 returning * into previous;
 return previous;
end;
$$;
revoke all on function public.save_motivation_preferences(uuid,jsonb,bigint,bigint) from public,anon,authenticated;
grant execute on function public.save_motivation_preferences(uuid,jsonb,bigint,bigint) to service_role;
