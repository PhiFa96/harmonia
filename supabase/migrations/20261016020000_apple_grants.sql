-- Provider refresh tokens are encrypted by Supabase Vault, never exposed through client RLS.
create extension if not exists supabase_vault with schema vault;
create table public.apple_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  secret_id uuid not null,
  verified_at timestamptz not null default now()
);
alter table public.apple_grants enable row level security;
revoke all on public.apple_grants from public, anon, authenticated;
grant all on public.apple_grants to service_role;

create function public.save_apple_grant(actor uuid, refresh_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare secret uuid;
begin
  if refresh_token is null or length(refresh_token) < 10 or length(refresh_token) > 8192 then
    raise exception 'Invalid provider grant';
  end if;
  -- The Auth row lock serializes first registration, replacement and account deletion.
  perform 1 from auth.users where id = actor for update;
  if not found then raise exception 'Account unavailable'; end if;
  select secret_id into secret from public.apple_grants where user_id = actor;
  if secret is null then
    select vault.create_secret(refresh_token) into secret;
    insert into public.apple_grants(user_id,secret_id) values(actor,secret);
  else
    perform vault.update_secret(secret,refresh_token);
    update public.apple_grants set verified_at=now() where user_id=actor;
  end if;
end $$;
create function public.read_apple_grant(actor uuid) returns text
language sql stable security definer set search_path = '' as $$
  select v.decrypted_secret from public.apple_grants g
  join vault.decrypted_secrets v on v.id=g.secret_id where g.user_id=actor
$$;
create function private.erase_apple_secret() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where id=old.secret_id;
  return old;
end $$;
create trigger erase_apple_secret after delete on public.apple_grants
for each row execute function private.erase_apple_secret();
revoke all on function public.save_apple_grant(uuid,text),public.read_apple_grant(uuid),private.erase_apple_secret() from public, anon, authenticated;
grant execute on function public.save_apple_grant(uuid,text),public.read_apple_grant(uuid) to service_role;
