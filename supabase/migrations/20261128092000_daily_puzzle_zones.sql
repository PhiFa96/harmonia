create table public.daily_puzzle_zones (
  user_id uuid primary key references auth.users(id) on delete cascade,
  time_zone text not null check (length(time_zone) between 1 and 128),
  changed_at timestamptz not null
);
create index daily_puzzle_zones_expiry on public.daily_puzzle_zones(changed_at);
alter table public.daily_puzzle_zones enable row level security;
revoke all on public.daily_puzzle_zones from public,anon,authenticated;
grant all on public.daily_puzzle_zones to service_role;

insert into public.daily_puzzle_zones(user_id,time_zone,changed_at)
select distinct on (user_id) user_id,time_zone,answered_at from public.daily_puzzle_results
where time_zone is not null and answered_at is not null
order by user_id,answered_at desc,day desc;

create function public.puzzle_request_zone(actor uuid, requested_zone text) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists (
    select 1 from public.daily_puzzle_zones
    where user_id=actor and time_zone<>requested_zone and changed_at>now()-interval '20 hours'
  );
$$;

create or replace function public.puzzle_answer(
  actor uuid, requested_day date, time_zone text, submitted_answer text, is_correct boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare prior public.daily_puzzle_results; instant timestamptz;
begin
  if actor is null or time_zone is null or length(time_zone) not between 1 and 128 then
    raise exception 'puzzle_day';
  end if;
  if submitted_answer is null or length(submitted_answer) not between 1 and 4096 or is_correct is null then
    raise exception 'puzzle_answer';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,1));
  instant:=clock_timestamp();
  if exists (
    select 1 from public.daily_puzzle_zones z
    where z.user_id=actor and z.time_zone<>puzzle_answer.time_zone
      and z.changed_at>instant-interval '20 hours'
  ) then raise exception 'puzzle_zone'; end if;
  if (instant at time zone time_zone)::date<>requested_day then raise exception 'puzzle_day'; end if;
  select * into prior from public.daily_puzzle_results where user_id=actor and day=requested_day;
  if prior.user_id is not null then
    if prior.answer<>submitted_answer then raise exception 'puzzle_conflict'; end if;
    return public.puzzle_status(actor,requested_day);
  end if;
  if not exists(select 1 from public.daily_puzzles where day=requested_day) then
    raise exception 'puzzle_source';
  end if;
  insert into public.daily_puzzle_results(user_id,day,answer,correct,time_zone,answered_at)
  values(actor,requested_day,submitted_answer,is_correct,time_zone,instant);
  insert into public.daily_puzzle_zones as z(user_id,time_zone,changed_at)
  values(actor,time_zone,instant)
  on conflict(user_id) do update set time_zone=excluded.time_zone,changed_at=excluded.changed_at
  where z.time_zone<>excluded.time_zone;
  return public.puzzle_status(actor,requested_day);
end $$;

create function public.retain_daily_puzzle_zones() returns jsonb
language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  delete from public.daily_puzzle_zones where user_id in (
    select user_id from public.daily_puzzle_zones where changed_at<clock_timestamp()-interval '12 months'
    order by changed_at,user_id for update skip locked limit 100
  );
  get diagnostics affected=row_count;
  return jsonb_build_object('changed',affected,'more',affected=100);
end $$;

revoke all on function public.puzzle_request_zone(uuid,text),
  public.retain_daily_puzzle_zones() from public,anon,authenticated;
grant execute on function public.puzzle_request_zone(uuid,text),
  public.retain_daily_puzzle_zones() to service_role;
