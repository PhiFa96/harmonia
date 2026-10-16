-- Minimal relation boundary needed by P3.05; invitation/quest UI belongs to P3.08.
-- Only reciprocal acceptance counts. A pending, blocked or removed side hides the peer.
create table public.friendships (
 user_id uuid not null references auth.users(id) on delete cascade,
 friend_id uuid not null references auth.users(id) on delete cascade,
 status text not null check(status in ('pending','accepted','blocked')),
 created_at timestamptz not null default now(),
 primary key(user_id,friend_id),check(user_id<>friend_id)
);
create index friendships_peer on public.friendships(friend_id,user_id);
alter table public.friendships enable row level security;
revoke all on public.friendships from public,anon,authenticated;
grant all on public.friendships to service_role;
create or replace function public.rush_leaderboard(actor uuid,selected_mode text,selected_scope text,bank_version text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare entries jsonb; clock timestamptz:=clock_timestamp(); cutoff timestamptz;
begin
 if actor is null or selected_mode not in ('three','five','survival') or selected_scope not in ('day','week','all','friends') or bank_version !~ '^[a-f0-9]{64}$' then raise exception 'rush_source';end if;
 cutoff:=case selected_scope when 'day' then date_trunc('day',clock at time zone 'UTC') at time zone 'UTC' when 'week' then date_trunc('week',clock at time zone 'UTC') at time zone 'UTC' else '-infinity'::timestamptz end;
 with best as (
  select distinct on(user_id) user_id,score,mistakes,finished_at,id from public.rush_runs
  where state='finished' and bank=bank_version and mode=selected_mode and finished_at>=cutoff and finished_at<=clock
  and (selected_scope<>'friends' or user_id=actor or exists(
   select 1 from public.friendships a join public.friendships b on b.user_id=a.friend_id and b.friend_id=a.user_id
   where a.user_id=actor and a.friend_id=public.rush_runs.user_id and a.status='accepted' and b.status='accepted'
  ))
  order by user_id,score desc,mistakes,finished_at,id
 ), ranked as (
  select row_number() over(order by score desc,mistakes,finished_at,id) as rank,user_id,score from best
 ) select coalesce(jsonb_agg(jsonb_build_object('rank',rank,'score',score,'isYou',user_id=actor) order by rank),'[]'::jsonb) into entries
 from ranked where rank<=50 or user_id=actor;
 return jsonb_build_object('mode',selected_mode,'scope',selected_scope,'bank',bank_version,'available',true,'entries',entries);
end $$;
