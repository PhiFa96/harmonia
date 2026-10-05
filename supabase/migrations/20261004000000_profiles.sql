-- Das Konto ist die einzige Quelle für die Profil-ID. Nutzermetadaten sind untrusted.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'de',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check check (
    display_name is null or (
      char_length(display_name) <= 60 and char_length(btrim(display_name)) > 0
    )
  ),
  constraint profiles_locale_check check (locale in ('de', 'en-US', 'en-GB'))
);

alter table public.profiles enable row level security;

-- Auch mit gültiger Session sind IDs und Audit-Felder nur serverseitig schreibbar.
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke all on function private.create_profile_for_user() from public, anon, authenticated;

create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function private.create_profile_for_user();

-- Auch bei Anwendung der Migration auf bereits vorhandene Konten vollständig.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create function private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function private.touch_profile_updated_at() from public, anon, authenticated;

create trigger touch_profile_before_update
  before update on public.profiles
  for each row execute function private.touch_profile_updated_at();
