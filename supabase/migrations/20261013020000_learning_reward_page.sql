-- Ein gemeinsamer Snapshot ohne lange GET-Filter aus bis zu 200 Client-IDs.
create function public.learning_reward_page(actor uuid, after_sequence bigint)
returns table(sequence bigint, event jsonb, reward jsonb)
language sql stable security invoker set search_path = '' as $$
  select e.sequence,e.event,
    case when x.client_id is null then null else jsonb_build_object('amount',x.amount,'date',x.local_date) end
  from public.learning_events e
  left join public.xp_ledger x on x.user_id=e.user_id and x.client_id=e.client_id
  where e.user_id=actor and e.sequence>after_sequence
  order by e.sequence limit 201;
$$;
revoke all on function public.learning_reward_page(uuid,bigint) from public,anon,authenticated;
grant execute on function public.learning_reward_page(uuid,bigint) to service_role;
