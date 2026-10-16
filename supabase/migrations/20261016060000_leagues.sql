-- P3.04: immutable weekly results; only canonical XP inserts can enter a league.
create table public.league_rules (
 id boolean primary key default true check(id),
 capacity smallint not null default 30 check(capacity between 10 and 100),
 movement smallint not null default 5 check(movement between 1 and 10 and movement*2<=capacity)
);
insert into public.league_rules(id) values(true);
create table public.league_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 tier smallint not null default 0 check(tier between 0 and 6),
 push_consent boolean not null default false
);
create table public.league_cohorts (
 id uuid primary key default gen_random_uuid(),
 week_start date not null check(extract(isodow from week_start)=1),
 tier smallint not null check(tier between 0 and 6),
 capacity smallint not null check(capacity between 10 and 100),
 movement smallint not null check(movement between 1 and 10 and movement*2<=capacity),
 closed_at timestamptz,
 unique(id,week_start)
);
create index league_cohorts_week on public.league_cohorts(week_start,tier) where closed_at is null;
create table public.league_members (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 cohort_id uuid not null,
 slot smallint not null check(slot between 1 and 100),
 xp bigint not null check(xp>0),
 joined_at timestamptz not null,
 final_rank smallint,
 outcome text check(outcome in ('promoted','stayed','relegated')),
 next_tier smallint check(next_tier between 0 and 6),
 seen_at timestamptz,
 push_attempted_at timestamptz,
 primary key(user_id,week_start),
 unique(cohort_id,slot),
 foreign key(cohort_id,week_start) references public.league_cohorts(id,week_start) on delete cascade,
 check((final_rank is null and outcome is null and next_tier is null) or (final_rank>0 and outcome is not null and next_tier is not null))
);
create index league_members_cohort on public.league_members(cohort_id,xp desc,joined_at,slot);
create index league_members_results on public.league_members(user_id,week_start desc) where final_rank is not null;
-- Direct reads reveal only one's own membership; leaderboard RPCs omit user IDs,
-- profile names, global handles, timestamps and device information.
alter table public.league_rules enable row level security;
alter table public.league_cohorts enable row level security;
alter table public.league_accounts enable row level security;
alter table public.league_members enable row level security;
revoke all on public.league_rules,public.league_cohorts,public.league_accounts,public.league_members from public,anon,authenticated;
grant all on public.league_rules,public.league_cohorts,public.league_accounts,public.league_members to service_role;
grant select on public.league_accounts,public.league_members to authenticated;
create policy league_accounts_own on public.league_accounts for select to authenticated using((select auth.uid())=user_id);
create policy league_members_own on public.league_members for select to authenticated using((select auth.uid())=user_id);

create function public.league_week(at_time timestamptz) returns date language sql immutable strict set search_path='' as $$
 select date_trunc('week',at_time at time zone 'UTC')::date;
$$;
-- All credit, admission and closure share one short transaction lock. No account
-- advisory lock is acquired here: append_learning_results already holds one.
create function public.finalize_league(cohort uuid,at_time timestamptz) returns boolean language plpgsql security invoker set search_path='' as $$
declare c public.league_cohorts;
begin
 perform pg_advisory_xact_lock(304,1);
 select * into c from public.league_cohorts where id=cohort for update;
 if not found or c.closed_at is not null or c.week_start+7>public.league_week(at_time) then return false; end if;
 with ranked as (
  select user_id,row_number() over(order by xp desc,joined_at,slot)::smallint r,
   count(*) over()::integer n from public.league_members where cohort_id=cohort
 ), results as (
  select user_id,r,case when r<=least(c.movement,n/2) and c.tier<6 then 'promoted'
   when r>n-least(c.movement,n/2) and c.tier>0 then 'relegated' else 'stayed' end outcome from ranked
 )
 update public.league_members m set final_rank=r.r,outcome=r.outcome,
  next_tier=c.tier+case r.outcome when 'promoted' then 1 when 'relegated' then -1 else 0 end
 from results r where m.cohort_id=cohort and m.user_id=r.user_id;
 update public.league_accounts a set tier=m.next_tier from public.league_members m
 where m.cohort_id=cohort and m.user_id=a.user_id;
 update public.league_cohorts set closed_at=at_time where id=cohort;
 return true;
end;
$$;
create function public.credit_league(actor uuid,points integer,at_time timestamptz) returns void language plpgsql security invoker set search_path='' as $$
declare week date; previous uuid; c public.league_cohorts; selected_tier smallint; position smallint; rule public.league_rules;
begin
 if points<=0 then return; end if;
 if points is null or points>3000 or at_time is null then raise exception 'Invalid league credit'; end if;
 perform pg_advisory_xact_lock(304,1);
 week:=public.league_week(at_time);
 insert into public.league_accounts(user_id) values(actor) on conflict do nothing;
 -- Catch up the previous cohort before admitting a returning member, even when
 -- the scheduled job was delayed. Inactive accounts never enter a new cohort.
 for previous in select m.cohort_id from public.league_members m join public.league_cohorts c0 on c0.id=m.cohort_id
  where m.user_id=actor and m.week_start<week and c0.closed_at is null order by m.week_start loop
  perform public.finalize_league(previous,at_time);
 end loop;
 if exists(select 1 from public.league_members where user_id=actor and week_start=week) then
  if exists(select 1 from public.league_members m join public.league_cohorts c0 on c0.id=m.cohort_id where m.user_id=actor and m.week_start=week and c0.closed_at is not null) then raise exception 'League already closed'; end if;
  update public.league_members set xp=xp+points where user_id=actor and week_start=week;
  return;
 end if;
 select tier into selected_tier from public.league_accounts where user_id=actor;
 select c0.* into c from public.league_cohorts c0 where c0.week_start=week and c0.tier=selected_tier and c0.closed_at is null
  and (select count(*) from public.league_members m where m.cohort_id=c0.id)<c0.capacity order by c0.id limit 1;
 if not found then
  select * into strict rule from public.league_rules where id;
  insert into public.league_cohorts(week_start,tier,capacity,movement) values(week,selected_tier,rule.capacity,rule.movement) returning * into c;
 end if;
 select min(s)::smallint into position from generate_series(1,c.capacity) s where not exists(select 1 from public.league_members m where m.cohort_id=c.id and m.slot=s);
 insert into public.league_members(user_id,week_start,cohort_id,slot,xp,joined_at) values(actor,week,c.id,position,points,at_time);
end;
$$;
create function public.xp_league_credit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 -- Take the week from the clock AFTER acquiring the lock. A transaction that
 -- waits across Monday cannot reopen last week's result. Never trust client dates.
 if new.amount>0 then
  perform pg_advisory_xact_lock(304,1);
  perform public.credit_league(new.user_id,new.amount,clock_timestamp());
 end if;
 return new;
end;
$$;
create trigger xp_league_credit after insert on public.xp_ledger for each row execute function public.xp_league_credit();

create function public.close_league_weeks(at_time timestamptz default now(),batch_size integer default 100) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c uuid; closed integer:=0; remaining boolean;
begin
 if at_time is null or batch_size is null or batch_size not between 1 and 500 then raise exception 'Invalid league batch'; end if;
 perform pg_advisory_xact_lock(304,1);
 for c in select id from public.league_cohorts where closed_at is null and week_start<public.league_week(at_time) order by week_start,id limit batch_size loop
  if public.finalize_league(c,at_time) then closed:=closed+1; end if;
 end loop;
 select exists(select 1 from public.league_cohorts where closed_at is null and week_start<public.league_week(at_time)) into remaining;
 -- A rolling year of social results; current tier survives pruning. Account
 -- erasure cascades immediately, including result/notification markers.
 delete from public.league_cohorts where week_start<public.league_week(at_time)-364 and closed_at is not null;
 return jsonb_build_object('closed',closed,'remaining',remaining);
end;
$$;
create function public.learner_league() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); week date; c public.league_cohorts; result jsonb; roster jsonb; old uuid; tier integer; consent boolean;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required'; end if;
 perform pg_advisory_xact_lock(304,1);
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
create function public.set_league_result_consent(enabled boolean) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or enabled is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required'; end if;
 insert into public.league_accounts(user_id,push_consent) values(actor,enabled) on conflict(user_id) do update set push_consent=excluded.push_consent;
 return enabled;
end;
$$;
create function public.ack_league_result(week date) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Account required'; end if;
 update public.league_members set seen_at=coalesce(seen_at,now()) where user_id=auth.uid() and week_start=week and final_rank is not null;
end;
$$;
revoke all on function public.league_week(timestamptz),public.finalize_league(uuid,timestamptz),public.credit_league(uuid,integer,timestamptz),public.xp_league_credit(),public.close_league_weeks(timestamptz,integer),public.learner_league(),public.set_league_result_consent(boolean),public.ack_league_result(date) from public,anon,authenticated;
grant execute on function public.league_week(timestamptz),public.finalize_league(uuid,timestamptz),public.credit_league(uuid,integer,timestamptz),public.xp_league_credit(),public.close_league_weeks(timestamptz,integer) to service_role;
grant execute on function public.learner_league(),public.set_league_result_consent(boolean),public.ack_league_result(date) to authenticated;

-- League results share the same daily delivery budget and receipt lifecycle.
alter table public.reminder_deliveries add column category text not null default 'learning' check(category in ('learning','league'));
alter table public.reminder_deliveries add column league_week date;
create function public.claim_league_delivery(actor uuid,day date,device uuid,week date,at_time timestamptz default now()) returns boolean language plpgsql security invoker set search_path='' as $$
declare zone text; prefs jsonb; local_time timestamp; reminded bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select d.time_zone,p.preferences,p.reminded_at into zone,prefs,reminded from public.reminder_devices d
 join public.motivation_preferences p on p.user_id=d.user_id join public.league_accounts a on a.user_id=d.user_id
 where d.device_id=device and d.user_id=actor and d.push_token is not null and d.lease_until>at_time and a.push_consent;
 if not found or (public.privacy_choices(actor)->>'push') is distinct from 'true' then return false; end if;
 local_time:=at_time at time zone zone;
 if local_time::date<>day or local_time::time<'08:00'::time or local_time::time>='21:00'::time or local_time::time<(prefs->>'reminderTime')::time then return false; end if;
 if reminded>extract(epoch from at_time-interval '23 hours')*1000 then return false; end if;
 if exists(select 1 from public.reminder_deliveries where user_id=actor and attempted_at>at_time-interval '23 hours') then return false; end if;
 if not exists(select 1 from public.league_members where user_id=actor and week_start=week and final_rank is not null and seen_at is null and push_attempted_at is null and week_start>=public.league_week(at_time)-7) then return false; end if;
 insert into public.reminder_deliveries(user_id,local_date,device_id,status,category,league_week,attempted_at) values(actor,day,device,'pending','league',week,at_time) on conflict do nothing;
 if not found then return false; end if;
 update public.league_members set push_attempted_at=at_time where user_id=actor and week_start=week;
 return true;
end;
$$;
revoke all on function public.claim_league_delivery(uuid,date,uuid,date,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_league_delivery(uuid,date,uuid,date,timestamptz) to service_role;
