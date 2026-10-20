-- A global push withdrawal clears every implemented category. Re-consenting to
-- learning reminders must not silently reactivate an earlier league selection.
create function public.withdraw_league_push() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.purpose='push' and not new.granted then
  update public.league_accounts set push_consent=false where user_id=new.user_id;
 end if;
 return new;
end;
$$;
revoke all on function public.withdraw_league_push() from public,anon,authenticated;
grant execute on function public.withdraw_league_push() to service_role;
create trigger withdraw_league_push after insert on public.privacy_consents for each row execute function public.withdraw_league_push();
