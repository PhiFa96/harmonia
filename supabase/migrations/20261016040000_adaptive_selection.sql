-- P3.01 intentionally excluded placement. Revisit only those receipts, once; no prior rating delta exists.
update public.learning_events set rating_version=null,rating_outcome=null,rated_at=null
where rating_outcome='placement' and event->>'kind'='placement';

-- Only one's own skill estimates and anonymous item aggregates. No caller-supplied actor.
create function public.learner_rating_snapshot(bucket_ids jsonb default '[]'::jsonb) returns jsonb
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
      from public.skill_progress where user_id=actor),'{}'::jsonb),
    'buckets',coalesce((select jsonb_object_agg(bucket_id,jsonb_build_object(
      'rating',rating,'deviation',rating_deviation,'volatility',volatility,'attempts',attempts,
      'updatedAt',floor(extract(epoch from last_practiced_at)*1000)))
      from public.item_difficulty where bucket_id in(select jsonb_array_elements_text(bucket_ids))),'{}'::jsonb)
  );
end $$;
revoke all on function public.learner_rating_snapshot(jsonb) from public,anon,authenticated;
grant execute on function public.learner_rating_snapshot(jsonb) to authenticated;

-- Private descriptive beta report. No automatic significance/non-inferiority claim.
-- Start denominators include abandonment; every included start has a full 24h receipt window.
create or replace function public.adaptive_beta_report(first_day date,last_day date,as_of timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if first_day is null or last_day is null or as_of is null or first_day>=last_day
    or last_day-first_day>366 or as_of>now() then raise exception 'Invalid beta range'; end if;
  with starts as (
    select * from public.analytics_events where name='lesson_started'
      and occurred_at>=first_day::timestamp at time zone 'UTC'
      and occurred_at<last_day::timestamp at time zone 'UTC'
      and occurred_at<=as_of-interval '24 hours'
      and properties->>'selectionGroup' in ('control','adaptive')
      and properties->>'selectionExperiment'='p302-beta-v1'
      and properties->>'selectionUsed' in ('fixed','adaptive')
  ), outcomes as (
    select s.*,exists(select 1 from public.analytics_events e
      where e.user_id=s.user_id and e.name='lesson_completed'
        and e.properties->>'attemptId'=s.properties->>'attemptId'
        and e.properties->>'lessonId'=s.properties->>'lessonId'
        and e.properties->'contentVersion'=s.properties->'contentVersion'
        and e.occurred_at<least(as_of,s.occurred_at+interval '24 hours')) as completed
    from starts s
  ), strata as (
    select properties->>'selectionGroup' as assignment,properties->>'selectionUsed' as selection,
      properties->>'lessonId' as lesson,properties->'contentVersion' as version,
      count(distinct user_id) as learners,count(*) as started,count(*) filter(where completed) as completed
    from outcomes group by 1,2,3,4
  ) select jsonb_build_object('version',1,'experiment','p302-beta-v1','from',first_day,'toExclusive',last_day,'asOf',as_of,
    'windowHours',24,'nonInferiorityEstablished',false,'requiresAccountClusteredAnalysis',true,
    'strata',coalesce((select jsonb_agg(to_jsonb(s) order by assignment,selection,lesson,version) from strata s),'[]'::jsonb)) into result;
  return result;
end $$;
revoke all on function public.adaptive_beta_report(date,date,timestamptz) from public,anon,authenticated;
grant execute on function public.adaptive_beta_report(date,date,timestamptz) to service_role;
