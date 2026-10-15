-- Operational aggregates only: no actor, request ID, URL, body, prompt or answer.
create table public.operational_counts (
 slot timestamptz not null,service text not null check(service in ('learning-sync','tutor','billing-webhook')),
 response_class integer not null check(response_class between 2 and 5),
 requests bigint not null default 0 check(requests>=0),
 response_ms bigint not null default 0 check(response_ms>=0),
 max_response_ms integer not null default 0 check(max_response_ms>=0),
 primary key(slot,service,response_class)
);
alter table public.operational_counts enable row level security;
revoke all on public.operational_counts from public,anon,authenticated;
grant all on public.operational_counts to service_role;
create function public.record_operational_outcome(service_name text,response_status integer,duration_ms integer)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if service_name not in ('learning-sync','tutor','billing-webhook') or response_status<200 or response_status>599 or duration_ms<0 or duration_ms>60000 then raise exception 'Invalid operational metric';end if;
 insert into public.operational_counts(slot,service,response_class,requests,response_ms,max_response_ms)
 values(date_trunc('minute',clock_timestamp()),service_name,response_status/100,1,duration_ms,duration_ms)
 on conflict(slot,service,response_class) do update set requests=operational_counts.requests+1,response_ms=operational_counts.response_ms+excluded.response_ms,max_response_ms=greatest(operational_counts.max_response_ms,excluded.max_response_ms);
 delete from public.operational_counts where slot<now()-interval '30 days';
end; $$;
revoke all on function public.record_operational_outcome(text,integer,integer) from public,anon,authenticated;
grant execute on function public.record_operational_outcome(text,integer,integer) to service_role;
create function public.operations_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'version',1,'asOf',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'windowStart',to_char(date_trunc('minute',now()-interval '1 hour') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'services',coalesce((select jsonb_agg(row_to_json(q)) from(select service,sum(requests)::bigint as requests,coalesce(sum(requests) filter(where response_class=5),0)::bigint as failures,coalesce(sum(requests) filter(where response_class=4),0)::bigint as rejected,max(max_response_ms) as max_response_ms from public.operational_counts where slot>=date_trunc('minute',now()-interval '1 hour') group by service) q),'[]'::jsonb),
  'ai',jsonb_build_object('spentNanoUsd',(select coalesce(sum(cost_nano_usd),0)::text from public.ai_usage where day=(now() at time zone 'UTC')::date),'reservedNanoUsd',(select coalesce(sum(reserved_cost),0)::text from public.tutor_requests where day=(now() at time zone 'UTC')::date and state='reserved'),'failedRequestsHour',(select count(*) from public.tutor_requests where finished_at>=now()-interval '1 hour' and state='failed')),
  'billingPendingOverHour',(select count(*) from public.billing_events where processed_at is null and received_at<now()-interval '1 hour'),
  'privacyPendingOverDay',(select count(*) from public.privacy_external_erasure where state in ('pending','processing') and created_at<now()-interval '1 day')
 );
$$;
revoke all on function public.operations_snapshot() from public,anon,authenticated;
grant execute on function public.operations_snapshot() to service_role;
