-- P3.06: only the authenticated Edge function may create or score duels.
create table public.duel_ratings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 rating double precision not null default 1500 check(rating between -1000000 and 1000000),
 deviation double precision not null default 350 check(deviation>0 and deviation<=350),
 volatility double precision not null default 0.06 check(volatility>0 and volatility<=10),
 matches integer not null default 0 check(matches>=0),
 updated_at timestamptz not null default now()
);
create table public.duel_policy (
 id boolean primary key default true check(id),
 policy jsonb not null default '{"version":1,"winXp":10,"lossXp":3,"dailyXpCap":50}'
 check(jsonb_typeof(policy)='object' and (policy->>'version')::int=1 and
  (policy->>'winXp')::int between 0 and 50 and (policy->>'lossXp')::int between 0 and 50 and
  (policy->>'dailyXpCap')::int between 0 and 200)
);
insert into public.duel_policy(id) values(true);
create table public.duel_games (
 id uuid primary key,
 kind text not null check(kind in ('live','friend','ghost')),
 bank text not null check(bank ~ '^[a-f0-9]{64}$'),
 seed uuid,
 pool jsonb check(pool is null or (jsonb_typeof(pool)='array' and jsonb_array_length(pool) between 1 and 256)),
 policy jsonb not null,
 starts_at timestamptz not null,
 deadline timestamptz not null,
 state text not null default 'active' check(state in ('active','finished')),
 winner_id uuid references auth.users(id) on delete set null,
 ghost_run_id uuid references public.rush_runs(id) on delete set null,
 ghost_score integer check(ghost_score>=0),
 finished_at timestamptz,
 created_at timestamptz not null default now(),
 check((kind='ghost')=(ghost_score is not null)),
 check((state='active' and finished_at is null and seed is not null and pool is not null) or (state='finished' and finished_at is not null))
);
create index duel_games_expiry on public.duel_games(deadline) where state='active';
create table public.duel_players (
 game_id uuid not null references public.duel_games(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ordinal integer not null default 0 check(ordinal>=0),
 correct integer not null default 0 check(correct>=0),
 mistakes integer not null default 0 check(mistakes>=0),
 score integer not null default 0 check(score>=0),
 last_at timestamptz not null,
 active boolean not null default true,
 rating_before double precision,
 rating_after double precision,
 outcome text check(outcome in ('win','loss','draw')),
 primary key(game_id,user_id),
 check(ordinal=correct+mistakes)
);
create unique index duel_one_active on public.duel_players(user_id) where active;
create table public.duel_steps (
 sequence bigint generated always as identity unique,
 game_id uuid not null,
 user_id uuid not null,
 ordinal integer not null check(ordinal>=0),
 answer text not null check(length(answer) between 1 and 4096),
 correct boolean not null,
 points integer not null check(points between 0 and 50),
 received_at timestamptz not null,
 primary key(game_id,user_id,ordinal),
 foreign key(game_id,user_id) references public.duel_players(game_id,user_id) on delete cascade
);
create table public.duel_queue (
 user_id uuid primary key references auth.users(id) on delete cascade,
 bank text not null check(bank ~ '^[a-f0-9]{64}$'),
 joined_at timestamptz not null default now()
);
create index duel_queue_search on public.duel_queue(bank,joined_at);
create table public.duel_invites (
 token uuid primary key,
 host_id uuid not null references auth.users(id) on delete cascade,
 bank text not null check(bank ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 guest_id uuid references auth.users(id) on delete set null,
 game_id uuid references public.duel_games(id) on delete set null
);
create unique index duel_invite_open_host on public.duel_invites(host_id) where game_id is null;

-- Live wins/losses use the existing canonical XP ledger, without inventing lessons or streak days.
do $$ declare c record;begin
 for c in select conname from pg_constraint where conrelid='public.xp_ledger'::regclass and contype='c' and pg_get_constraintdef(oid) like '%source_kind%' loop
  execute format('alter table public.xp_ledger drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.xp_ledger add column duel_game_id uuid references public.duel_games(id) on delete cascade;
alter table public.xp_ledger add constraint xp_ledger_duel_source_kind check(source_kind in ('lesson','rush','duel'));
alter table public.xp_ledger add constraint xp_ledger_duel_source check(
 (source_kind='lesson' and learning_client_id=client_id and learning_client_id is not null and lesson_id is not null and rush_run_id is null and duel_game_id is null)
 or (source_kind='rush' and learning_client_id is null and lesson_id is null and rush_run_id is not null and duel_game_id is null and client_id='rush:'||rush_run_id::text and not qualified and coins=0)
 or (source_kind='duel' and learning_client_id is null and lesson_id is null and rush_run_id is null and duel_game_id is not null and client_id='duel:'||duel_game_id::text and not qualified and coins=0));

-- A user's own status is the recovery path after a lost response or network gap.
create function public.duel_status(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.duel_games; p public.duel_players; q public.duel_queue; i public.duel_invites; rival jsonb; ghost jsonb;
begin
 select d.* into g from public.duel_games d join public.duel_players x on x.game_id=d.id where x.user_id=actor and d.state='active' order by d.created_at desc,d.id desc limit 1;
 if g.id is not null then
  select * into p from public.duel_players where game_id=g.id and user_id=actor;
  if g.kind='ghost' then
   select jsonb_build_object('index',count(*),'score',coalesce(sum(s.points),0)) into ghost
   from public.rush_steps s join public.rush_runs r on r.id=s.run_id
   where r.id=g.ghost_run_id and s.received_at-r.started_at<=least(clock_timestamp()-g.starts_at,interval '3 minutes');
   rival:=coalesce(ghost,jsonb_build_object('index',0,'score',0));
  else
   select jsonb_build_object('index',x.ordinal,'score',x.score) into rival from public.duel_players x where x.game_id=g.id and x.user_id<>actor;
  end if;
  return jsonb_build_object('phase','game','game',to_jsonb(g),'player',to_jsonb(p),'rival',coalesce(rival,jsonb_build_object('index',0,'score',0)));
 end if;
 select * into i from public.duel_invites where host_id=actor and game_id is null and expires_at>clock_timestamp() order by created_at desc limit 1;
 if i.token is not null then return jsonb_build_object('phase','invite','token',i.token,'expiresAt',extract(epoch from i.expires_at)*1000);end if;
 select * into q from public.duel_queue where user_id=actor;
 if q.user_id is not null then return jsonb_build_object('phase','queue','joinedAt',extract(epoch from q.joined_at)*1000);end if;
 select d.* into g from public.duel_games d join public.duel_players x on x.game_id=d.id where x.user_id=actor order by d.created_at desc,d.id desc limit 1;
 if g.id is not null then
  select * into p from public.duel_players where game_id=g.id and user_id=actor;
  if g.kind='ghost' then rival:=jsonb_build_object('index',0,'score',g.ghost_score);
  else select jsonb_build_object('index',x.ordinal,'score',x.score) into rival from public.duel_players x where x.game_id=g.id and x.user_id<>actor;end if;
  return jsonb_build_object('phase','game','game',to_jsonb(g),'player',to_jsonb(p),'rival',coalesce(rival,jsonb_build_object('index',0,'score',0)));
 end if;
 return jsonb_build_object('phase','idle');
end $$;

create function public.duel_find(actor uuid,bank_version text,task_pool jsonb,rules jsonb,server_seed uuid,new_game uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.duel_queue; peer public.duel_queue; clock timestamptz:=clock_timestamp(); own_rating double precision; ghost public.rush_runs;
begin
 if actor is null or bank_version !~ '^[a-f0-9]{64}$' or jsonb_typeof(task_pool) is distinct from 'array' or jsonb_array_length(task_pool) not between 1 and 256 or server_seed is null or new_game is null then raise exception 'duel_source';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from public.duel_players where user_id=actor and active) then return public.duel_status(actor);end if;
 if exists(select 1 from public.duel_invites where host_id=actor and game_id is null and expires_at>clock) then raise exception 'duel_active';end if;
 insert into public.duel_queue(user_id,bank) values(actor,bank_version) on conflict(user_id) do nothing;
 select * into q from public.duel_queue where user_id=actor for update;
 if q.bank<>bank_version then update public.duel_queue set bank=bank_version,joined_at=clock where user_id=actor;select * into q from public.duel_queue where user_id=actor;end if;
 select rating into own_rating from public.duel_ratings where user_id=actor;own_rating:=coalesce(own_rating,1500);
 select x.* into peer from public.duel_queue x left join public.duel_ratings r on r.user_id=x.user_id
 where x.user_id<>actor and x.bank=bank_version and abs(coalesce(r.rating,1500)-own_rating)<=150+20*extract(epoch from clock-least(q.joined_at,x.joined_at))
 order by abs(coalesce(r.rating,1500)-own_rating),x.joined_at,x.user_id limit 1 for update of x skip locked;
 if peer.user_id is not null and pg_try_advisory_xact_lock(hashtextextended(peer.user_id::text,0)) then
  if not exists(select 1 from public.duel_players where user_id=peer.user_id and active) then
   insert into public.duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline) values(new_game,'live',bank_version,server_seed,task_pool,rules,clock+interval '8 seconds',clock+interval '188 seconds');
   insert into public.duel_players(game_id,user_id,last_at) values(new_game,actor,clock+interval '8 seconds'),(new_game,peer.user_id,clock+interval '8 seconds');
   delete from public.duel_queue where user_id in(actor,peer.user_id);
   return public.duel_status(actor);
  end if;
 end if;
 -- A real verified Rush run may stand in after ten seconds; never invent a bot.
 if clock-q.joined_at>=interval '10 seconds' then
  select r.* into ghost from public.rush_runs r left join public.duel_ratings d on d.user_id=r.user_id
  where r.state='finished' and r.mode='three' and r.bank=bank_version and r.seed is not null and r.pool is not null and r.retained_at is null
   and r.user_id<>actor and r.started_at>clock-interval '30 days' and abs(coalesce(d.rating,1500)-own_rating)<=400
  order by abs(coalesce(d.rating,1500)-own_rating),r.finished_at desc limit 1;
  if ghost.id is not null then
   insert into public.duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline,ghost_run_id,ghost_score)
   values(new_game,'ghost',ghost.bank,ghost.seed,ghost.pool,ghost.policy,clock+interval '8 seconds',clock+interval '188 seconds',ghost.id,ghost.score);
   insert into public.duel_players(game_id,user_id,last_at) values(new_game,actor,clock+interval '8 seconds');
   delete from public.duel_queue where user_id=actor;
   return public.duel_status(actor);
  end if;
 end if;
 return public.duel_status(actor);
end $$;

create function public.duel_invite_create(actor uuid,bank_version text,token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare clock timestamptz:=clock_timestamp();
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if token is null or bank_version !~ '^[a-f0-9]{64}$' then raise exception 'duel_source';end if;
 if exists(select 1 from public.duel_players where user_id=actor and active) or exists(select 1 from public.duel_queue where user_id=actor) then raise exception 'duel_active';end if;
 delete from public.duel_invites where host_id=actor and game_id is null and expires_at<=clock;
 if exists(select 1 from public.duel_invites where host_id=actor and game_id is null) then return public.duel_status(actor);end if;
 insert into public.duel_invites(token,host_id,bank,expires_at) values(token,actor,bank_version,clock+interval '10 minutes')
 on conflict on constraint duel_invites_pkey do nothing;
 if not found then raise exception 'duel_conflict';end if;
 return public.duel_status(actor);
end $$;
create function public.duel_invite_accept(actor uuid,token uuid,bank_version text,task_pool jsonb,rules jsonb,server_seed uuid,new_game uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.duel_invites;clock timestamptz:=clock_timestamp();
begin
 select * into i from public.duel_invites where duel_invites.token=duel_invite_accept.token for update;
 if i.token is null or i.expires_at<=clock then raise exception 'duel_missing';end if;
 if i.game_id is not null then
  if i.guest_id=actor then return public.duel_status(actor);end if;
  raise exception 'duel_conflict';
 end if;
 if i.host_id=actor or i.bank<>bank_version or server_seed is null or new_game is null or jsonb_typeof(task_pool) is distinct from 'array' or jsonb_array_length(task_pool) not between 1 and 256 then raise exception 'duel_source';end if;
 -- Try locks while holding only the invitation. Failure is retried instead of deadlocking.
 if not pg_try_advisory_xact_lock(hashtextextended(i.host_id::text,0)) or not pg_try_advisory_xact_lock(hashtextextended(actor::text,0)) then raise exception 'duel_retry';end if;
 if exists(select 1 from public.duel_players where user_id in(i.host_id,actor) and active) or exists(select 1 from public.duel_queue where user_id in(i.host_id,actor)) then raise exception 'duel_active';end if;
 insert into public.duel_games(id,kind,bank,seed,pool,policy,starts_at,deadline) values(new_game,'friend',bank_version,server_seed,task_pool,rules,clock+interval '8 seconds',clock+interval '188 seconds');
 insert into public.duel_players(game_id,user_id,last_at) values(new_game,i.host_id,clock+interval '8 seconds'),(new_game,actor,clock+interval '8 seconds');
 update public.duel_invites set guest_id=actor,game_id=new_game where duel_invites.token=i.token;
 return public.duel_status(actor);
end $$;
create function public.duel_cancel(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 delete from public.duel_queue where user_id=actor;
 delete from public.duel_invites where host_id=actor and game_id is null;
 return public.duel_status(actor);
end $$;

create function public.duel_answer(actor uuid,game uuid,expected_index integer,submitted_answer text,is_correct boolean,points integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.duel_games;p public.duel_players;prior public.duel_steps;clock timestamptz:=clock_timestamp();
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into g from public.duel_games where id=game for update;
 select * into p from public.duel_players where game_id=game and user_id=actor for update;
 if p.user_id is null then raise exception 'duel_missing';end if;
 select * into prior from public.duel_steps where game_id=game and user_id=actor and ordinal=expected_index;
 if prior.game_id is not null then
  if prior.answer<>submitted_answer then raise exception 'duel_conflict';end if;
  return public.duel_status(actor);
 end if;
 if g.state<>'active' or clock<g.starts_at or clock>=g.deadline or expected_index<>p.ordinal then raise exception 'duel_conflict';end if;
 if p.mistakes>=3 then raise exception 'duel_conflict';end if;
 if extract(epoch from clock-p.last_at)*1000<(g.policy->>'minAnswerMs')::int then raise exception 'duel_fast';end if;
 if submitted_answer is null or length(submitted_answer) not between 1 and 4096 or is_correct is null or points is null or (is_correct and points not between 10 and 50) or (not is_correct and points<>0) then raise exception 'duel_answer';end if;
 insert into public.duel_steps(game_id,user_id,ordinal,answer,correct,points,received_at) values(game,actor,expected_index,submitted_answer,is_correct,points,clock);
 update public.duel_players set ordinal=ordinal+1,correct=correct+is_correct::int,mistakes=mistakes+(not is_correct)::int,score=score+points,last_at=clock where game_id=game and user_id=actor;
 return public.duel_status(actor);
end $$;
create function public.duel_settlement_snapshot(game uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select case when g.id is null then null else jsonb_build_object('game',to_jsonb(g),'players',
  coalesce((select jsonb_agg(jsonb_build_object('userId',p.user_id,'score',p.score,'rating',coalesce(r.rating,1500),'deviation',coalesce(r.deviation,350),'volatility',coalesce(r.volatility,0.06),'matches',coalesce(r.matches,0)) order by p.user_id)
   from public.duel_players p left join public.duel_ratings r on r.user_id=p.user_id where p.game_id=g.id),'[]'::jsonb)) end from public.duel_games g where g.id=game;
$$;
create function public.duel_settle(game uuid,updated jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare g public.duel_games;p record;entry jsonb;top_score integer;winner uuid;reward jsonb;
begin
 select * into g from public.duel_games where id=game for update;
 if g.id is null then raise exception 'duel_missing';end if;
 if g.state='finished' then return false;end if;
 if clock_timestamp()<g.deadline then raise exception 'duel_early';end if;
 if g.kind='live' and (jsonb_typeof(updated) is distinct from 'array' or jsonb_array_length(updated)<>
    (select case when count(*)=2 then 2 else 0 end from public.duel_players where game_id=game)) then raise exception 'duel_rating';end if;
 if g.kind<>'live' and updated<>'[]'::jsonb then raise exception 'duel_rating';end if;
 select max(score) into top_score from public.duel_players where game_id=game;
 if g.kind='ghost' then top_score:=greatest(top_score,g.ghost_score);end if;
 if g.kind='ghost' and g.ghost_score=top_score then winner:=null;
 else
  select user_id into winner from public.duel_players where game_id=game and score=top_score;
  if (select count(*) from public.duel_players where game_id=game and score=top_score)>1 then winner:=null;end if;
 end if;
 if g.kind='live' and jsonb_array_length(updated)=2 then
  for p in select * from public.duel_players where game_id=game order by user_id loop
   select x.value into entry from jsonb_array_elements(updated) as x(value) where x.value->>'userId'=p.user_id::text;
   if entry is null or not public.rating_state_valid(entry-'userId') or (entry->>'attempts')::int<>coalesce((select matches from public.duel_ratings where user_id=p.user_id),0)+1 then raise exception 'duel_rating';end if;
   update public.duel_players set rating_before=coalesce((select rating from public.duel_ratings where user_id=p.user_id),1500),rating_after=(entry->>'rating')::double precision where game_id=game and user_id=p.user_id;
   insert into public.duel_ratings(user_id,rating,deviation,volatility,matches,updated_at)
   values(p.user_id,(entry->>'rating')::double precision,(entry->>'deviation')::double precision,(entry->>'volatility')::double precision,(entry->>'attempts')::int,clock_timestamp())
   on conflict(user_id) do update set rating=excluded.rating,deviation=excluded.deviation,volatility=excluded.volatility,matches=excluded.matches,updated_at=excluded.updated_at;
  end loop;
 end if;
 update public.duel_players set active=false,
  outcome=case when g.kind='ghost' then case when score>g.ghost_score then 'win' when score<g.ghost_score then 'loss' else 'draw' end
   when winner is null then 'draw' when user_id=winner then 'win' else 'loss' end where game_id=game;
 if g.kind='live' then
  select policy into strict reward from public.duel_policy where id=true;
  insert into public.xp_ledger(user_id,client_id,lesson_id,content_version,amount,local_date,source_kind,duel_game_id)
  select dp.user_id,'duel:'||game::text,null,1,greatest(0,least((reward->>case when dp.outcome='win' then 'winXp' else 'lossXp' end)::int,
   (reward->>'dailyXpCap')::int-coalesce((select sum(x.amount) from public.xp_ledger x where x.user_id=dp.user_id and x.source_kind='duel' and x.local_date=(g.deadline at time zone 'UTC')::date),0))),
   (g.deadline at time zone 'UTC')::date,'duel',game from public.duel_players dp where dp.game_id=game
  on conflict do nothing;
 end if;
 update public.duel_games set state='finished',finished_at=deadline,winner_id=winner where id=game;
 return true;
end $$;

create function public.duel_expired(batch_size integer default 100) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(id order by deadline,id),'[]'::jsonb) from (select id,deadline from public.duel_games where state='active' and deadline<=clock_timestamp() order by deadline,id limit least(greatest(batch_size,1),100)) x;
$$;
create function public.retain_duels() returns jsonb language plpgsql security definer set search_path='' as $$
declare steps integer; games integer; invites integer; stale integer; stale_ids uuid[];
begin
 -- Privacy fallback when the optional settlement job has been absent for a year.
 -- Preserve points/outcomes, but never invent an unverified late rating or XP booking.
 select array_agg(id) into stale_ids from (select id from public.duel_games where state='active' and created_at<now()-interval '12 months' order by created_at,id limit 100 for update skip locked) x;
 update public.duel_players p set active=false,outcome=case
  when g.kind='ghost' then case when p.score>g.ghost_score then 'win' when p.score<g.ghost_score then 'loss' else 'draw' end
  when p.score>coalesce((select max(r.score) from public.duel_players r where r.game_id=p.game_id and r.user_id<>p.user_id),-1) then 'win'
  when p.score<coalesce((select max(r.score) from public.duel_players r where r.game_id=p.game_id and r.user_id<>p.user_id),-1) then 'loss'
  else 'draw' end
 from public.duel_games g where p.game_id=g.id and g.id=any(stale_ids);
 update public.duel_games set state='finished',finished_at=deadline where id=any(stale_ids);
 get diagnostics stale=row_count;
 delete from public.duel_steps where (game_id,user_id,ordinal) in(select s.game_id,s.user_id,s.ordinal from public.duel_steps s join public.duel_games g on g.id=s.game_id where g.created_at<now()-interval '12 months' order by g.created_at,s.game_id,s.user_id,s.ordinal limit 500);
 get diagnostics steps=row_count;
 update public.duel_games set pool=null,seed=null,ghost_run_id=null where id in(select id from public.duel_games where state='finished' and created_at<now()-interval '12 months' and pool is not null order by created_at,id limit 100);
 get diagnostics games=row_count;
 delete from public.duel_invites where token in(select token from public.duel_invites where expires_at<now()-interval '30 days' order by expires_at limit 100);
 get diagnostics invites=row_count;
 return jsonb_build_object('changed',stale+steps+games+invites,'more',stale=100 or steps=500 or games=100 or invites=100);
end $$;
create function public.duel_remove_orphan() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.duel_players where game_id=old.game_id) then delete from public.duel_games where id=old.game_id;end if;
 return old;
end $$;
create trigger duel_remove_orphan after delete on public.duel_players for each row execute function public.duel_remove_orphan();

do $$ declare name text;begin
 foreach name in array array['duel_policy','duel_ratings','duel_games','duel_players','duel_steps','duel_queue','duel_invites'] loop
  execute format('alter table public.%I enable row level security',name);
  execute format('revoke all on public.%I from public,anon,authenticated',name);
  execute format('grant all on public.%I to service_role',name);
 end loop;
end $$;
grant usage,select on sequence public.duel_steps_sequence_seq to service_role;
-- Private Broadcast topics: only active participants can join/send. Broadcast is a UI hint; server scores remain authoritative.
create function public.duel_channel_member(topic text) returns boolean language sql stable security definer set search_path='' as $$
 select topic ~ '^duel:[0-9a-f-]{36}$' and exists(select 1 from public.duel_players p join public.duel_games g on g.id=p.game_id where p.user_id=(select auth.uid()) and p.game_id::text=substring(topic from 6) and g.state='active');
$$;
grant execute on function public.duel_channel_member(text) to authenticated;
create policy duel_broadcast_read on realtime.messages for select to authenticated using(public.duel_channel_member(realtime.topic()));
create policy duel_broadcast_write on realtime.messages for insert to authenticated with check(public.duel_channel_member(realtime.topic()));
revoke all on function public.duel_status(uuid),public.duel_find(uuid,text,jsonb,jsonb,uuid,uuid),public.duel_invite_create(uuid,text,uuid),public.duel_invite_accept(uuid,uuid,text,jsonb,jsonb,uuid,uuid),public.duel_cancel(uuid),public.duel_answer(uuid,uuid,integer,text,boolean,integer),public.duel_settlement_snapshot(uuid),public.duel_settle(uuid,jsonb),public.duel_expired(integer),public.retain_duels() from public,anon,authenticated;
grant execute on function public.duel_status(uuid),public.duel_find(uuid,text,jsonb,jsonb,uuid,uuid),public.duel_invite_create(uuid,text,uuid),public.duel_invite_accept(uuid,uuid,text,jsonb,jsonb,uuid,uuid),public.duel_cancel(uuid),public.duel_answer(uuid,uuid,integer,text,boolean,integer),public.duel_settlement_snapshot(uuid),public.duel_settle(uuid,jsonb),public.duel_expired(integer),public.retain_duels() to service_role;

create or replace function public.motivation_history(actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'revision',coalesce((select max(sequence)::text from public.learning_events where user_id=actor),'0')||':'||(select count(*)::text from public.freeze_purchases where user_id=actor)
  ||case when exists(select 1 from public.xp_ledger where user_id=actor and source_kind='rush') then ':rush:'||(select count(*)::text from public.xp_ledger where user_id=actor and source_kind='rush') else '' end
  ||case when exists(select 1 from public.xp_ledger where user_id=actor and source_kind='duel') then ':duel:'||(select count(*)::text from public.xp_ledger where user_id=actor and source_kind='duel') else '' end,
 'activities',coalesce((select jsonb_agg(jsonb_build_object('id',x.client_id,'at',coalesce((e.event->>'finishedAt')::bigint,(extract(epoch from coalesce(r.finished_at,d.finished_at))*1000)::bigint),'timeZone',coalesce(e.event->>'timeZone','UTC'),'amount',x.amount,'qualified',x.qualified,'coins',x.coins)
  order by coalesce((e.event->>'finishedAt')::bigint,(extract(epoch from coalesce(r.finished_at,d.finished_at))*1000)::bigint),x.client_id)
  from public.xp_ledger x left join public.learning_events e on e.user_id=x.user_id and e.client_id=x.learning_client_id
  left join public.rush_runs r on r.user_id=x.user_id and r.id=x.rush_run_id
  left join public.duel_games d on d.id=x.duel_game_id where x.user_id=actor),'[]'::jsonb),
 'purchases',coalesce((select jsonb_agg(purchase order by sequence) from public.freeze_purchases where user_id=actor),'[]'::jsonb));
$$;
