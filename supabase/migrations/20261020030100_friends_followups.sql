-- P3.08 Fachprüfung Befunde 5 und 8 (additiv, ersetzt nur zwei Funktionen):
-- 1) Einladungscodes erzeugt ausschließlich der Server. Ein vom Client geschickter Wert wird
--    weiter auf Vorhandensein geprüft (Vertrag bleibt), aber nie gespeichert; die App zeigt
--    ohnehin den Code aus friend_status.
-- 2) Einfaches Entfernen hebt eine bestehende Blockierung nicht mehr auf.
create or replace function public.friend_invite_create(actor uuid,new_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if actor is null or new_token is null then raise exception 'friend_source';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 delete from public.friend_invites where host_id=actor and used_at is null and expires_at<=clock_timestamp();
 if not exists(select 1 from public.friend_invites where host_id=actor and used_at is null) then
  insert into public.friend_invites(token,host_id,expires_at) values(gen_random_uuid(),actor,clock_timestamp()+interval '7 days');
 end if;
 return public.friend_status(actor);
end $$;
create or replace function public.friend_remove(actor uuid,peer uuid,block_peer boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if actor is null or peer is null or actor=peer then raise exception 'friend_missing';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,2));
 if not pg_try_advisory_xact_lock(hashtextextended(peer::text,2)) then raise exception 'friend_retry';end if;
 if not exists(select 1 from public.friendships where user_id=actor and friend_id=peer) then raise exception 'friend_missing';end if;
 delete from public.friend_quests where (user_a=actor and user_b=peer) or (user_a=peer and user_b=actor);
 delete from public.friendships where user_id=peer and friend_id=actor and status<>'blocked';
 if block_peer then
  update public.friendships set status='blocked' where user_id=actor and friend_id=peer;
 else delete from public.friendships where user_id=actor and friend_id=peer and status<>'blocked';end if;
 return public.friend_status(actor);
end $$;
