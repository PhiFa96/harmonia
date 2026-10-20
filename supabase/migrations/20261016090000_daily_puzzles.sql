-- P3.07: dated, frozen puzzles from the published catalogue.
create table public.daily_puzzles (
 day date primary key,
 bank text not null check(bank ~ '^[a-f0-9]{64}$'),
 spec jsonb not null check(jsonb_typeof(spec)='object'),
 seed text not null check(length(seed) between 1 and 128),
 difficulty smallint not null check(difficulty between 1 and 5),
 created_at timestamptz not null default now()
);
create table public.daily_puzzle_results (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null references public.daily_puzzles(day),
 answer text check(answer is null or length(answer) between 1 and 4096),
 correct boolean not null,
 time_zone text check(time_zone is null or length(time_zone) between 1 and 128),
 answered_at timestamptz default now(),
 retained_at timestamptz,
 primary key(user_id,day),
 check((answer is not null and time_zone is not null and answered_at is not null and retained_at is null) or
  (answer is null and time_zone is null and answered_at is null and retained_at is not null))
);
create index daily_puzzle_results_streak on public.daily_puzzle_results(user_id,day desc) where correct;
alter table public.daily_puzzles enable row level security;
alter table public.daily_puzzle_results enable row level security;
revoke all on public.daily_puzzles,public.daily_puzzle_results from public,anon,authenticated;
grant all on public.daily_puzzles,public.daily_puzzle_results to service_role;

create function public.puzzle_fill(entries jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare inserted integer;
begin
 if jsonb_typeof(entries) is distinct from 'array' or jsonb_array_length(entries)>56 then raise exception 'puzzle_source';end if;
 if exists(select 1 from jsonb_to_recordset(entries) as x(day date,bank text,spec jsonb,seed text,difficulty integer)
  where x.day is null or x.day not between current_date-1 and current_date+60 or x.bank is null or x.bank !~ '^[a-f0-9]{64}$'
   or jsonb_typeof(x.spec) is distinct from 'object' or x.seed is null or length(x.seed) not between 1 and 128
   or x.difficulty is null or x.difficulty not between 1 and 5)
 then raise exception 'puzzle_source';end if;
 insert into public.daily_puzzles(day,bank,spec,seed,difficulty)
 select x.day,x.bank,x.spec,x.seed,x.difficulty from jsonb_to_recordset(entries) as x(day date,bank text,spec jsonb,seed text,difficulty integer)
 on conflict(day) do nothing;
 get diagnostics inserted=row_count;
 return inserted;
end $$;

create function public.puzzle_streak(actor uuid,today date) returns integer language sql stable security definer set search_path='' as $$
 with recursive chain(day) as (
  select case
   when exists(select 1 from public.daily_puzzle_results where user_id=actor and day=today and correct) then today
   when exists(select 1 from public.daily_puzzle_results where user_id=actor and day=today) then null::date
   when exists(select 1 from public.daily_puzzle_results where user_id=actor and day=today-1 and correct) then today-1
   else null::date end
  union all
  select chain.day-1 from chain where chain.day is not null
   and exists(select 1 from public.daily_puzzle_results where user_id=actor and day=chain.day-1 and correct)
 )
 select count(day)::integer from chain;
$$;
create function public.puzzle_status(actor uuid,requested_day date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.daily_puzzles;r public.daily_puzzle_results;
begin
 select * into p from public.daily_puzzles where day=requested_day;
 select * into r from public.daily_puzzle_results where user_id=actor and day=requested_day;
 return jsonb_build_object('puzzle',case when p.day is null then null else to_jsonb(p) end,
  'result',case when r.user_id is null then null else to_jsonb(r) end,
  'streak',public.puzzle_streak(actor,requested_day));
end $$;
create function public.puzzle_answer(actor uuid,requested_day date,time_zone text,submitted_answer text,is_correct boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare prior public.daily_puzzle_results;
begin
 if actor is null or time_zone is null or length(time_zone) not between 1 and 128 or
  (clock_timestamp() at time zone time_zone)::date<>requested_day then raise exception 'puzzle_day';end if;
 if submitted_answer is null or length(submitted_answer) not between 1 and 4096 or is_correct is null then raise exception 'puzzle_answer';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,1));
 select * into prior from public.daily_puzzle_results where user_id=actor and day=requested_day;
 if prior.user_id is not null then
  if prior.answer<>submitted_answer then raise exception 'puzzle_conflict';end if;
  return public.puzzle_status(actor,requested_day);
 end if;
 if not exists(select 1 from public.daily_puzzles where day=requested_day) then raise exception 'puzzle_source';end if;
 insert into public.daily_puzzle_results(user_id,day,answer,correct,time_zone)
 values(actor,requested_day,submitted_answer,is_correct,time_zone);
 return public.puzzle_status(actor,requested_day);
end $$;
create function public.retain_daily_puzzles() returns jsonb language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 update public.daily_puzzle_results set answer=null,time_zone=null,answered_at=null,retained_at=clock_timestamp()
 where (user_id,day) in(select user_id,day from public.daily_puzzle_results
  where answered_at<now()-interval '12 months' and retained_at is null
  order by answered_at,user_id,day limit 100 for update skip locked);
 get diagnostics changed=row_count;
 return jsonb_build_object('changed',changed,'more',changed=100);
end $$;
revoke all on function public.puzzle_fill(jsonb),public.puzzle_streak(uuid,date),public.puzzle_status(uuid,date),public.puzzle_answer(uuid,date,text,text,boolean),public.retain_daily_puzzles() from public,anon,authenticated;
grant execute on function public.puzzle_fill(jsonb),public.puzzle_streak(uuid,date),public.puzzle_status(uuid,date),public.puzzle_answer(uuid,date,text,text,boolean),public.retain_daily_puzzles() to service_role;
