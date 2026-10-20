-- F17 is a maximum raw-data age, independent of continued activity.
create or replace function public.retain_rush() returns jsonb language plpgsql security definer set search_path='' as $$
declare r record; affected integer; more boolean:=false; total integer:=0;
begin
 for r in select user_id,id from public.rush_runs where retained_at is null and started_at<now()-interval '12 months' order by started_at,id limit 100 loop
  if not pg_try_advisory_xact_lock(hashtextextended(r.user_id::text,0)) then continue;end if;
  -- Recheck after acquiring the same lock as answer writers.
  if exists(select 1 from public.rush_runs where id=r.id and started_at<now()-interval '12 months' and retained_at is null) then
   perform public.finish_rush(r.user_id,r.id,true);
   delete from public.rush_steps where run_id=r.id;
   update public.rush_runs set pool=null,seed=null,retained_at=clock_timestamp() where id=r.id;
   total:=total+1;
  end if;
 end loop;
 delete from public.rush_daily_usage where (user_id,day) in(select user_id,day from public.rush_daily_usage where day<(now() at time zone 'UTC')::date-366 order by day,user_id limit 100);
 get diagnostics affected=row_count;more:=total=100 or affected=100;
 return jsonb_build_object('changed',total+affected,'more',more);
end $$;
