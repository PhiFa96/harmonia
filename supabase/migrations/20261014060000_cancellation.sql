-- Public cancellation declarations. Operator processing/confirmation is separate from receipt.
create table public.cancellation_requests (
 id uuid primary key,payload jsonb not null,received_at timestamptz not null default now(),
 status text not null default 'received' check(status in ('received','processing','completed','needs_contact')),
 processed_at timestamptz,provider_reference text
);
alter table public.cancellation_requests enable row level security;
revoke all on public.cancellation_requests from public,anon,authenticated;
grant all on public.cancellation_requests to service_role;
create function public.receive_cancellation(request_id uuid,body jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare previous cancellation_requests; received timestamptz;
begin
 if request_id is null or jsonb_typeof(body) is distinct from 'object' then raise exception 'Invalid cancellation';end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(body->>'email'),1));
 select * into previous from cancellation_requests where id=request_id;
 if found then
  if previous.payload<>body then raise exception 'Cancellation conflict';end if;
  received:=previous.received_at;
 else
  if (select count(*) from cancellation_requests where lower(payload->>'email')=lower(body->>'email') and received_at>now()-interval '1 hour')>=5 then raise exception 'Cancellation rate';end if;
  insert into cancellation_requests(id,payload) values(request_id,body) returning received_at into received;
 end if;
 return jsonb_build_object('id',request_id,'receivedAt',to_char(received at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'status','received');
end $$;
revoke all on function public.receive_cancellation(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.receive_cancellation(uuid,jsonb) to service_role;
