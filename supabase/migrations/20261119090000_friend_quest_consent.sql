-- Public app identifiers are local to a directed friendship. Internal foreign keys stay on accounts.
alter table public.friendships
 add column peer_handle uuid not null default gen_random_uuid() unique;
alter table public.friend_quests add column accepted_at timestamptz;

create table public.friend_quest_proposals (
 id uuid primary key default gen_random_uuid(),
 proposer uuid not null,
 recipient uuid not null,
 week_start date not null check(extract(isodow from week_start)=1),
 created_at timestamptz not null default clock_timestamp(),
 unique(proposer,week_start),
 foreign key(proposer,recipient) references public.friendships(user_id,friend_id) on delete cascade,
 foreign key(recipient,proposer) references public.friendships(user_id,friend_id) on delete cascade
);
create index friend_quest_proposals_recipient on public.friend_quest_proposals(recipient,week_start);
create index friend_quest_proposals_expiry on public.friend_quest_proposals(week_start,id);
alter table public.friend_quest_proposals enable row level security;
revoke all on public.friend_quest_proposals from public,anon,authenticated;
grant select on public.friend_quest_proposals to service_role;

create or replace function public.friend_status(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare week date:=public.league_week(clock_timestamp());q public.friend_quests;points jsonb;partner uuid;
begin
 select f.* into q from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
  where m.user_id=actor and m.week_start=week and f.accepted_at is not null for update of f;
 if q.id is not null then
  select peer_handle into partner from public.friendships
   where user_id=actor and friend_id=case when q.user_a=actor then q.user_b else q.user_a end;
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
  'invite',(select jsonb_build_object('token',i.token,'expiresAt',floor(extract(epoch from i.expires_at)*1000))
    from public.friend_invites i where i.host_id=actor and i.used_at is null and i.expires_at>clock_timestamp() limit 1),
  'friends',coalesce((select jsonb_agg(jsonb_build_object('id',f.peer_handle,'streak',coalesce(s.current,0),
    'leagueTier',coalesce(l.tier,0)) order by f.created_at,f.friend_id)
    from public.friendships f join public.friendships back on back.user_id=f.friend_id and back.friend_id=actor and back.status='accepted'
    left join public.streaks s on s.user_id=f.friend_id left join public.league_accounts l on l.user_id=f.friend_id
    where f.user_id=actor and f.status='accepted'),'[]'::jsonb),
  'blocked',coalesce((select jsonb_agg(peer_handle order by created_at,friend_id) from public.friendships
    where user_id=actor and status='blocked'),'[]'::jsonb),
  'badges',(select count(*) from public.friend_quest_awards where user_id=actor),
  'questUsed',exists(select 1 from public.friend_quest_claims where user_id=actor and week_start=week),
  'quest',case when partner is null then null else
    jsonb_build_object('id',q.id,'week',q.week_start,'friendId',partner,
     'ownXp',case when q.user_a=actor then (points->>'a')::integer else (points->>'b')::integer end,
     'friendXp',case when q.user_a=actor then (points->>'b')::integer else (points->>'a')::integer end,
     'target',q.target,'completed',q.completed_at is not null) end);
end $$;

-- Also accepts a previously cached account ID, restricted to the caller's own relationship.
create function public.friend_peer(actor uuid, requested_peer uuid) returns uuid language sql stable security definer set search_path='' as $$
 select f.friend_id from public.friendships f where f.user_id=actor
  and (f.peer_handle=requested_peer or f.friend_id=requested_peer)
 order by (f.peer_handle=requested_peer) desc limit 1;
$$;

create or replace function public.friend_remove(actor uuid,peer uuid,block_peer boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if actor is null or peer is null then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 peer:=public.friend_peer(actor,peer);
 if peer is null then raise exception 'friend_missing';end if;
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 delete from public.friend_quests where (user_a=actor and user_b=peer) or (user_a=peer and user_b=actor);
 delete from public.friendships where user_id=peer and friend_id=actor and status<>'blocked';
 if block_peer then
  update public.friendships set status='blocked' where user_id=actor and friend_id=peer;
 else delete from public.friendships where user_id=actor and friend_id=peer and status<>'blocked';end if;
 return public.friend_status(actor);
end $$;

create or replace function public.friend_unblock(actor uuid,peer uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 delete from public.friendships where user_id=actor and friend_id=public.friend_peer(actor,peer) and status='blocked';
 return public.friend_status(actor);
end $$;

create function public.friend_invite_revoke(actor uuid, invite_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 delete from public.friend_invites where host_id=actor and token=invite_token and used_at is null;
 return public.friend_status(actor);
end $$;

create function public.friend_quest_offers(actor uuid) returns jsonb language sql volatile security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'friendId',f.peer_handle,
   'direction',case when p.proposer=actor then 'outgoing' else 'incoming' end) order by p.created_at,p.id),'[]'::jsonb)
 from public.friend_quest_proposals p join public.friendships f on f.user_id=actor
  and f.friend_id=case when p.proposer=actor then p.recipient else p.proposer end
 where p.week_start=public.league_week(clock_timestamp()) and actor in(p.proposer,p.recipient)
  and public.friend_pair_active(p.proposer,p.recipient);
$$;

create or replace function public.friend_quest_start(actor uuid,peer uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare week date;
begin
 if actor is null or peer is null then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 peer:=public.friend_peer(actor,peer);
 if peer is null then raise exception 'friend_missing';end if;
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 if not public.friend_pair_active(actor,peer) then raise exception 'friend_missing';end if;
 week:=public.league_week(clock_timestamp());
 if exists(select 1 from public.friend_quest_claims where user_id in(actor,peer) and week_start=week)
  then raise exception 'friend_quest_active';end if;
 if exists(select 1 from public.friend_quest_proposals where proposer=actor and week_start=week and recipient<>peer)
  then raise exception 'friend_quest_pending';end if;
 insert into public.friend_quest_proposals(proposer,recipient,week_start) values(actor,peer,week)
  on conflict(proposer,week_start) do nothing;
 return public.friend_status(actor);
end $$;

create function public.friend_quest_respond(actor uuid, proposal uuid, decision text) returns jsonb language plpgsql security definer set search_path='' as $$
declare offered public.friend_quest_proposals;peer uuid;instant timestamptz;
begin
 if actor is null or proposal is null or decision is null or decision not in ('accept','decline','withdraw')
  then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 if decision='accept' and exists(select 1 from public.friend_quests q
    where q.id=proposal and q.user_b=actor and q.accepted_at is not null)
  then return public.friend_status(actor);end if;
 select * into offered from public.friend_quest_proposals p where p.id=proposal
  and case when decision='withdraw' then p.proposer=actor else p.recipient=actor end;
 if offered.id is null then
  if decision='accept' then raise exception 'friend_missing';end if;
  return public.friend_status(actor);
 end if;
 peer:=case when decision='withdraw' then offered.recipient else offered.proposer end;
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 instant:=clock_timestamp();
 if offered.week_start<>public.league_week(instant) or not public.friend_pair_active(actor,peer)
  then raise exception 'friend_missing';end if;
 if decision='accept' then
  if exists(select 1 from public.friend_quest_claims c where c.user_id in(actor,peer) and c.week_start=offered.week_start)
    then raise exception 'friend_quest_active';end if;
  insert into public.friend_quests(id,week_start,user_a,user_b,created_at,accepted_at)
   values(offered.id,offered.week_start,peer,actor,instant,instant);
  insert into public.friend_quest_members(user_id,week_start,quest_id)
   values(peer,offered.week_start,offered.id),(actor,offered.week_start,offered.id);
  insert into public.friend_quest_claims(user_id,week_start) values(peer,offered.week_start),(actor,offered.week_start);
  delete from public.friend_quest_proposals where week_start=offered.week_start
   and (proposer in(actor,peer) or recipient in(actor,peer));
 else
  delete from public.friend_quest_proposals where id=offered.id;
 end if;
 return public.friend_status(actor);
end $$;

create or replace function public.credit_friend_quest() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.friend_quests;points jsonb;
begin
 select f.* into q from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
  where m.user_id=new.user_id and m.week_start=public.league_week(clock_timestamp())
    and f.accepted_at is not null and f.completed_at is null for update of f;
 if q.id is not null then
  points:=public.friend_quest_progress(q.id);
  if (points->>'a')::integer+(points->>'b')::integer>=q.target then
   update public.friend_quests set completed_at=clock_timestamp() where id=q.id;
   insert into public.friend_quest_awards(user_id,week_start) values(q.user_a,q.week_start),(q.user_b,q.week_start) on conflict do nothing;
  end if;
 end if;
 return new;
end $$;

create or replace function public.retain_friend_quests() returns jsonb language plpgsql security definer set search_path='' as $$
declare quests integer;invites integer;claims integer;proposals integer;week date:=public.league_week(now());
begin
 delete from public.friend_quests where id in(select id from public.friend_quests where week_start<week-364 order by week_start,id limit 100);
 get diagnostics quests=row_count;
 delete from public.friend_invites where token in(select token from public.friend_invites where expires_at<now()-interval '30 days' order by expires_at,token limit 100);
 get diagnostics invites=row_count;
 delete from public.friend_quest_claims where (user_id,week_start) in(select user_id,week_start from public.friend_quest_claims
  where week_start<week-364 order by week_start,user_id limit 100);
 get diagnostics claims=row_count;
 delete from public.friend_quest_proposals where id in(select id from public.friend_quest_proposals
  where week_start<week order by week_start,id limit 100);
 get diagnostics proposals=row_count;
 return jsonb_build_object('changed',quests+invites+claims+proposals,'more',quests=100 or invites=100 or claims=100 or proposals=100);
end $$;

revoke all on function public.friend_peer(uuid,uuid),public.friend_invite_revoke(uuid,uuid),
 public.friend_quest_offers(uuid),public.friend_quest_respond(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.friend_invite_revoke(uuid,uuid),public.friend_quest_offers(uuid),
 public.friend_quest_respond(uuid,uuid,text) to service_role;
