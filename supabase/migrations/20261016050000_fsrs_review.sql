-- FSRS is derived from the same verified learning_events. No second answer ledger.
create or replace function public.commit_rating_period(actor uuid,client_id text,expected_hash text,expected_revision bigint,updates jsonb,outcome text) returns text
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
    insert into skill_progress(user_id,skill_id,rating,rating_deviation,volatility,attempts,last_practiced_at) values(actor,key,(state->>'rating')::double precision,(state->>'deviation')::double precision,(state->>'volatility')::double precision,(state->>'attempts')::bigint,to_timestamp((state->>'updatedAt')::double precision/1000))
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

alter table public.skill_progress drop constraint skill_progress_attempts_check;
alter table public.skill_progress add constraint skill_progress_attempts_check check(attempts between 0 and 9007199254740991);
alter table public.skill_progress add column fsrs jsonb;
alter table public.learning_events add column fsrs_version integer check(fsrs_version=1);
create index learning_fsrs_pending on public.learning_events(sequence) where fsrs_version is null;
alter table public.learning_events drop constraint learning_events_event_check;
alter table public.learning_events add constraint learning_events_event_check check(jsonb_typeof(event)='object' and event ? 'kind' and event ? 'id' and event->>'kind' in ('lesson','placement','retained','card-review') and event->>'id'=client_id);
create table public.review_control (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check(revision>=0)
);
create table public.card_review_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_key text not null check(char_length(card_key) between 3 and 160),
  fsrs jsonb not null,
  primary key(user_id,card_key)
);
alter table public.review_control enable row level security;
alter table public.card_review_progress enable row level security;
revoke all on public.review_control,public.card_review_progress from public,anon,authenticated;
grant all on public.review_control,public.card_review_progress to service_role;
grant select on public.card_review_progress to authenticated;
create policy card_review_select_own on public.card_review_progress for select to authenticated using((select auth.uid())=user_id);
create or replace function public.rating_snapshot(actor uuid,bucket_ids jsonb) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if jsonb_typeof(bucket_ids) is distinct from 'array' or jsonb_array_length(bucket_ids)>200 then raise exception 'Invalid rating buckets';end if;
  return (select jsonb_build_object('revision',revision::text,'tau',tau,
    'skills',coalesce((select jsonb_object_agg(skill_id,jsonb_build_object('rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,'updatedAt',floor(extract(epoch from last_practiced_at)*1000))) from skill_progress where user_id=actor and attempts>0),'{}'::jsonb),
    'buckets',coalesce((select jsonb_object_agg(bucket_id,jsonb_build_object('rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,'updatedAt',floor(extract(epoch from last_practiced_at)*1000))) from item_difficulty where bucket_id in (select jsonb_array_elements_text(bucket_ids))),'{}'::jsonb)
  ) from rating_control where id);
end $$;
create or replace function public.learner_rating_snapshot(bucket_ids jsonb default '[]'::jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(bucket_ids) is distinct from 'array' or jsonb_array_length(bucket_ids)>2000
    or exists(select 1 from jsonb_array_elements(bucket_ids) value
      where jsonb_typeof(value)<>'string' or length(value#>>'{}')>2048)
  then raise exception 'Invalid rating buckets'; end if;
  if exists(select 1 from public.learning_events where user_id=actor and rating_version is null)
  then raise exception 'Rating projection pending'; end if;
  return jsonb_build_object(
    'throughSequence',coalesce((select max(sequence) from public.learning_events where user_id=actor),0),
    'skills',coalesce((select jsonb_object_agg(skill_id,jsonb_build_object(
      'rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,
      'updatedAt',floor(extract(epoch from last_practiced_at)*1000)))
      from public.skill_progress where user_id=actor and attempts>0),'{}'::jsonb),
    'buckets',coalesce((select jsonb_object_agg(bucket_id,jsonb_build_object(
      'rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,
      'updatedAt',floor(extract(epoch from last_practiced_at)*1000)))
      from public.item_difficulty where bucket_id in(select jsonb_array_elements_text(bucket_ids))),'{}'::jsonb)
  );
end $$;
create or replace function public.append_learning_events(actor uuid,events jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare entry jsonb; previous_hash text; body_hash text;
begin
 if jsonb_typeof(events) is distinct from 'array' or jsonb_array_length(events)>50 then raise exception 'Invalid learning batch';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 for entry in select value from jsonb_array_elements(events) loop
  if entry->>'kind' not in ('lesson','placement','card-review') then raise exception 'Only raw verified uploads';end if;
  body_hash:=encode(extensions.digest(entry::text,'sha256'),'hex');
  select event_hash into previous_hash from public.learning_events where user_id=actor and client_id=entry->>'id';
  if found and previous_hash<>body_hash then raise exception 'Conflicting learning ID';end if;
  insert into public.learning_events(user_id,client_id,event,event_hash) values(actor,entry->>'id',entry,body_hash) on conflict(user_id,client_id) do nothing;
 end loop;
end $$;
create or replace function public.retain_learning_event(actor uuid,client_id text,expected_hash text,summary jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if summary->>'kind'<>'retained' or summary->>'id'<>client_id then raise exception 'Invalid retained summary';end if;
 update learning_events set event=coalesce(retained_summary,summary),retained_summary=null,retained_at=now()
 where user_id=actor and learning_events.client_id=retain_learning_event.client_id and event_hash=expected_hash and retained_at is null
 and fsrs_version=1 and received_at<now()-interval '12 months';
 return found;
end $$;

create function public.review_card_valid(card jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare key text; value jsonb;
begin
  if jsonb_typeof(card) is distinct from 'object' or not(card ?& array['due','stability','difficulty','elapsed_days','scheduled_days','learning_steps','reps','lapses','state']) then return false;end if;
  for key,value in select * from jsonb_each(card) loop
    if key not in ('due','stability','difficulty','elapsed_days','scheduled_days','learning_steps','reps','lapses','state','last_review') or jsonb_typeof(value)<>'number' then return false;end if;
    if value::text::numeric<0 then return false;end if;
    if key not in ('stability','difficulty') and (mod(value::text::numeric,1)<>0 or value::text::numeric>9007199254740991) then return false;end if;
  end loop;
  return (card->>'stability')::numeric<=1000000 and (card->>'difficulty')::numeric<=10
    and (card->>'state')::integer between 0 and 3 and (card->>'lapses')::numeric<=(card->>'reps')::numeric
    and (card->>'due')::numeric<=8640000000000000
    and case when (card->>'reps')::numeric=0 then card->>'state'='0' and not(card ? 'last_review') else card ? 'last_review' and (card->>'last_review')::numeric<=8640000000000000 end;
end $$;
alter table public.skill_progress add constraint skill_fsrs_valid check(fsrs is null or public.review_card_valid(fsrs));
alter table public.card_review_progress add constraint card_fsrs_valid check(public.review_card_valid(fsrs));
create function public.review_pending(actor uuid default null,limit_count integer default 50) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if limit_count is null or limit_count not between 1 and 50 then raise exception 'Invalid review page';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('actor',user_id,'id',client_id,'hash',event_hash,'receivedAt',floor(extract(epoch from received_at)*1000),'event',event) order by sequence) from (select * from learning_events where fsrs_version is null and (actor is null or user_id=actor) order by sequence limit limit_count) x),'[]'::jsonb);
end $$;
create function public.review_snapshot(actor uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('revision',coalesce((select revision::text from review_control where user_id=actor),'0'),
 'skills',coalesce((select jsonb_object_agg(skill_id,fsrs) from skill_progress where user_id=actor and fsrs is not null),'{}'::jsonb),
 'cards',coalesce((select jsonb_object_agg(card_key,fsrs) from card_review_progress where user_id=actor),'{}'::jsonb));
$$;
create function public.commit_review_period(actor uuid,client_id text,expected_hash text,expected_revision bigint,updates jsonb) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare source learning_events; current_revision bigint; key text; card jsonb;
begin
 perform 1 from auth.users where id=actor for key share;
 if not found then return 'missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 insert into review_control(user_id) values(actor) on conflict do nothing;
 select revision into current_revision from review_control where user_id=actor for update;
 select * into source from learning_events where user_id=actor and learning_events.client_id=commit_review_period.client_id for update;
 if not found then return 'missing';end if;
 if source.event_hash is distinct from expected_hash then raise exception 'Review source conflict';end if;
 if source.fsrs_version=1 then return 'already';end if;
 if current_revision<>expected_revision or exists(select 1 from learning_events where user_id=actor and sequence<source.sequence and fsrs_version is null) then return 'conflict';end if;
 if jsonb_typeof(updates) is distinct from 'object' or (select count(*) from jsonb_object_keys(updates))<>2 or jsonb_typeof(updates->'skills') is distinct from 'object' or jsonb_typeof(updates->'cards') is distinct from 'object' then raise exception 'Invalid review update';end if;
 if source.event->>'kind'='retained' and updates<>'{"skills":{},"cards":{}}'::jsonb then return 'conflict';end if;
 for key,card in select * from jsonb_each(updates->'skills') loop
   if char_length(key) not between 1 and 128 or not review_card_valid(card) then raise exception 'Invalid review skill';end if;
   -- Assisted-only practice may have no Glicko observation. attempts=0 is never returned as a rating.
   insert into skill_progress(user_id,skill_id,rating,rating_deviation,volatility,attempts,last_practiced_at,fsrs) values(actor,key,1500,350,0.06,0,source.received_at,card)
   on conflict(user_id,skill_id) do update set fsrs=excluded.fsrs;
 end loop;
 for key,card in select * from jsonb_each(updates->'cards') loop
   if char_length(key) not between 3 and 160 or not review_card_valid(card) then raise exception 'Invalid review card';end if;
   insert into card_review_progress values(actor,key,card) on conflict(user_id,card_key) do update set fsrs=excluded.fsrs;
 end loop;
 update learning_events set fsrs_version=1 where user_id=actor and learning_events.client_id=commit_review_period.client_id;
 update review_control set revision=revision+1 where user_id=actor;
 return 'applied';
end $$;
create function public.learner_review_snapshot() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if exists(select 1 from learning_events where user_id=auth.uid() and fsrs_version is null) then raise exception 'Review projection pending';end if;
 return (review_snapshot(auth.uid())-'revision')||jsonb_build_object('throughSequence',coalesce((select max(sequence) from learning_events where user_id=auth.uid()),0),'throughPosition',0);
end $$;
revoke all on function public.review_card_valid(jsonb),public.review_pending(uuid,integer),public.review_snapshot(uuid),public.commit_review_period(uuid,text,text,bigint,jsonb),public.learner_review_snapshot() from public,anon,authenticated;
grant execute on function public.review_card_valid(jsonb),public.review_pending(uuid,integer),public.review_snapshot(uuid),public.commit_review_period(uuid,text,text,bigint,jsonb),public.learner_review_snapshot() to service_role;
grant execute on function public.learner_review_snapshot() to authenticated;
-- The check function must run during own SELECT as well as trusted projection writes.
grant execute on function public.review_card_valid(jsonb) to authenticated;
