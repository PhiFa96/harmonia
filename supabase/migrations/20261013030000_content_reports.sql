-- P2.13: Konto-Meldungen; Gastmeldungen bleiben bis zur Anmeldung im lokalen Outbox-Speicher.
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  content_id text not null check (char_length(content_id) between 1 and 128),
  content_version integer not null check (content_version > 0),
  message text not null check (char_length(message) <= 2000),
  locale text not null check (locale in ('de','en-US','en-GB')),
  category text not null check (category in ('question','answer','feedback','notation','audio','translation','other')),
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  request jsonb not null check (jsonb_typeof(request) = 'object' and request->>'id' = client_id::text),
  context jsonb not null check (jsonb_typeof(context) = 'object'),
  received_at timestamptz not null default now(),
  unique (user_id,client_id)
);
create index content_reports_user_received on public.content_reports(user_id,received_at);
create index content_reports_review_queue on public.content_reports(status,received_at);
alter table public.content_reports enable row level security;
revoke all on public.content_reports from public, anon, authenticated;
grant select on public.content_reports to authenticated;
grant all on public.content_reports to service_role;
create policy content_reports_select_own on public.content_reports for select to authenticated using ((select auth.uid()) = user_id);

create function public.append_content_reports(actor uuid, entries jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare entry jsonb; report jsonb; previous jsonb;
begin
  if jsonb_typeof(entries) is distinct from 'array' or jsonb_array_length(entries) > 10 then raise exception 'Invalid report batch'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  for entry in select value from jsonb_array_elements(entries) loop
    report := entry->'report';
    select request into previous from public.content_reports where user_id=actor and client_id=(report->>'id')::uuid;
    if found and previous <> report then raise exception 'Conflicting report ID'; end if;
    insert into public.content_reports(user_id,client_id,content_id,content_version,message,locale,category,request,context)
      values(actor,(report->>'id')::uuid,entry->>'content_id',(entry->>'content_version')::integer,report->>'message',report->>'locale',report->>'category',report,jsonb_build_object('item',entry->'item','evaluation',entry->'evaluation'))
      on conflict(user_id,client_id) do nothing;
  end loop;
end;
$$;
revoke all on function public.append_content_reports(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.append_content_reports(uuid,jsonb) to service_role;
