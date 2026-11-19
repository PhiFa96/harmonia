-- Bound acceptance requests across Edge instances, with one expiring counter per account.
create table public.friend_invite_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz not null,
 attempts integer not null check(attempts between 1 and 20)
);
create index friend_invite_limits_expiry on public.friend_invite_limits(window_started_at,user_id);
alter table public.friend_invite_limits enable row level security;
revoke all on public.friend_invite_limits from public,anon,authenticated;
grant select on public.friend_invite_limits to service_role;

create function public.consume_friend_invite_attempt(actor uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare bucket public.friend_invite_limits;instant timestamptz;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor)
  then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 select * into bucket from public.friend_invite_limits where user_id=actor for update;
 instant:=clock_timestamp();
 if bucket.user_id is null or bucket.window_started_at<=instant-interval '1 hour' then
  insert into public.friend_invite_limits(user_id,window_started_at,attempts) values(actor,instant,1)
  on conflict(user_id) do update set window_started_at=excluded.window_started_at,attempts=1;
 elsif bucket.attempts<20 then
  update public.friend_invite_limits set attempts=attempts+1 where user_id=actor;
 else
  return greatest(1,least(3600,ceil(extract(epoch from(bucket.window_started_at+interval '1 hour'-instant)))::integer));
 end if;
 return 0;
end $$;

create function public.retain_friend_invite_limits() returns jsonb
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 delete from public.friend_invite_limits where user_id in(
  select user_id from public.friend_invite_limits where window_started_at<clock_timestamp()-interval '1 day'
  order by window_started_at,user_id limit 100 for update skip locked
 );
 get diagnostics removed=row_count;
 return jsonb_build_object('changed',removed,'more',removed=100);
end $$;

revoke all on function public.consume_friend_invite_attempt(uuid),public.retain_friend_invite_limits() from public,anon,authenticated;
grant execute on function public.consume_friend_invite_attempt(uuid),public.retain_friend_invite_limits() to service_role;

-- A stable timezone still resets at local midnight. A zone change cannot produce a rapid extra day.
create index daily_puzzle_recent_answer on public.daily_puzzle_results(user_id,answered_at)
 include(time_zone) where answered_at is not null;
create or replace function public.puzzle_answer(actor uuid,requested_day date,time_zone text,submitted_answer text,is_correct boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare prior public.daily_puzzle_results;instant timestamptz;
begin
 if actor is null or requested_day is null or time_zone is null or length(time_zone) not between 1 and 128
  or not exists(select 1 from pg_catalog.pg_timezone_names where name=time_zone) then raise exception 'puzzle_day';end if;
 if submitted_answer is null or length(submitted_answer) not between 1 and 4096 or is_correct is null then raise exception 'puzzle_answer';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,1));
 instant:=clock_timestamp();
 if (instant at time zone time_zone)::date<>requested_day then raise exception 'puzzle_day';end if;
 select * into prior from public.daily_puzzle_results where user_id=actor and day=requested_day;
 if prior.user_id is not null then
  if prior.answer<>submitted_answer then raise exception 'puzzle_conflict';end if;
  return public.puzzle_status(actor,requested_day);
 end if;
 if not exists(select 1 from public.daily_puzzles where day=requested_day) then raise exception 'puzzle_source';end if;
 if exists(select 1 from public.daily_puzzle_results r where r.user_id=actor
  and r.answered_at>instant-interval '20 hours' and r.time_zone<>puzzle_answer.time_zone)
  then raise exception 'puzzle_zone';end if;
 insert into public.daily_puzzle_results(user_id,day,answer,correct,time_zone,answered_at)
 values(actor,requested_day,submitted_answer,is_correct,time_zone,instant);
 return public.puzzle_status(actor,requested_day);
end $$;
