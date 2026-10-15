-- Ratings are a derived projection of canonical learning_events, not a second answer store.
create table public.skill_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null check(char_length(skill_id) between 1 and 128),
  rating double precision not null check(rating between -1000000 and 1000000),
  rating_deviation double precision not null check(rating_deviation > 0 and rating_deviation <= 350),
  volatility double precision not null check(volatility > 0 and volatility <= 10),
  attempts bigint not null check(attempts between 1 and 9007199254740991),
  last_practiced_at timestamptz not null,
  primary key(user_id,skill_id)
);
create table public.item_difficulty (
  bucket_id text primary key check(char_length(bucket_id) between 8 and 2048 and bucket_id like 'g2:1:%'),
  rating double precision not null check(rating between -1000000 and 1000000),
  rating_deviation double precision not null check(rating_deviation > 0 and rating_deviation <= 350),
  volatility double precision not null check(volatility > 0 and volatility <= 10),
  attempts bigint not null check(attempts between 1 and 9007199254740991),
  last_practiced_at timestamptz not null
);
create table public.rating_control (
  id boolean primary key default true check(id),
  algorithm_version integer not null default 1 check(algorithm_version=1),
  revision bigint not null default 0 check(revision>=0),
  tau double precision not null default 0.5 check(tau between 0.01 and 2)
);
insert into public.rating_control(id) values(true);
create function public.rating_control_revision() returns trigger language plpgsql set search_path='' as $$
begin
  if new.tau is distinct from old.tau then new.revision:=old.revision+1;end if;
  return new;
end $$;
create trigger rating_control_revision before update on public.rating_control for each row execute function public.rating_control_revision();

alter table public.learning_events add column rating_version integer check(rating_version=1);
alter table public.learning_events add column rating_outcome text check(rating_outcome in ('rated','no_evidence','placement','retained','unavailable','invalid'));
alter table public.learning_events add column rated_at timestamptz;
alter table public.learning_events add constraint learning_rating_receipt check(
  (rating_version is null and rating_outcome is null and rated_at is null) or
  (rating_version is not null and rating_outcome is not null and rated_at is not null)
);
create index learning_rating_pending_actor on public.learning_events(user_id,sequence) where rating_version is null;
create index learning_rating_pending_all on public.learning_events(sequence) where rating_version is null;
alter table public.skill_progress enable row level security;
alter table public.item_difficulty enable row level security;
alter table public.rating_control enable row level security;
revoke all on public.skill_progress,public.item_difficulty,public.rating_control from public,anon,authenticated;
grant select on public.skill_progress to authenticated;
grant all on public.skill_progress,public.item_difficulty,public.rating_control to service_role;
create policy skill_progress_select_own on public.skill_progress for select to authenticated using((select auth.uid())=user_id);

create function public.rating_pending(actor uuid default null,limit_count integer default 50) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if limit_count is null or limit_count not between 1 and 50 then raise exception 'Invalid rating page';end if;
  return coalesce((select jsonb_agg(jsonb_build_object('actor',user_id,'id',client_id,'event',event,'hash',event_hash,'receivedAt',floor(extract(epoch from received_at)*1000)) order by sequence)
    from (select * from learning_events where rating_version is null and (actor is null or user_id=actor) order by sequence limit limit_count) e),'[]'::jsonb);
end $$;
create function public.rating_snapshot(actor uuid,bucket_ids jsonb) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if jsonb_typeof(bucket_ids) is distinct from 'array' or jsonb_array_length(bucket_ids)>200 then raise exception 'Invalid rating buckets';end if;
  return (select jsonb_build_object('revision',revision::text,'tau',tau,
    'skills',coalesce((select jsonb_object_agg(skill_id,jsonb_build_object('rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,'updatedAt',floor(extract(epoch from last_practiced_at)*1000))) from skill_progress where user_id=actor),'{}'::jsonb),
    'buckets',coalesce((select jsonb_object_agg(bucket_id,jsonb_build_object('rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,'updatedAt',floor(extract(epoch from last_practiced_at)*1000))) from item_difficulty where bucket_id in (select jsonb_array_elements_text(bucket_ids))),'{}'::jsonb)
  ) from rating_control where id);
end $$;
create function public.rating_state_valid(state jsonb) returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(state)='object'
    and (select count(*) from jsonb_object_keys(case when jsonb_typeof(state)='object' then state else '{}'::jsonb end))=5
    and jsonb_typeof(state->'rating')='number' and jsonb_typeof(state->'deviation')='number'
    and jsonb_typeof(state->'volatility')='number' and jsonb_typeof(state->'attempts')='number'
    and jsonb_typeof(state->'updatedAt')='number'
  then (state->>'rating')::numeric between -1000000 and 1000000
    and (state->>'deviation')::numeric>0 and (state->>'deviation')::numeric<=350
    and (state->>'volatility')::numeric>0 and (state->>'volatility')::numeric<=10
    and (state->>'attempts')::numeric between 1 and 9007199254740991 and mod((state->>'attempts')::numeric,1)=0
    and (state->>'updatedAt')::numeric between 0 and 9007199254740991 and mod((state->>'updatedAt')::numeric,1)=0
  else false end;
$$;
create function public.commit_rating_period(actor uuid,client_id text,expected_hash text,expected_revision bigint,updates jsonb,outcome text) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare source learning_events; control rating_control; key text; state jsonb;
begin
  -- Lock the account before child rows, so deletion and projection cannot resurrect each other.
  perform 1 from auth.users where id=actor for key share;
  if not found then return 'missing';end if;
  select * into strict control from rating_control where id for update;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  select * into source from learning_events where user_id=actor and learning_events.client_id=commit_rating_period.client_id for update;
  if not found then return 'missing';end if;
  if source.event_hash is distinct from expected_hash then raise exception 'Rating source conflict';end if;
  if source.rating_version=1 then return 'already';end if;
  if control.revision is distinct from expected_revision then return 'conflict';end if;
  if source.event->>'kind'='retained' and outcome is distinct from 'retained' then return 'conflict';end if;
  if outcome is null or outcome not in ('rated','no_evidence','placement','retained','unavailable','invalid')
    or jsonb_typeof(updates) is distinct from 'object'
    or (select count(*) from jsonb_object_keys(updates))<>2
    or jsonb_typeof(updates->'skills') is distinct from 'object'
    or jsonb_typeof(updates->'buckets') is distinct from 'object'
  then raise exception 'Invalid rating update';end if;
  if outcome<>'rated' and updates<>'{"skills":{},"buckets":{}}'::jsonb then raise exception 'Excluded rating has updates';end if;
  if outcome='rated' and (updates->'skills'='{}'::jsonb or updates->'buckets'='{}'::jsonb) then raise exception 'Empty rating update';end if;
  for key,state in select * from jsonb_each(updates->'skills') loop
    if char_length(key) not between 1 and 128 or not coalesce(rating_state_valid(state),false) then raise exception 'Invalid skill rating';end if;
    insert into skill_progress values(actor,key,(state->>'rating')::double precision,(state->>'deviation')::double precision,(state->>'volatility')::double precision,(state->>'attempts')::bigint,to_timestamp((state->>'updatedAt')::double precision/1000))
    on conflict(user_id,skill_id) do update set rating=excluded.rating,rating_deviation=excluded.rating_deviation,volatility=excluded.volatility,attempts=excluded.attempts,last_practiced_at=excluded.last_practiced_at;
  end loop;
  for key,state in select * from jsonb_each(updates->'buckets') loop
    if not coalesce(rating_state_valid(state),false) then raise exception 'Invalid difficulty rating';end if;
    insert into item_difficulty values(key,(state->>'rating')::double precision,(state->>'deviation')::double precision,(state->>'volatility')::double precision,(state->>'attempts')::bigint,to_timestamp((state->>'updatedAt')::double precision/1000))
    on conflict(bucket_id) do update set rating=excluded.rating,rating_deviation=excluded.rating_deviation,volatility=excluded.volatility,attempts=excluded.attempts,last_practiced_at=excluded.last_practiced_at;
  end loop;
  update learning_events set rating_version=1,rating_outcome=outcome,rated_at=now() where user_id=actor and learning_events.client_id=commit_rating_period.client_id;
  update rating_control set revision=revision+1 where id;
  return 'applied';
end $$;
revoke all on function public.rating_pending(uuid,integer),public.rating_snapshot(uuid,jsonb),public.rating_state_valid(jsonb),public.commit_rating_period(uuid,text,text,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.rating_pending(uuid,integer),public.rating_snapshot(uuid,jsonb),public.rating_state_valid(jsonb),public.commit_rating_period(uuid,text,text,bigint,jsonb,text) to service_role;
