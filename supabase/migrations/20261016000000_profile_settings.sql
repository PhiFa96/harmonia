-- Each patch changes only explicit fields; concurrent devices retain unrelated preferences.
alter table public.profiles add column settings jsonb not null default '{}'::jsonb,
  add column settings_revision bigint not null default 0 check(settings_revision>=0);

create function public.valid_profile_settings(value jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare entry record;
begin
 if jsonb_typeof(value) is distinct from 'object' then return false; end if;
 for entry in select * from jsonb_each(value) loop
  if entry.key='locale' then
   if entry.value not in ('null'::jsonb,'"de"'::jsonb,'"en-US"'::jsonb,'"en-GB"'::jsonb) then return false; end if;
  elsif entry.key='appearance' then
   if entry.value not in ('"system"'::jsonb,'"light"'::jsonb,'"dark"'::jsonb) then return false; end if;
  elsif entry.key in ('haptics','reduceMotion','sound') then
   if jsonb_typeof(entry.value)<>'boolean' then return false; end if;
  elsif entry.key='noteNaming' then
   if entry.value not in ('"auto"'::jsonb,'"de"'::jsonb,'"intl"'::jsonb) then return false; end if;
  elsif entry.key='harmonySystem' then
   if entry.value not in ('"functions"'::jsonb,'"roman"'::jsonb,'"both"'::jsonb) then return false; end if;
  elsif entry.key='referenceHz' then
   if jsonb_typeof(entry.value)<>'number' or entry.value::text !~ '^\d+$' then return false; end if;
   if entry.value::numeric<415 or entry.value::numeric>466 then return false; end if;
  elsif entry.key='goal' then
   if entry.value not in ('"hobby"'::jsonb,'"school"'::jsonb,'"exam"'::jsonb,'"ensemble"'::jsonb) then return false; end if;
  elsif entry.key='experience' then
   if entry.value not in ('"new"'::jsonb,'"basics"'::jsonb,'"experienced"'::jsonb) then return false; end if;
  else return false;
  end if;
 end loop;
 return true;
end; $$;
revoke all on function public.valid_profile_settings(jsonb) from public,anon,authenticated;
-- Constraint evaluation needs only this pure bounded validator, not access to private tables.
grant execute on function public.valid_profile_settings(jsonb) to authenticated;
alter table public.profiles add constraint profiles_settings_valid check(public.valid_profile_settings(settings));

create function public.save_profile_settings(patch jsonb, initialize boolean default false)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous public.profiles; remaining jsonb;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if jsonb_typeof(patch) is distinct from 'object' or octet_length(patch::text)>4096 or patch='{}'::jsonb then raise exception 'Invalid profile patch' using errcode='22023'; end if;
 remaining:=patch-'displayName';
 if not public.valid_profile_settings(remaining) then raise exception 'Invalid profile patch' using errcode='22023'; end if;
 if patch?'displayName' and patch->'displayName'<>'null'::jsonb and
   (jsonb_typeof(patch->'displayName')<>'string' or char_length(btrim(patch->>'displayName'))=0 or char_length(patch->>'displayName')>60) then raise exception 'Invalid display name' using errcode='22023'; end if;
 select * into strict previous from public.profiles where id=actor for update;
 if initialize and previous.settings_revision>0 then return previous; end if;
 update public.profiles set settings=settings||remaining,
  display_name=case when patch?'displayName' then nullif(btrim(patch->>'displayName'),'') else display_name end,
  locale=case when patch?'locale' then coalesce(patch->>'locale','de') else locale end,
  settings_revision=settings_revision+1 where id=actor returning * into previous;
 return previous;
end; $$;
revoke all on function public.save_profile_settings(jsonb,boolean) from public,anon;
grant execute on function public.save_profile_settings(jsonb,boolean) to authenticated;
