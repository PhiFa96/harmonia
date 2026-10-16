-- Filter before limiting: thousands of already processed, opted-out or not-yet-due
-- devices must not starve eligible league results behind the newest 1,000 rows.
create or replace function public.reminder_candidates(at_time timestamptz,batch_size integer default 1000,actors uuid[] default null)
returns table(device_id uuid,user_id uuid,push_token text,seen_at timestamptz,time_zone text,locale text)
language plpgsql stable security invoker set search_path='' as $$
begin
 if at_time is null or batch_size is null or batch_size not between 1 and 1000 or cardinality(actors)>5000 then raise exception 'Invalid reminder batch'; end if;
 return query
 select d.device_id,d.user_id,d.push_token,d.seen_at,d.time_zone,d.locale from (
  select distinct on (d0.user_id) d0.* from public.reminder_devices d0
  where d0.push_token is not null and d0.lease_until>at_time and (actors is null or d0.user_id=any(actors))
  order by d0.user_id,d0.seen_at desc,d0.device_id
 ) d join public.motivation_preferences p on p.user_id=d.user_id
 left join public.league_accounts a on a.user_id=d.user_id
 where (at_time at time zone d.time_zone)::time>=(p.preferences->>'reminderTime')::time
 and (at_time at time zone d.time_zone)::time>='08:00'::time
 and (at_time at time zone d.time_zone)::time<'21:00'::time
 and p.reminded_at<=extract(epoch from at_time-interval '23 hours')*1000
 and (public.privacy_choices(d.user_id)->>'push')='true'
 and not exists(select 1 from public.reminder_deliveries x where x.user_id=d.user_id and (x.attempted_at>at_time-interval '23 hours' or x.local_date=(at_time at time zone d.time_zone)::date))
 and ((p.preferences->>'reminderConsent'='true'
  and (p.practiced_at=0 or (to_timestamp(p.practiced_at/1000.0) at time zone d.time_zone)::date<>(at_time at time zone d.time_zone)::date)
  and not exists(select 1 from public.xp_ledger x join public.learning_events e on e.user_id=x.user_id and e.client_id=x.client_id
   where x.user_id=d.user_id and (to_timestamp((e.event->>'finishedAt')::bigint/1000.0) at time zone d.time_zone)::date=(at_time at time zone d.time_zone)::date))
 or (a.push_consent and exists(
  select 1 from public.league_members m where m.user_id=d.user_id and m.final_rank is not null
   and m.week_start>=public.league_week(at_time)-7 and m.seen_at is null and m.push_attempted_at is null
 )))
 order by d.seen_at desc,d.device_id limit batch_size;
end;
$$;
revoke all on function public.reminder_candidates(timestamptz,integer,uuid[]) from public,anon,authenticated;
grant execute on function public.reminder_candidates(timestamptz,integer,uuid[]) to service_role;
