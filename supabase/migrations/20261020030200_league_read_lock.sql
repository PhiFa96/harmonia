-- P3.04 Fachprüfung Befund 6: learner_league (für jedes angemeldete Konto per RPC aufrufbar)
-- hielt die globale Ligasperre schon beim reinen Lesen und konnte so alle XP-Buchungen
-- verzögern. finalize_league nimmt dieselbe Sperre selbst, sobald tatsächlich eine alte
-- Gruppe abzuschließen ist; der Leseweg bleibt sperrfrei.
create or replace function public.learner_league() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); week date; c public.league_cohorts; result jsonb; roster jsonb; old uuid; tier integer; consent boolean;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required'; end if;
 week:=public.league_week(clock_timestamp());
 for old in select m.cohort_id from public.league_members m join public.league_cohorts c0 on c0.id=m.cohort_id
 where m.user_id=actor and m.week_start<week and c0.closed_at is null order by m.week_start loop
  perform public.finalize_league(old,clock_timestamp());
 end loop;
 select a.tier,a.push_consent into tier,consent from public.league_accounts a where user_id=actor;
 select c0.* into c from public.league_cohorts c0 join public.league_members m on m.cohort_id=c0.id where m.user_id=actor and m.week_start=week;
 if found then
  select jsonb_agg(jsonb_build_object('slot',slot,'rank',rank,'xp',xp,'isYou',user_id=actor) order by rank) into roster from (
   select user_id,slot,xp,row_number() over(order by xp desc,joined_at,slot) rank from public.league_members where cohort_id=c.id
  ) ranked;
 end if;
 select jsonb_build_object('weekStart',m.week_start,'tier',c0.tier,'rank',m.final_rank,'xp',m.xp,'outcome',m.outcome,'nextTier',m.next_tier,'seen',m.seen_at is not null) into result
 from public.league_members m join public.league_cohorts c0 on c0.id=m.cohort_id
 where m.user_id=actor and m.final_rank is not null order by m.week_start desc limit 1;
 return jsonb_build_object('weekStart',week,'weekEnd',week+7,'tier',coalesce(tier,0),'pushConsent',coalesce(consent,false),
 'cohort',case when c.id is null then null else jsonb_build_object('capacity',c.capacity,'movement',c.movement,'entries',roster) end,'result',result);
end;
$$;
