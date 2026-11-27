-- Scheduled XP credit still settles quests in its original transaction.
create function public.friend_quest_settle(actor uuid) returns void language plpgsql security definer set search_path='' as $$
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
  end if;
 end if;
end $$;

create or replace function public.friend_status(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare week date:=public.league_week(clock_timestamp());q public.friend_quests;points jsonb;
begin
 select f.* into q from public.friend_quests f join public.friend_quest_members m on m.quest_id=f.id
  where m.user_id=actor and m.week_start=week;
 if q.id is not null then
  points:=public.friend_quest_progress(q.id);
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

revoke all on function public.friend_quest_settle(uuid) from public,anon,authenticated;
grant execute on function public.friend_quest_settle(uuid) to service_role;
