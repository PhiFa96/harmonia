-- P3.06 Fachprüfung Befund 4: Live-Duelle vergeben XP nur bei Mindestbeteiligung.
-- Wer keine einzige richtige Antwort gegeben hat, erhält weder Sieg- noch Trost-XP
-- (ein Unentschieden ohne Antworten brachte beiden lossXp). Gewertet wird weiter nach
-- Punkten; Rating und Paarung bleiben unverändert (siehe docs/plan/duelle.md).
create or replace function public.duel_settle(game uuid,updated jsonb) returns boolean language plpgsql security definer set search_path='' as $$
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
   (g.deadline at time zone 'UTC')::date,'duel',game from public.duel_players dp where dp.game_id=game and dp.correct>=1
  on conflict do nothing;
 end if;
 update public.duel_games set state='finished',finished_at=deadline,winner_id=winner where id=game;
 return true;
end $$;
