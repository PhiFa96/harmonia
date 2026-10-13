-- Nur die Engine-geprüfte Edge Function darf Lernnachweise schreiben.
create table public.learning_events (
  sequence bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null check (char_length(client_id) between 1 and 256),
  event jsonb not null check (jsonb_typeof(event) = 'object' and event ? 'kind' and event ? 'id' and event->>'kind' in ('lesson','placement') and event->>'id' = client_id),
  received_at timestamptz not null default now(),
  unique(user_id,client_id)
);
create index learning_events_user_sequence on public.learning_events(user_id,sequence);
alter table public.learning_events enable row level security;
revoke all on public.learning_events from public, anon, authenticated;
grant select on public.learning_events to authenticated;
grant all on public.learning_events to service_role;
grant usage,select on sequence public.learning_events_sequence_seq to service_role;
create policy learning_events_select_own on public.learning_events for select to authenticated using ((select auth.uid()) = user_id);

create function public.append_learning_events(actor uuid, events jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare entry jsonb; previous jsonb;
begin
  if jsonb_typeof(events) is distinct from 'array' or jsonb_array_length(events) > 50 then raise exception 'Invalid learning batch'; end if;
  -- Gleichzeitig eintreffende Wiederholungen derselben Person atomar ordnen.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  for entry in select value from jsonb_array_elements(events) loop
    select event into previous from public.learning_events where user_id=actor and client_id=entry->>'id';
    if found and previous <> entry then raise exception 'Conflicting learning ID'; end if;
    insert into public.learning_events(user_id,client_id,event) values(actor,entry->>'id',entry) on conflict(user_id,client_id) do nothing;
  end loop;
end;
$$;
revoke all on function public.append_learning_events(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.append_learning_events(uuid,jsonb) to service_role;
