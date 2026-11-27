-- Private, short-lived admission counters. No answer or invitation code is stored.
create table public.request_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('friends_accept','daily_puzzle_read')),
  window_started_at timestamptz not null,
  requests integer not null check (requests between 1 and 60),
  primary key (user_id, scope)
);
create index request_limits_expiry on public.request_limits(window_started_at);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from public,anon,authenticated;
grant all on public.request_limits to service_role;

create function public.consume_request_limit(actor uuid, scope text, max_requests int, window_seconds int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare bucket public.request_limits; instant timestamptz; expires timestamptz;
begin
  if actor is null or scope is null or scope not in ('friends_accept','daily_puzzle_read')
    or max_requests is null or max_requests not between 1 and 60
    or window_seconds is null or window_seconds not between 1 and 3600 then
    raise exception 'Invalid request budget' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,4));
  select r.* into bucket from public.request_limits r
    where r.user_id=actor and r.scope=consume_request_limit.scope for update;
  instant:=clock_timestamp();
  expires:=bucket.window_started_at+make_interval(secs=>window_seconds);
  if bucket.user_id is null or expires<=instant then
    insert into public.request_limits(user_id,scope,window_started_at,requests)
    values(actor,scope,instant,1)
    on conflict on constraint request_limits_pkey
    do update set window_started_at=excluded.window_started_at,requests=1;
    return jsonb_build_object('allowed',true,'retryAfter',0);
  end if;
  if bucket.requests>=max_requests then
    return jsonb_build_object('allowed',false,
      'retryAfter',greatest(1,ceil(extract(epoch from expires-instant))::integer));
  end if;
  update public.request_limits r set requests=r.requests+1
    where r.user_id=actor and r.scope=consume_request_limit.scope;
  return jsonb_build_object('allowed',true,'retryAfter',0);
end $$;

create function public.retain_request_limits() returns jsonb
language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  delete from public.request_limits where (user_id,scope) in (
    select user_id,scope from public.request_limits
    where window_started_at<clock_timestamp()-interval '1 day'
    order by window_started_at,user_id,scope for update skip locked limit 100
  );
  get diagnostics affected=row_count;
  return jsonb_build_object('changed',affected,'more',affected=100);
end $$;

create function public.friend_invite_revoke(actor uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if actor is null then raise exception 'friend_source'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
  delete from public.friend_invites where host_id=actor and used_at is null;
  return public.friend_status(actor);
end $$;

revoke all on function public.consume_request_limit(uuid,text,int,int),
  public.retain_request_limits(),public.friend_invite_revoke(uuid) from public,anon,authenticated;
grant execute on function public.consume_request_limit(uuid,text,int,int),
  public.retain_request_limits(),public.friend_invite_revoke(uuid) to service_role;
