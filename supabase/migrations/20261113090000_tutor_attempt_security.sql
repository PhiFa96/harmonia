-- Dedicated abuse budget for answer grading; never a model reservation or answer log.
create table public.tutor_attempt_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz not null,
 requests integer not null check(requests between 1 and 30)
);
create index tutor_attempt_limits_expiry on public.tutor_attempt_limits(window_started_at);
alter table public.tutor_attempt_limits enable row level security;
revoke all on public.tutor_attempt_limits from public,anon,authenticated;
grant all on public.tutor_attempt_limits to service_role;

create function public.consume_tutor_attempt(actor uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_catalog as $$
declare bucket tutor_attempt_limits; instant timestamptz; wait_seconds integer;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then
  raise exception 'Invalid attempt actor' using errcode='22023';
 end if;
 -- Separate account lock family; all Function instances share this budget.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,3));
 select * into bucket from tutor_attempt_limits where user_id=actor for update;
 instant:=clock_timestamp();
 if bucket.user_id is null or bucket.window_started_at<=instant-interval '1 minute' then
  insert into tutor_attempt_limits(user_id,window_started_at,requests) values(actor,instant,1)
  on conflict(user_id) do update set window_started_at=excluded.window_started_at,requests=1;
  return jsonb_build_object('allowed',true,'retryAfter',0);
 end if;
 if bucket.requests>=30 then
  wait_seconds:=greatest(1,least(60,ceil(extract(epoch from(bucket.window_started_at+interval '1 minute'-instant)))::integer));
  return jsonb_build_object('allowed',false,'retryAfter',wait_seconds);
 end if;
 update tutor_attempt_limits set requests=requests+1 where user_id=actor;
 return jsonb_build_object('allowed',true,'retryAfter',0);
end $$;

create function public.retain_tutor_attempt_limits() returns jsonb
language plpgsql security definer set search_path=public,pg_catalog as $$
declare affected integer;
begin
 delete from tutor_attempt_limits where user_id in(
  select user_id from tutor_attempt_limits where window_started_at<clock_timestamp()-interval '1 day'
  order by window_started_at,user_id for update skip locked limit 100
 );
 get diagnostics affected=row_count;
 return jsonb_build_object('changed',affected,'more',affected=100);
end $$;
revoke all on function public.consume_tutor_attempt(uuid),public.retain_tutor_attempt_limits() from public,anon,authenticated;
grant execute on function public.consume_tutor_attempt(uuid),public.retain_tutor_attempt_limits() to service_role;
