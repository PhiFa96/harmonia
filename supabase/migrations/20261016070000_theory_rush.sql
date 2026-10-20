-- Server-issued runs. Only the Edge engine may submit evaluated steps.
create table public.rush_policy (
 id boolean primary key default true check(id),
 policy jsonb not null default '{"version":1,"freeDaily":1,"paidDaily":100,"xpCap":30,"minAnswerMs":350,"difficultyEvery":5}'
 check(jsonb_typeof(policy)='object' and (policy->>'version')::int=1
 and (policy->>'freeDaily')::int between 1 and 10 and (policy->>'paidDaily')::int between 1 and 100
 and (policy->>'xpCap')::int between 0 and 30 and (policy->>'minAnswerMs')::int between 350 and 3000
 and (policy->>'difficultyEvery')::int between 3 and 20)
);
insert into public.rush_policy(id) values(true);
create table public.rush_runs (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('three','five','survival')),
 bank text not null check(bank ~ '^[a-f0-9]{64}$'), seed uuid, pool jsonb, policy jsonb not null,
 state text not null default 'active' check(state in ('active','finished','abandoned')),
 started_at timestamptz not null, deadline timestamptz, last_at timestamptz not null,
 finished_at timestamptz, retained_at timestamptz,
 revision integer not null default 0 check(revision>=0), correct integer not null default 0 check(correct>=0),
 mistakes integer not null default 0 check(mistakes between 0 and 3), score integer not null default 0 check(score>=0),
 xp integer not null default 0 check(xp between 0 and 30),
 unique(user_id,id), check(revision=correct+mistakes),
 check((mode='survival' and deadline is null) or (mode<>'survival' and deadline is not null)),
 check((state='active' and finished_at is null) or (state<>'active' and finished_at is not null))
);
create unique index rush_one_active on public.rush_runs(user_id) where state='active';
create index rush_runs_board on public.rush_runs(bank,mode,finished_at,score desc) where state='finished';
create index rush_runs_expired on public.rush_runs(deadline) where state='active' and deadline is not null;
create table public.rush_steps (
 sequence bigint generated always as identity unique,
 user_id uuid not null, run_id uuid not null, ordinal integer not null check(ordinal>=0),
 answer text not null check(length(answer) between 1 and 4096), correct boolean not null,
 points smallint not null check(points between 0 and 50), received_at timestamptz not null,
 primary key(run_id,ordinal), foreign key(user_id,run_id) references public.rush_runs(user_id,id) on delete cascade
);
create table public.rush_daily_usage (
 user_id uuid not null references auth.users(id) on delete cascade, day date not null,
 used integer not null check(used between 1 and 100), primary key(user_id,day)
);
-- Preserve the lesson FK for all old writers, and use a separate explicit Rush FK.
alter table public.xp_ledger drop constraint xp_ledger_user_id_client_id_fkey;
alter table public.xp_ledger alter column lesson_id drop not null;
alter table public.xp_ledger add column source_kind text not null default 'lesson' check(source_kind in ('lesson','rush'));
alter table public.xp_ledger add column learning_client_id text;
update public.xp_ledger set learning_client_id=client_id;
alter table public.xp_ledger add column rush_run_id uuid;
alter table public.xp_ledger add foreign key(user_id,learning_client_id) references public.learning_events(user_id,client_id) on delete cascade;
alter table public.xp_ledger add foreign key(user_id,rush_run_id) references public.rush_runs(user_id,id) on delete cascade;
alter table public.xp_ledger add check(
 (source_kind='lesson' and learning_client_id=client_id and learning_client_id is not null and lesson_id is not null and rush_run_id is null)
 or (source_kind='rush' and learning_client_id is null and lesson_id is null and rush_run_id is not null and client_id='rush:'||rush_run_id::text and not qualified and coins=0));
create function public.xp_learning_source() returns trigger language plpgsql set search_path='' as $$
begin if new.source_kind='lesson' then new.learning_client_id:=new.client_id;end if;return new;end $$;
create trigger xp_learning_source before insert on public.xp_ledger for each row execute function public.xp_learning_source();

create function public.finish_rush(actor uuid,run uuid,abandon boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.rush_runs; clock timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 clock:=clock_timestamp();
 select * into strict r from public.rush_runs where user_id=actor and id=run for update;
 if r.state<>'active' then return to_jsonb(r);end if;
 if r.deadline is not null and clock>=r.deadline then
  r.finished_at:=r.deadline;r.state:='finished';
 elsif r.mistakes=3 then r.finished_at:=r.last_at;r.state:='finished';
 elsif abandon then r.finished_at:=clock;r.state:='abandoned';
 else return to_jsonb(r);end if;
 r.xp:=case when r.state='finished' then least(r.correct,(r.policy->>'xpCap')::int) else 0 end;
 update public.rush_runs set state=r.state,finished_at=r.finished_at,xp=r.xp where id=run;
 if r.state='finished' then
  insert into public.xp_ledger(user_id,client_id,lesson_id,content_version,amount,local_date,source_kind,rush_run_id)
  values(actor,'rush:'||r.id::text,null,1,r.xp,(r.finished_at at time zone 'UTC')::date,'rush',r.id) on conflict do nothing;
 end if;
 return to_jsonb(r);
end $$;
create function public.rush_status(actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare config jsonb; tier text; daily integer; used integer; r public.rush_runs; clock timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 tier:=public.access_status(actor)->>'tier';clock:=clock_timestamp();
 select policy into strict config from public.rush_policy where id;
 daily:=(config->>case when tier='free' then 'freeDaily' else 'paidDaily' end)::int;
 select u.used into used from public.rush_daily_usage u where user_id=actor and day=(clock at time zone 'UTC')::date;
 select * into r from public.rush_runs where user_id=actor order by started_at desc,id desc limit 1;
 if r.id is not null then perform public.finish_rush(actor,r.id);select * into r from public.rush_runs where id=r.id;end if;
 return jsonb_build_object('limit',daily,'remaining',greatest(0,daily-coalesce(used,0)),
 'resetAt',extract(epoch from (((clock at time zone 'UTC')::date+1)::timestamp at time zone 'UTC'))*1000,'run',case when r.id is null then null else to_jsonb(r) end);
end $$;
create function public.start_rush(actor uuid,run uuid,selected_mode text,bank_version text,task_pool jsonb,server_seed uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare status jsonb; config jsonb; r public.rush_runs; clock timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 status:=public.rush_status(actor);
 select * into r from public.rush_runs where user_id=actor and id=run;
 if found then
  if r.mode<>selected_mode then raise exception 'rush_conflict';end if;
  return to_jsonb(r);
 end if;
 if exists(select 1 from public.rush_runs where user_id=actor and state='active') then raise exception 'rush_active';end if;
 if (status->>'remaining')::int<=0 then raise exception 'rush_limit';end if;
 if selected_mode is null or selected_mode not in ('three','five','survival') or server_seed is null or bank_version !~ '^[a-f0-9]{64}$'
 or jsonb_typeof(task_pool) is distinct from 'array' or jsonb_array_length(task_pool) not between 1 and 256 then raise exception 'rush_source';end if;
 select policy into strict config from public.rush_policy where id;
 clock:=clock_timestamp();
 insert into public.rush_runs(id,user_id,mode,bank,seed,pool,policy,started_at,last_at,deadline)
 values(run,actor,selected_mode,bank_version,server_seed,task_pool,config,clock,clock,
 case selected_mode when 'three' then clock+interval '3 minutes' when 'five' then clock+interval '5 minutes' else null end)
 returning * into r;
 insert into public.rush_daily_usage values(actor,(clock at time zone 'UTC')::date,1)
 on conflict(user_id,day) do update set used=public.rush_daily_usage.used+1;
 return to_jsonb(r);
end $$;
create function public.apply_rush_answer(actor uuid,run uuid,expected_index integer,submitted_answer text,is_correct boolean,points integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.rush_runs; previous public.rush_steps; clock timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into strict r from public.rush_runs where id=run and user_id=actor for update;
 select * into previous from public.rush_steps where run_id=run and ordinal=expected_index;
 if found then
  if previous.answer<>submitted_answer then raise exception 'rush_conflict';end if;
  return public.finish_rush(actor,run);
 end if;
 clock:=clock_timestamp();
 if r.state<>'active' or expected_index<>r.revision then raise exception 'rush_conflict';end if;
 if r.deadline is not null and clock>=r.deadline then return public.finish_rush(actor,run);end if;
 if extract(epoch from clock-r.last_at)*1000 < (r.policy->>'minAnswerMs')::int then raise exception 'rush_fast';end if;
 if submitted_answer is null or length(submitted_answer) not between 1 and 4096 or is_correct is null or points is null or (is_correct and points not between 10 and 50) or (not is_correct and points<>0) then raise exception 'rush_answer';end if;
 insert into public.rush_steps(user_id,run_id,ordinal,answer,correct,points,received_at) values(actor,run,expected_index,submitted_answer,is_correct,points,clock);
 update public.rush_runs set revision=revision+1,correct=correct+is_correct::int,mistakes=mistakes+(not is_correct)::int,score=score+points,last_at=clock where id=run;
 return public.finish_rush(actor,run);
end $$;
create function public.rush_leaderboard(actor uuid,selected_mode text,selected_scope text,bank_version text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare entries jsonb; clock timestamptz:=clock_timestamp(); cutoff timestamptz;
begin
 if actor is null or selected_mode not in ('three','five','survival') or selected_scope not in ('day','week','all','friends') or bank_version !~ '^[a-f0-9]{64}$' then raise exception 'rush_source';end if;
 if selected_scope='friends' then return jsonb_build_object('mode',selected_mode,'scope',selected_scope,'bank',bank_version,'available',false,'entries','[]'::jsonb);end if;
 cutoff:=case selected_scope when 'day' then date_trunc('day',clock at time zone 'UTC') at time zone 'UTC' when 'week' then date_trunc('week',clock at time zone 'UTC') at time zone 'UTC' else '-infinity'::timestamptz end;
 with best as (
  select distinct on(user_id) user_id,score,mistakes,finished_at,id from public.rush_runs
  where state='finished' and bank=bank_version and mode=selected_mode and finished_at>=cutoff and finished_at<=clock
  order by user_id,score desc,mistakes,finished_at,id
 ), ranked as (
  select row_number() over(order by score desc,mistakes,finished_at,id) as rank,user_id,score from best
 ) select coalesce(jsonb_agg(jsonb_build_object('rank',rank,'score',score,'isYou',user_id=actor) order by rank),'[]'::jsonb) into entries
 from ranked where rank<=50 or user_id=actor;
 return jsonb_build_object('mode',selected_mode,'scope',selected_scope,'bank',bank_version,'available',true,'entries',entries);
end $$;
create function public.close_expired_rush(batch_size integer default 100) returns integer language plpgsql security definer set search_path='' as $$
declare r record; count integer:=0;
begin
 if batch_size is null or batch_size not between 1 and 100 then raise exception 'Invalid batch';end if;
 for r in select user_id,id from public.rush_runs where state='active' and deadline<=clock_timestamp() order by deadline,id limit batch_size loop
  if pg_try_advisory_xact_lock(hashtextextended(r.user_id::text,0)) then perform public.finish_rush(r.user_id,r.id);count:=count+1;end if;
 end loop;return count;
end $$;
create function public.retain_rush() returns jsonb language plpgsql security definer set search_path='' as $$
declare r record; affected integer; more boolean:=false; total integer:=0;
begin
 for r in select user_id,id from public.rush_runs where retained_at is null and last_at<now()-interval '12 months' order by last_at,id limit 100 loop
  if not pg_try_advisory_xact_lock(hashtextextended(r.user_id::text,0)) then continue;end if;
  -- Recheck after acquiring the same lock as answer writers.
  if exists(select 1 from public.rush_runs where id=r.id and last_at<now()-interval '12 months' and retained_at is null) then
   perform public.finish_rush(r.user_id,r.id,true);
   delete from public.rush_steps where run_id=r.id;
   update public.rush_runs set pool=null,seed=null,retained_at=clock_timestamp() where id=r.id;
   total:=total+1;
  end if;
 end loop;
 delete from public.rush_daily_usage where (user_id,day) in(select user_id,day from public.rush_daily_usage where day<(now() at time zone 'UTC')::date-366 order by day,user_id limit 100);
 get diagnostics affected=row_count;more:=total=100 or affected=100;
 return jsonb_build_object('changed',total+affected,'more',more);
end $$;
create or replace function public.motivation_history(actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'revision',coalesce((select max(sequence)::text from public.learning_events where user_id=actor),'0')||':'||(select count(*)::text from public.freeze_purchases where user_id=actor)||case when exists(select 1 from public.xp_ledger where user_id=actor and source_kind='rush') then ':rush:'||(select count(*)::text from public.xp_ledger where user_id=actor and source_kind='rush') else '' end,
 'activities',coalesce((select jsonb_agg(jsonb_build_object('id',x.client_id,'at',coalesce((e.event->>'finishedAt')::bigint,(extract(epoch from r.finished_at)*1000)::bigint),'timeZone',coalesce(e.event->>'timeZone','UTC'),'amount',x.amount,'qualified',x.qualified,'coins',x.coins) order by coalesce((e.event->>'finishedAt')::bigint,(extract(epoch from r.finished_at)*1000)::bigint),x.client_id)
 from public.xp_ledger x left join public.learning_events e on e.user_id=x.user_id and e.client_id=x.learning_client_id left join public.rush_runs r on r.user_id=x.user_id and r.id=x.rush_run_id where x.user_id=actor),'[]'::jsonb),
 'purchases',coalesce((select jsonb_agg(purchase order by sequence) from public.freeze_purchases where user_id=actor),'[]'::jsonb));
$$;
do $$ declare name text;begin
 foreach name in array array['rush_policy','rush_runs','rush_steps','rush_daily_usage'] loop
  execute format('alter table public.%I enable row level security',name);
  execute format('revoke all on public.%I from public,anon,authenticated',name);
  execute format('grant all on public.%I to service_role',name);
 end loop;
end $$;
grant usage,select on sequence public.rush_steps_sequence_seq to service_role;
revoke all on function public.finish_rush(uuid,uuid,boolean),public.rush_status(uuid),public.start_rush(uuid,uuid,text,text,jsonb,uuid),public.apply_rush_answer(uuid,uuid,integer,text,boolean,integer),public.rush_leaderboard(uuid,text,text,text),public.close_expired_rush(integer),public.retain_rush() from public,anon,authenticated;
grant execute on function public.finish_rush(uuid,uuid,boolean),public.rush_status(uuid),public.start_rush(uuid,uuid,text,text,jsonb,uuid),public.apply_rush_answer(uuid,uuid,integer,text,boolean,integer),public.rush_leaderboard(uuid,text,text,text),public.close_expired_rush(integer),public.retain_rush() to service_role;
