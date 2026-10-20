-- P3.08: a link/code is the only discovery path. No name, email or contact search.
create table public.friend_invites (
 token uuid primary key,
 host_id uuid not null references auth.users(id) on delete cascade,
 guest_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 used_at timestamptz
);
create unique index friend_invite_open_host on public.friend_invites(host_id) where used_at is null;
create table public.friend_quests (
 id uuid primary key default gen_random_uuid(),
 week_start date not null check(extract(isodow from week_start)=1),
 user_a uuid not null references auth.users(id) on delete cascade,
 user_b uuid not null references auth.users(id) on delete cascade,
 target integer not null default 300 check(target=300),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 check(user_a<>user_b)
);
create table public.friend_quest_members (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 quest_id uuid not null references public.friend_quests(id) on delete cascade,
 primary key(user_id,week_start),
 unique(user_id,quest_id)
);
create table public.friend_quest_claims (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null check(extract(isodow from week_start)=1),
 primary key(user_id,week_start)
);
create table public.friend_quest_awards (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 earned_at timestamptz not null default now(),
 primary key(user_id,week_start)
);
create index friend_quest_members_quest on public.friend_quest_members(quest_id);
create index xp_ledger_friend_week on public.xp_ledger(user_id,created_at) include(amount);
alter table public.friend_invites enable row level security;
alter table public.friend_quests enable row level security;
alter table public.friend_quest_members enable row level security;
alter table public.friend_quest_claims enable row level security;
alter table public.friend_quest_awards enable row level security;
revoke all on public.friend_invites,public.friend_quests,public.friend_quest_members,public.friend_quest_claims,public.friend_quest_awards from public,anon,authenticated;
grant all on public.friend_invites,public.friend_quests,public.friend_quest_members,public.friend_quest_claims,public.friend_quest_awards to service_role;

create function public.friend_pair_active(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.friendships x join public.friendships y on y.user_id=x.friend_id and y.friend_id=x.user_id
  where x.user_id=a and x.friend_id=b and x.status='accepted' and y.status='accepted');
$$;
create function public.friend_quest_progress(quest uuid) returns jsonb language sql volatile security definer set search_path='' as $$
 select jsonb_build_object('a',coalesce((select sum(x.amount) from public.xp_ledger x where x.user_id=q.user_a and x.created_at>=q.created_at
    and x.created_at<(q.week_start+7)::timestamp at time zone 'UTC'),0),
   'b',coalesce((select sum(x.amount) from public.xp_ledger x where x.user_id=q.user_b and x.created_at>=q.created_at
    and x.created_at<(q.week_start+7)::timestamp at time zone 'UTC'),0))
 from public.friend_quests q where q.id=quest;
$$;
create function public.friend_status(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare week date:=public.league_week(clock_timestamp());q public.friend_quests;points jsonb;
begin
 select f.* into q from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
  where m.user_id=actor and m.week_start=week for update of f;
 if q.id is not null then
  points:=public.friend_quest_progress(q.id);
 end if;
 if q.id is not null and q.completed_at is null then
  if (points->>'a')::integer+(points->>'b')::integer>=q.target then
   update public.friend_quests set completed_at=clock_timestamp() where id=q.id and completed_at is null;
   insert into public.friend_quest_awards(user_id,week_start) values(q.user_a,q.week_start),(q.user_b,q.week_start) on conflict do nothing;
   select * into q from public.friend_quests where id=q.id;
  end if;
 end if;
 return jsonb_build_object(
  'invite',(select jsonb_build_object('token',i.token,'expiresAt',extract(epoch from i.expires_at)*1000)
    from public.friend_invites i where i.host_id=actor and i.used_at is null and i.expires_at>clock_timestamp() limit 1),
  'friends',coalesce((select jsonb_agg(jsonb_build_object('id',f.friend_id,'streak',coalesce(s.current,0),
    'leagueTier',coalesce(l.tier,0)) order by f.created_at,f.friend_id)
    from public.friendships f join public.friendships back on back.user_id=f.friend_id and back.friend_id=actor and back.status='accepted'
    left join public.streaks s on s.user_id=f.friend_id left join public.league_accounts l on l.user_id=f.friend_id
    where f.user_id=actor and f.status='accepted'),'[]'::jsonb),
  'blocked',coalesce((select jsonb_agg(friend_id order by created_at,friend_id) from public.friendships
    where user_id=actor and status='blocked'),'[]'::jsonb),
  'badges',(select count(*) from public.friend_quest_awards where user_id=actor),
  'questUsed',exists(select 1 from public.friend_quest_claims where user_id=actor and week_start=week),
  'quest',case when q.id is null then null else
    jsonb_build_object('id',q.id,'week',q.week_start,'friendId',case when q.user_a=actor then q.user_b else q.user_a end,
     'ownXp',case when q.user_a=actor then (points->>'a')::integer else (points->>'b')::integer end,
     'friendXp',case when q.user_a=actor then (points->>'b')::integer else (points->>'a')::integer end,
     'target',q.target,'completed',q.completed_at is not null) end);
end $$;
create function public.friend_invite_create(actor uuid,new_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if actor is null or new_token is null then raise exception 'friend_source';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 delete from public.friend_invites where host_id=actor and used_at is null and expires_at<=clock_timestamp();
 if not exists(select 1 from public.friend_invites where host_id=actor and used_at is null) then
  insert into public.friend_invites(token,host_id,expires_at) values(new_token,actor,clock_timestamp()+interval '7 days');
 end if;
 return public.friend_status(actor);
end $$;
create function public.friend_invite_accept(actor uuid,invite_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.friend_invites;
begin
 if actor is null then raise exception 'friend_missing';end if;
 select * into i from public.friend_invites where token=invite_token for update;
 if i.token is null or i.expires_at<=clock_timestamp() then raise exception 'friend_missing';end if;
 if i.used_at is not null then
  if i.guest_id=actor then return public.friend_status(actor);end if;
  raise exception 'friend_missing';
 end if;
 if i.host_id=actor then raise exception 'friend_missing';end if;
 if not pg_try_advisory_xact_lock(hashtextextended(i.host_id::text,2)) or
  not pg_try_advisory_xact_lock(hashtextextended(actor::text,2)) then raise exception 'friend_retry';end if;
 if exists(select 1 from public.friendships where ((user_id=actor and friend_id=i.host_id) or (user_id=i.host_id and friend_id=actor)) and status='blocked')
  then raise exception 'friend_missing';end if;
 if (select count(*) from public.friendships f join public.friendships b on b.user_id=f.friend_id and b.friend_id=f.user_id and b.status='accepted'
   where f.user_id in(actor,i.host_id) and f.status='accepted' group by f.user_id order by count(*) desc limit 1)>=50
  then raise exception 'friend_limit';end if;
 insert into public.friendships(user_id,friend_id,status) values(actor,i.host_id,'accepted'),(i.host_id,actor,'accepted')
 on conflict(user_id,friend_id) do update set status='accepted';
 update public.friend_invites set guest_id=actor,used_at=clock_timestamp() where token=i.token;
 return public.friend_status(actor);
end $$;
create function public.friend_remove(actor uuid,peer uuid,block_peer boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if actor is null or peer is null or actor=peer then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 if not exists(select 1 from public.friendships where user_id=actor and friend_id=peer) then raise exception 'friend_missing';end if;
 delete from public.friend_quests where (user_a=actor and user_b=peer) or (user_a=peer and user_b=actor);
 delete from public.friendships where user_id=peer and friend_id=actor and status<>'blocked';
 if block_peer then
  update public.friendships set status='blocked' where user_id=actor and friend_id=peer;
 else delete from public.friendships where user_id=actor and friend_id=peer;end if;
 return public.friend_status(actor);
end $$;
create function public.friend_unblock(actor uuid,peer uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 delete from public.friendships where user_id=actor and friend_id=peer and status='blocked';
 return public.friend_status(actor);
end $$;
create function public.friend_quest_start(actor uuid,peer uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare week date;new_quest uuid;
begin
 if actor is null or peer is null or actor=peer then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 if not public.friend_pair_active(actor,peer) then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(308,1);
 week:=public.league_week(clock_timestamp());
 if exists(select 1 from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
   where m.user_id=actor and m.week_start=week and (f.user_a=peer or f.user_b=peer)) then return public.friend_status(actor);end if;
 if exists(select 1 from public.friend_quest_claims where user_id in(actor,peer) and week_start=week)
  then raise exception 'friend_quest_active';end if;
 insert into public.friend_quests(week_start,user_a,user_b) values(week,actor,peer) returning id into new_quest;
 insert into public.friend_quest_members(user_id,week_start,quest_id) values(actor,week,new_quest),(peer,week,new_quest);
 insert into public.friend_quest_claims(user_id,week_start) values(actor,week),(peer,week);
 return public.friend_status(actor);
end $$;
create function public.credit_friend_quest() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.friend_quests;points jsonb;
begin
 select f.* into q from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
  where m.user_id=new.user_id and m.week_start=public.league_week(clock_timestamp()) and f.completed_at is null for update of f;
 if q.id is not null then
  points:=public.friend_quest_progress(q.id);
  if (points->>'a')::integer+(points->>'b')::integer>=q.target then
   update public.friend_quests set completed_at=clock_timestamp() where id=q.id;
   insert into public.friend_quest_awards(user_id,week_start) values(q.user_a,q.week_start),(q.user_b,q.week_start) on conflict do nothing;
  end if;
 end if;
 return new;
end $$;
create trigger xp_friend_quest_credit after insert on public.xp_ledger for each row execute function public.credit_friend_quest();
revoke all on function public.credit_friend_quest() from public,anon,authenticated;
create function public.retain_friend_quests() returns jsonb language plpgsql security definer set search_path='' as $$
declare quests integer;invites integer;claims integer;
begin
 delete from public.friend_quests where id in(select id from public.friend_quests where week_start<public.league_week(now())-364 order by week_start,id limit 100);
 get diagnostics quests=row_count;
 delete from public.friend_invites where token in(select token from public.friend_invites where expires_at<now()-interval '30 days' order by expires_at,token limit 100);
 get diagnostics invites=row_count;
 delete from public.friend_quest_claims where (user_id,week_start) in(select user_id,week_start from public.friend_quest_claims
  where week_start<public.league_week(now())-364 order by week_start,user_id limit 100);
 get diagnostics claims=row_count;
 return jsonb_build_object('changed',quests+invites+claims,'more',quests=100 or invites=100 or claims=100);
end $$;
revoke all on function public.friend_pair_active(uuid,uuid),public.friend_quest_progress(uuid),public.friend_status(uuid),public.friend_invite_create(uuid,uuid),public.friend_invite_accept(uuid,uuid),public.friend_remove(uuid,uuid,boolean),public.friend_unblock(uuid,uuid),public.friend_quest_start(uuid,uuid),public.retain_friend_quests() from public,anon,authenticated;
grant execute on function public.friend_pair_active(uuid,uuid),public.friend_quest_progress(uuid),public.friend_status(uuid),public.friend_invite_create(uuid,uuid),public.friend_invite_accept(uuid,uuid),public.friend_remove(uuid,uuid,boolean),public.friend_unblock(uuid,uuid),public.friend_quest_start(uuid,uuid),public.retain_friend_quests() to service_role;
