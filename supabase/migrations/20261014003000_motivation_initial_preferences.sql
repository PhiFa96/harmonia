-- Ein neues Gerät übernimmt vorhandene Kontowünsche, während explizite Änderungen
-- weiterhin gespeichert werden. Entscheidung und monotone Marker liegen im selben Lock.
drop function public.save_motivation_preferences(uuid,jsonb,bigint,bigint);
create function public.save_motivation_preferences(actor uuid,prefs jsonb,practice bigint,reminded bigint,initialize boolean default false) returns public.motivation_preferences language plpgsql security invoker set search_path='' as $$
declare previous public.motivation_preferences; selected jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into previous from public.motivation_preferences where user_id=actor;
 selected=case when initialize and found then previous.preferences else coalesce(prefs,previous.preferences) end;
 insert into public.motivation_preferences(user_id,preferences,practiced_at,reminded_at)
 values(actor,coalesce(selected,'{"dailyGoal":20,"reminderConsent":false,"reminderTime":"18:00","locale":"en-US","timeZone":"UTC"}'::jsonb),greatest(coalesce(previous.practiced_at,0),practice),greatest(coalesce(previous.reminded_at,0),reminded))
 on conflict(user_id) do update set preferences=excluded.preferences,practiced_at=excluded.practiced_at,reminded_at=excluded.reminded_at
 returning * into previous;
 return previous;
end;
$$;
revoke all on function public.save_motivation_preferences(uuid,jsonb,bigint,bigint,boolean) from public,anon,authenticated;
grant execute on function public.save_motivation_preferences(uuid,jsonb,bigint,bigint,boolean) to service_role;
