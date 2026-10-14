-- P2.17: Meldungen beziehen sich ausschließlich auf eigene gespeicherte KI-Antworten.
create table public.tutor_reports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.tutor_conversations(id) on delete cascade,
  message_id bigint not null references public.tutor_messages(id) on delete cascade,
  category text not null check(category in ('incorrect','unclear','inappropriate','technical','other')),
  message text not null check(length(message)<=2000),
  created_at timestamptz not null default now()
);
create index tutor_reports_owner on public.tutor_reports(user_id,created_at);
alter table public.tutor_reports enable row level security;
revoke all on public.tutor_reports from anon,authenticated;
grant select on public.tutor_reports to authenticated;
grant all on public.tutor_reports to service_role;
create policy tutor_reports_own on public.tutor_reports for select to authenticated using(user_id=auth.uid());
create function public.submit_tutor_report(actor uuid,report jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_catalog as $$
declare prior tutor_reports; target uuid:=(report->>'conversationId')::uuid; mid bigint:=(report->>'messageId')::bigint; rid uuid:=(report->>'id')::uuid;
begin
  if actor is null or rid is null or target is null or mid is null or mid<1 or report->>'category' is null or report->>'category' not in ('incorrect','unclear','inappropriate','technical','other') or report->>'message' is null or length(report->>'message')>2000 then raise exception 'Invalid tutor report'; end if;
  perform pg_advisory_xact_lock(hashtextextended('harmonia.tutor.report.'||rid,21700));
  if not exists(select 1 from tutor_messages m join tutor_conversations c on c.id=m.conversation_id where m.id=mid and m.role='assistant' and c.id=target and c.user_id=actor) then return '{"error":"missing"}'::jsonb; end if;
  select * into prior from tutor_reports where id=rid;
  if found then
    if prior.user_id<>actor or prior.conversation_id<>target or prior.message_id<>mid or prior.category<>report->>'category' or prior.message<>report->>'message' then return '{"error":"conflict"}'::jsonb; end if;
    return jsonb_build_object('accepted',rid);
  end if;
  insert into tutor_reports(id,user_id,conversation_id,message_id,category,message) values(rid,actor,target,mid,report->>'category',report->>'message');
  return jsonb_build_object('accepted',rid);
end $$;
revoke all on function public.submit_tutor_report(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_tutor_report(uuid,jsonb) to service_role;
