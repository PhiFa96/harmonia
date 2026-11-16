-- Private backend capability, after complete.sql; never a PostgREST/JWT client role.
-- A deployment operator explicitly grants SET membership to a separate server login.
create role harmonia_school_backend nologin noinherit nosuperuser nocreaterole nocreatedb nobypassrls;
grant harmonia_school_actor to harmonia_school_backend with inherit false, set true;
grant harmonia_school_grader to harmonia_school_backend with inherit false, set true;
grant usage on schema school_draft to harmonia_school_backend;

-- Only the trusted server can resolve a signed account/session pair. No raw Auth
-- data or credentials are granted to the backend, actor or grading roles.
create function school_draft.resolve_identity(account_id uuid, session_id uuid)
returns table(id uuid,key text,kind text)
language sql security definer set search_path='' as $$
 select a.id,a.key,a.kind
 from school_draft.actors a
 join auth.users u on u.id=a.id
 join auth.sessions s on s.user_id=u.id and s.id=session_id
 where a.id=account_id and u.deleted_at is null
 and (u.banned_until is null or u.banned_until<=clock_timestamp())
 and (s.not_after is null or s.not_after>clock_timestamp())
$$;
revoke all on function school_draft.resolve_identity(uuid,uuid) from public;
grant execute on function school_draft.resolve_identity(uuid,uuid) to harmonia_school_backend;
