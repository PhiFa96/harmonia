-- Only the disposable PostgreSQL fixture. Supabase tests use its real auth.uid().
create schema auth;
-- Minimal provider-owned rows used by the same foreign key and session query as Supabase.
create table auth.users(id uuid primary key, banned_until timestamptz, deleted_at timestamptz);
create table auth.sessions(
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 not_after timestamptz
);
create function auth.uid() returns uuid language sql stable set search_path='' as $$
 select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
grant usage on schema auth to public;
