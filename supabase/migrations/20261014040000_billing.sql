-- RevenueCat: authenticated receipts and serialized current-subscriber projection.
alter table public.entitlements add column product_id text;
alter table public.entitlements add column will_renew boolean;
alter table public.entitlements add column billing_issue boolean not null default false;
create table public.billing_events (
  event_id text primary key check(length(event_id) between 1 and 256),
  provider text not null default 'revenuecat' check(provider='revenuecat'),
  payload jsonb not null check(jsonb_typeof(payload)='object'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  outcome text check(outcome in ('processed','ignored'))
);
create index billing_events_pending on public.billing_events(received_at) where processed_at is null;
create table public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lease uuid,
  lease_until timestamptz,
  provider_request_ms bigint not null default 0,
  last_attempt_at timestamptz,
  synced_at timestamptz
);
alter table public.billing_events enable row level security;
alter table public.billing_accounts enable row level security;
revoke all on public.billing_events,public.billing_accounts from public,anon,authenticated;
grant all on public.billing_events,public.billing_accounts to service_role;

create function public.billing_receive(receipt jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare existing billing_events;
begin
  insert into billing_events(event_id,payload) values(receipt->'event'->>'id',receipt)
    on conflict(event_id) do nothing;
  select * into existing from billing_events where event_id=receipt->'event'->>'id' for update;
  if existing.payload<>receipt then return jsonb_build_object('state','conflict'); end if;
  if existing.processed_at is not null then return jsonb_build_object('state','done'); end if;
  update billing_events set attempts=attempts+1 where event_id=existing.event_id;
  return jsonb_build_object('state','pending');
end $$;
create function public.billing_claim(actor uuid, throttled boolean) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare account billing_accounts; token uuid;
begin
  if not exists(select 1 from auth.users where id=actor) then return jsonb_build_object('state','missing'); end if;
  insert into billing_accounts(user_id) values(actor) on conflict do nothing;
  select * into account from billing_accounts where user_id=actor for update;
  if account.lease_until>now() then return jsonb_build_object('state','busy'); end if;
  if throttled and account.last_attempt_at>now()-interval '10 seconds' then return jsonb_build_object('state','recent'); end if;
  token:=gen_random_uuid();
  update billing_accounts set lease=token,lease_until=now()+interval '30 seconds',last_attempt_at=now() where user_id=actor;
  return jsonb_build_object('state','claimed','lease',token);
end $$;
create function public.billing_commit(actor uuid,token uuid,request_ms bigint,grants jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare account billing_accounts; item jsonb;
begin
  select * into account from billing_accounts where user_id=actor for update;
  if not found or token is null or account.lease is null or account.lease_until is null or account.lease is distinct from token or account.lease_until<=now() then return false; end if;
  if request_ms<account.provider_request_ms then raise exception 'Stale billing snapshot'; end if;
  if request_ms is null or request_ms<0 or grants is null or jsonb_typeof(grants)<>'array' or jsonb_array_length(grants)>2 then raise exception 'Invalid billing grants'; end if;
  -- Admin-issued temporary grants are preserved. All store grants are replaced by the full snapshot.
  update entitlements set active=false,will_renew=false,updated_at=now() where user_id=actor and store<>'manual';
  for item in select * from jsonb_array_elements(grants) loop
    if item->>'store' not in ('ios','android','web') then raise exception 'Invalid store'; end if;
    insert into entitlements(user_id,entitlement,active,expires_at,store,product_id,will_renew,billing_issue)
    values(actor,item->>'entitlement',(item->>'active')::boolean,(item->>'expires_at')::timestamptz,item->>'store',item->>'product_id',(item->>'will_renew')::boolean,(item->>'billing_issue')::boolean)
    on conflict(user_id,entitlement) do update set active=excluded.active,expires_at=excluded.expires_at,
      store=excluded.store,product_id=excluded.product_id,will_renew=excluded.will_renew,billing_issue=excluded.billing_issue,updated_at=now()
      where entitlements.store<>'manual' or entitlements.expires_at<=now();
  end loop;
  update billing_accounts set lease=null,lease_until=null,provider_request_ms=request_ms,synced_at=now() where user_id=actor;
  return true;
end $$;
create function public.billing_release(actor uuid,token uuid) returns void
language sql security definer set search_path=public,pg_temp as $$
  update billing_accounts set lease=null,lease_until=null where user_id=actor and lease=token;
$$;
revoke all on function public.billing_receive(jsonb),public.billing_claim(uuid,boolean),public.billing_commit(uuid,uuid,bigint,jsonb),public.billing_release(uuid,uuid) from public,anon,authenticated;
grant execute on function public.billing_receive(jsonb),public.billing_claim(uuid,boolean),public.billing_commit(uuid,uuid,bigint,jsonb),public.billing_release(uuid,uuid) to service_role;
