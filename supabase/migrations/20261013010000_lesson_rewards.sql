-- Gutschriften kommen ausschließlich aus nachgerechneten Lektionsantworten.
create table public.xp_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  lesson_id text not null,
  content_version integer not null check (content_version > 0),
  amount integer not null check (amount between 0 and 18),
  local_date date not null,
  rule_version integer not null default 1 check (rule_version = 1),
  created_at timestamptz not null default now(),
  primary key(user_id,client_id),
  foreign key(user_id,client_id) references public.learning_events(user_id,client_id) on delete cascade
);
create index xp_ledger_lesson on public.xp_ledger(user_id,lesson_id,content_version);
alter table public.xp_ledger enable row level security;
revoke all on public.xp_ledger from public,anon,authenticated;
grant select on public.xp_ledger to authenticated;
grant all on public.xp_ledger to service_role;
create policy xp_ledger_select_own on public.xp_ledger for select to authenticated using ((select auth.uid()) = user_id);

create function public.append_learning_results(actor uuid, events jsonb, rewards jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare receipt jsonb; source jsonb; awarded integer; prior boolean;
begin
  if jsonb_typeof(rewards) is distinct from 'array' or jsonb_array_length(rewards) > 50 then raise exception 'Invalid rewards'; end if;
  -- Beide Buchungen teilen die Kontosperre und dieselbe Transaktion.
  perform public.append_learning_events(actor,events);
  for receipt in select value from jsonb_array_elements(rewards) loop
    select value into source from jsonb_array_elements(events) where value->>'id' = receipt->>'id';
    if not found or source->>'kind' <> 'lesson' or not (source ? 'timeZone') then raise exception 'Missing reward evidence'; end if;
    if exists(select 1 from public.xp_ledger where user_id=actor and client_id=receipt->>'id') then continue; end if;
    select exists(select 1 from public.xp_ledger where user_id=actor and lesson_id=source->>'lessonId' and content_version=(source->>'contentVersion')::integer and amount > 0) into prior;
    awarded := (receipt->>(case when prior then 'repeatAmount' else 'newAmount' end))::integer;
    if awarded is null or awarded < 0 or awarded > (case when prior then 13 else 18 end) then raise exception 'Invalid reward amount'; end if;
    insert into public.xp_ledger(user_id,client_id,lesson_id,content_version,amount,local_date)
      values(actor,receipt->>'id',source->>'lessonId',(source->>'contentVersion')::integer,awarded,(receipt->>'date')::date);
  end loop;
end;
$$;
revoke all on function public.append_learning_results(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.append_learning_results(uuid,jsonb,jsonb) to service_role;
