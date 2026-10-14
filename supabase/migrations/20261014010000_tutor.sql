-- P2.15: serverseitiger Tutor, Budgetreservierung und privater Verlauf.
-- Kein Modell/Preis wird geraten; Aktivierung erst mit geprüftem Tarif und Secret.
create table public.tutor_policy (
  id boolean primary key default true check (id),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  policy jsonb not null check (jsonb_typeof(policy)='object'),
  updated_at timestamptz not null default now()
);
insert into public.tutor_policy(id,policy) values (true,'{
  "enabled":false,"model":null,"tariff":null,"effort":"high",
  "maxInputTokens":32000,"maxOutputTokens":1024,"maxRounds":4,"maxToolsPerRound":4,
  "timeoutMs":60000,"requestsPerMinute":6,"globalDailyCostNanoUsd":10000000000,
  "free":{"requests":0,"costNanoUsd":0},"premium":{"requests":30,"costNanoUsd":1000000000},
  "max":{"requests":60,"costNanoUsd":2000000000}
}');
create function public.bump_tutor_policy() returns trigger language plpgsql set search_path=public,pg_catalog as $$
begin
  new.revision:=case when new.policy is distinct from old.policy then old.revision+1 else old.revision end;
  new.updated_at:=clock_timestamp();
  return new;
end $$;
revoke all on function public.bump_tutor_policy() from public,anon,authenticated;
create trigger tutor_policy_revision before update on public.tutor_policy for each row execute function public.bump_tutor_policy();
create table public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null check (entitlement in ('premium','max')),
  active boolean not null default false,
  expires_at timestamptz not null,
  store text not null check (store in ('ios','android','web','manual')),
  updated_at timestamptz not null default now(),
  primary key (user_id,entitlement)
);
create table public.tutor_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  context jsonb not null check (jsonb_typeof(context)='object'),
  context_hash text not null check (length(context_hash)=64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);
create index tutor_conversations_owner on public.tutor_conversations(user_id,created_at desc,id);
create table public.tutor_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.tutor_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content jsonb not null check (jsonb_typeof(content)='object'),
  created_at timestamptz not null default now()
);
create index tutor_messages_conversation on public.tutor_messages(conversation_id,id);
create table public.tutor_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.tutor_conversations(id) on delete set null,
  request_hash text not null check (length(request_hash)=64),
  user_text text not null check (length(user_text)<=4000),
  state text not null default 'reserved' check (state in ('reserved','complete','refused','partial','failed','cancelled')),
  day date not null default (now() at time zone 'UTC')::date,
  reserved_cost bigint not null check (reserved_cost between 0 and 1000000000000),
  cost bigint not null default 0 check (cost between 0 and 1000000000000),
  lease uuid not null default gen_random_uuid(),
  lease_until timestamptz not null default now()+interval '2 minutes',
  policy jsonb not null,
  prompt_version integer not null default 1 check (prompt_version>0),
  tool_version integer not null default 1 check (tool_version>0),
  usage jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index tutor_requests_daily on public.tutor_requests(user_id,day,state);
create index tutor_requests_global on public.tutor_requests(day,state);
create index tutor_requests_conversation on public.tutor_requests(conversation_id,state);
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0 check (requests>=0),
  input_tokens bigint not null default 0 check (input_tokens>=0),
  output_tokens bigint not null default 0 check (output_tokens>=0),
  cache_read_tokens bigint not null default 0 check (cache_read_tokens>=0),
  cache_write_5m_tokens bigint not null default 0 check (cache_write_5m_tokens>=0),
  cache_write_1h_tokens bigint not null default 0 check (cache_write_1h_tokens>=0),
  unknown_cache_write_tokens bigint not null default 0 check (unknown_cache_write_tokens>=0),
  cost_nano_usd bigint not null default 0 check (cost_nano_usd>=0),
  estimated_requests integer not null default 0 check (estimated_requests>=0),
  primary key(user_id,day)
);

alter table public.tutor_policy enable row level security;
alter table public.entitlements enable row level security;
alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;
alter table public.tutor_requests enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.tutor_policy,public.entitlements,public.tutor_conversations,public.tutor_messages,public.tutor_requests,public.ai_usage from anon,authenticated;
grant all on public.tutor_policy,public.entitlements,public.tutor_conversations,public.tutor_messages,public.tutor_requests,public.ai_usage to service_role;
grant usage,select on sequence public.tutor_messages_id_seq to service_role;
grant select on public.entitlements,public.tutor_conversations,public.tutor_messages,public.ai_usage to authenticated;
create policy entitlements_own on public.entitlements for select to authenticated using (user_id=(select auth.uid()));
create policy tutor_conversations_own on public.tutor_conversations for select to authenticated using (user_id=(select auth.uid()));
create policy tutor_messages_own on public.tutor_messages for select to authenticated using (exists (select 1 from public.tutor_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy ai_usage_own on public.ai_usage for select to authenticated using (user_id=(select auth.uid()));

create function public.finish_tutor_request(actor uuid,request_id uuid,lease_id uuid,final_state text,final_usage jsonb,final_result jsonb)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
declare r tutor_requests; u jsonb; charge bigint;
begin
  perform pg_advisory_xact_lock(21500);
  select * into r from tutor_requests where id=request_id and user_id=actor for update;
  if not found or r.lease<>lease_id then return false; end if;
  if r.state<>'reserved' then return r.state=final_state and r.usage=final_usage and r.result=final_result; end if;
  if final_state not in ('complete','refused','partial','failed','cancelled') then raise exception 'Invalid tutor state'; end if;
  u:=final_usage;
  if jsonb_typeof(u)<>'object' or jsonb_typeof(final_result)<>'object' then raise exception 'Invalid tutor result'; end if;
  charge:=(u->>'costNanoUsd')::bigint;
  if charge<0 or charge>1000000000000 or exists (
    select 1 from jsonb_each_text(u) where key in ('inputTokens','outputTokens','cacheReadTokens','cacheWrite5mTokens','cacheWrite1hTokens','unknownCacheWriteTokens') and (value::bigint<0 or value::bigint>10000000)
  ) or not (u ?& array['inputTokens','outputTokens','cacheReadTokens','cacheWrite5mTokens','cacheWrite1hTokens','unknownCacheWriteTokens','costNanoUsd','estimated']) then raise exception 'Invalid tutor usage'; end if;
  insert into ai_usage(user_id,day,requests,input_tokens,output_tokens,cache_read_tokens,cache_write_5m_tokens,cache_write_1h_tokens,unknown_cache_write_tokens,cost_nano_usd,estimated_requests)
  values(actor,r.day,1,(u->>'inputTokens')::bigint,(u->>'outputTokens')::bigint,(u->>'cacheReadTokens')::bigint,(u->>'cacheWrite5mTokens')::bigint,(u->>'cacheWrite1hTokens')::bigint,(u->>'unknownCacheWriteTokens')::bigint,charge,case when (u->>'estimated')::boolean then 1 else 0 end)
  on conflict (user_id,day) do update set requests=ai_usage.requests+1,input_tokens=ai_usage.input_tokens+excluded.input_tokens,output_tokens=ai_usage.output_tokens+excluded.output_tokens,cache_read_tokens=ai_usage.cache_read_tokens+excluded.cache_read_tokens,cache_write_5m_tokens=ai_usage.cache_write_5m_tokens+excluded.cache_write_5m_tokens,cache_write_1h_tokens=ai_usage.cache_write_1h_tokens+excluded.cache_write_1h_tokens,unknown_cache_write_tokens=ai_usage.unknown_cache_write_tokens+excluded.unknown_cache_write_tokens,cost_nano_usd=ai_usage.cost_nano_usd+charge,estimated_requests=ai_usage.estimated_requests+excluded.estimated_requests;
  if r.conversation_id is not null then
    insert into tutor_messages(conversation_id,role,content) values(r.conversation_id,'user',jsonb_build_object('text',r.user_text)),(r.conversation_id,'assistant',final_result);
    update tutor_conversations set updated_at=now() where id=r.conversation_id;
  end if;
  update tutor_requests set state=final_state,usage=u,cost=charge,
    result=case when r.conversation_id is not null then final_result else null end,
    user_text='',finished_at=now() where id=r.id;
  return true;
end $$;

create function public.reserve_tutor_request(actor uuid,request_id uuid,conversation uuid,fingerprint text,scope_hash text,scope jsonb,user_message text,policy_revision bigint,worst_cost bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare p jsonb; rev bigint; r tutor_requests; c tutor_conversations; tier text; allowance jsonb; today date:=(now() at time zone 'UTC')::date; spent bigint; pending bigint; stale tutor_requests;
begin
  perform pg_advisory_xact_lock(21500);
  -- Abgebrochene Prozesse dürfen Budgets nicht zurücksetzen. Ohne Abschluss-Usage gilt die Reservierung als konservative Schätzung.
  for stale in select * from tutor_requests where state='reserved' and lease_until<now() order by lease_until limit 100 loop
    perform finish_tutor_request(stale.user_id,stale.id,stale.lease,'failed',jsonb_build_object('inputTokens',0,'outputTokens',0,'cacheReadTokens',0,'cacheWrite5mTokens',0,'cacheWrite1hTokens',0,'unknownCacheWriteTokens',0,'costNanoUsd',stale.reserved_cost,'estimated',true),'{"text":"","examples":[],"errors":["lease_expired"],"status":"failed"}');
  end loop;
  select * into r from tutor_requests where id=request_id;
  if found then
    if r.user_id<>actor or r.request_hash<>fingerprint then return '{"error":"conflict"}'::jsonb; end if;
    if r.state='reserved' then return '{"error":"busy"}'::jsonb; end if;
    if r.result is null then return '{"error":"deleted"}'::jsonb; end if;
    return jsonb_build_object('replay',true,'result',r.result,'usage',r.usage);
  end if;
  select policy,revision into p,rev from tutor_policy where id for update;
  if rev<>policy_revision then return '{"error":"policy_changed"}'::jsonb; end if;
  if coalesce((p->>'enabled')::boolean,false)=false then return '{"error":"unavailable"}'::jsonb; end if;
  if worst_cost<0 or worst_cost>1000000000000 or length(fingerprint)<>64 or length(scope_hash)<>64 then raise exception 'Invalid reservation'; end if;
  select case when exists (select 1 from entitlements where user_id=actor and entitlement='max' and active and expires_at>now()) then 'max'
    when exists (select 1 from entitlements where user_id=actor and entitlement='premium' and active and expires_at>now()) then 'premium' else 'free' end into tier;
  allowance:=p->tier;
  if coalesce((allowance->>'requests')::integer,0)=0 then return '{"error":"subscription"}'::jsonb; end if;
  if (select count(*) from tutor_requests where user_id=actor and day=today)>=(allowance->>'requests')::integer then return '{"error":"quota"}'::jsonb; end if;
  if (select count(*) from tutor_requests where user_id=actor and created_at>now()-interval '1 minute')>=(p->>'requestsPerMinute')::integer then return '{"error":"rate"}'::jsonb; end if;
  if exists(select 1 from tutor_requests where user_id=actor and state='reserved') then return '{"error":"busy"}'::jsonb; end if;
  select coalesce(cost_nano_usd,0) into spent from ai_usage where user_id=actor and day=today;
  if coalesce(spent,0)+worst_cost>(allowance->>'costNanoUsd')::bigint then return '{"error":"budget"}'::jsonb; end if;
  select coalesce(sum(cost_nano_usd),0) into spent from ai_usage where day=today;
  select coalesce(sum(reserved_cost),0) into pending from tutor_requests where day=today and state='reserved';
  if spent+pending+worst_cost>(p->>'globalDailyCostNanoUsd')::bigint then return '{"error":"budget"}'::jsonb; end if;
  select * into c from tutor_conversations where id=conversation;
  if found and (c.user_id<>actor or c.context_hash<>scope_hash) then return '{"error":"context"}'::jsonb; end if;
  insert into tutor_conversations(id,user_id,context,context_hash) values(conversation,actor,scope,scope_hash) on conflict(id) do nothing;
  insert into tutor_requests(id,user_id,conversation_id,request_hash,user_text,reserved_cost,policy) values(request_id,actor,conversation,fingerprint,user_message,worst_cost,p) returning * into r;
  return jsonb_build_object('lease',r.lease,'tier',tier,'day',r.day,'policy',p);
end $$;

create function public.delete_tutor_conversation(actor uuid,conversation uuid)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
begin
  perform pg_advisory_xact_lock(21500);
  if not exists(select 1 from tutor_conversations where id=conversation and user_id=actor) then return false; end if;
  update tutor_requests set user_text='',result=null where conversation_id=conversation and user_id=actor;
  delete from tutor_conversations where id=conversation and user_id=actor;
  return true;
end $$;
revoke all on function public.reserve_tutor_request(uuid,uuid,uuid,text,text,jsonb,text,bigint,bigint),public.finish_tutor_request(uuid,uuid,uuid,text,jsonb,jsonb),public.delete_tutor_conversation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_tutor_request(uuid,uuid,uuid,text,text,jsonb,text,bigint,bigint),public.finish_tutor_request(uuid,uuid,uuid,text,jsonb,jsonb),public.delete_tutor_conversation(uuid,uuid) to service_role;

create function public.tutor_account_status(actor uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare today date:=(now() at time zone 'UTC')::date; tier text;
begin
  select case when exists(select 1 from entitlements where user_id=actor and entitlement='max' and active and expires_at>now()) then 'max'
    when exists(select 1 from entitlements where user_id=actor and entitlement='premium' and active and expires_at>now()) then 'premium' else 'free' end into tier;
  return jsonb_build_object('day',today,'resetAt',((today+1)::timestamp at time zone 'UTC'),'tier',tier,
    'requestsUsed',(select count(*) from tutor_requests where user_id=actor and day=today),
    'requestsLastMinute',(select count(*) from tutor_requests where user_id=actor and created_at>now()-interval '1 minute'),
    'pending',(select count(*) from tutor_requests where user_id=actor and state='reserved' and lease_until>now()),
    'cost',(select coalesce(sum(cost_nano_usd),0) from ai_usage where user_id=actor and day=today),
    'heldCost',(select coalesce(sum(reserved_cost),0) from tutor_requests where user_id=actor and day=today and state='reserved'),
    'globalCost',(select coalesce(sum(cost_nano_usd),0) from ai_usage where day=today),
    'globalHeldCost',(select coalesce(sum(reserved_cost),0) from tutor_requests where day=today and state='reserved'));
end $$;
revoke all on function public.tutor_account_status(uuid) from public,anon,authenticated;
grant execute on function public.tutor_account_status(uuid) to service_role;
