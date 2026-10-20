-- Only verified retained summaries are projected. Raw answers and account data stay private.
alter table public.tutor_requests alter column prompt_version set default 4;
alter table public.tutor_requests alter column tool_version set default 2;
create function public.tutor_learner_snapshot(actor uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  with summaries as (
    select coalesce(retained_summary,
      case when event->>'kind' = 'retained' then event end) as summary
    from public.learning_events where user_id = actor
  )
  select jsonb_build_object(
    'passed', coalesce((select jsonb_agg(distinct jsonb_build_object(
      'lessonId', summary->>'lessonId',
      'contentVersion', (summary->>'contentVersion')::integer))
      from summaries where summary->>'sourceKind' = 'lesson'
        and summary->'progress'->>'passed' = 'true'), '[]'::jsonb),
    'testedUnitIds', coalesce((select jsonb_agg(distinct unit_id)
      from summaries, jsonb_array_elements_text(summary->'testedUnitIds') unit_id
      where summary->>'sourceKind' = 'placement'), '[]'::jsonb)
  );
$$;
revoke all on function public.tutor_learner_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.tutor_learner_snapshot(uuid) to service_role;
