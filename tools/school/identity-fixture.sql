-- Only the disposable PostgreSQL fixture. Supabase tests use its real auth.uid().
create schema auth;
create function auth.uid() returns uuid language sql stable set search_path='' as $$
 select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
grant usage on schema auth to public;
