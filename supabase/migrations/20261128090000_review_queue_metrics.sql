-- Expose aggregate review backlog in the existing private operations snapshot.
create or replace function public.operations_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'version',1,'asOf',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'windowStart',to_char(date_trunc('minute',now()-interval '1 hour') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'services',coalesce((select jsonb_agg(row_to_json(q)) from(select service,sum(requests)::bigint as requests,coalesce(sum(requests) filter(where response_class=5),0)::bigint as failures,coalesce(sum(requests) filter(where response_class=4),0)::bigint as rejected,max(max_response_ms) as max_response_ms from public.operational_counts where slot>=date_trunc('minute',now()-interval '1 hour') group by service) q),'[]'::jsonb),
  'ai',jsonb_build_object('spentNanoUsd',(select coalesce(sum(cost_nano_usd),0)::text from public.ai_usage where day=(now() at time zone 'UTC')::date),'reservedNanoUsd',(select coalesce(sum(reserved_cost),0)::text from public.tutor_requests where day=(now() at time zone 'UTC')::date and state='reserved'),'failedRequestsHour',(select count(*) from public.tutor_requests where finished_at>=now()-interval '1 hour' and state='failed')),
  'billingPendingOverHour',(select count(*) from public.billing_events where processed_at is null and received_at<now()-interval '1 hour'),
  'reviewPending',(select jsonb_build_object(
    'count', count(*),
    'oldestSeconds', coalesce(greatest(0, floor(extract(epoch from now()-min(received_at)))),0)
  ) from public.learning_events where fsrs_version is null),
  'privacyPendingOverDay',(select count(*) from public.privacy_external_erasure where state in ('pending','processing') and created_at<now()-interval '1 day')
 );
$$;
