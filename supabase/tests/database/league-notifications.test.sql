begin;
select plan(12);
create temp table queue_fixture as select i,gen_random_uuid() id from generate_series(1,3750) i;
insert into auth.users(id) select id from queue_fixture;
insert into league_accounts(user_id,push_consent) select id,i<=2500 from queue_fixture;
insert into motivation_preferences(user_id,preferences,practiced_at) select id,'{"dailyGoal":20,"reminderConsent":true,"reminderTime":"18:00","timeZone":"UTC","locale":"de"}'::jsonb,1792170000000 from queue_fixture;
insert into privacy_consents(user_id,client_id,purpose,granted,version,locale) select id,gen_random_uuid(),'push',true,'privacy-v1','de' from queue_fixture;
insert into reminder_devices(device_id,user_id,revoke_hash,revision,push_token,lease_until,seen_at,time_zone,locale)
 select gen_random_uuid(),id,'fixture',1,'ExpoPushToken['||i||']','2099-01-01',case when i<=1250 then '2026-10-15'::timestamptz else '2026-10-16'::timestamptz end,'UTC','de' from queue_fixture;
create temp table queue_cohorts as select n,gen_random_uuid() id from generate_series(0,83) n;
insert into league_cohorts(id,week_start,tier,capacity,movement,closed_at) select id,'2026-10-05',0,30,5,'2026-10-12' from queue_cohorts;
insert into league_members(user_id,week_start,cohort_id,slot,xp,joined_at,final_rank,outcome,next_tier,push_attempted_at)
 select f.id,'2026-10-05',c.id,((f.i-1)%30)+1,10,'2026-10-05',((f.i-1)%30)+1,'stayed',0,case when f.i>1250 then '2026-10-16T18:00Z'::timestamptz else null end
 from queue_fixture f join queue_cohorts c on c.n=(f.i-1)/30 where f.i<=2500;
insert into reminder_deliveries(user_id,local_date,status,attempted_at,category) select id,'2026-10-16','sent','2026-10-16T18:00Z','league' from queue_fixture where i between 1251 and 2500;
select is((select count(*)::integer from reminder_candidates('2026-10-16T18:30Z',1000,(select array_agg(id) from queue_fixture))),1000,'Newer processed or already practiced devices cannot starve 1,250 eligible results');
select ok(not exists(select 1 from reminder_candidates('2026-10-16T18:30Z',1000,(select array_agg(id) from queue_fixture)) d join queue_fixture f on f.id=d.user_id where f.i>1250),'Only unprocessed result candidates selected');
-- Simulate one bounded dispatch batch consuming its budget; no provider called.
insert into reminder_deliveries(user_id,local_date,status,attempted_at,category)
 select user_id,'2026-10-16','pending','2026-10-16T18:30Z','league' from reminder_candidates('2026-10-16T18:30Z',1000,(select array_agg(id) from queue_fixture));
select is((select count(*)::integer from reminder_candidates('2026-10-16T18:31Z',1000,(select array_agg(id) from queue_fixture))),250,'Following batch reaches every remaining result');
select is((select count(*)::integer from reminder_candidates('2026-10-16T21:00Z',1000,(select array_agg(id) from queue_fixture))),0,'Quiet hours exclude all categories');
select is((select count(*)::integer from reminder_candidates('2026-10-16T17:59Z',1000,(select array_agg(id) from queue_fixture))),0,'Chosen local notification time respected');
select ok(not has_function_privilege('authenticated','public.reminder_candidates(timestamptz,integer,uuid[])','execute'),'Device tokens never exposed to clients');
select ok(not has_function_privilege('authenticated','public.claim_league_delivery(uuid,date,uuid,date,timestamptz)','execute'),'Client cannot claim notifications');
select throws_ok($$select * from reminder_candidates(now(),1001,null)$$,'P0001','Invalid reminder batch','Unbounded dispatch rejected');
select set_privacy_consent((select id from queue_fixture where i=1),jsonb_build_object('id',gen_random_uuid(),'purpose','push','granted',false,'version','privacy-v1','locale','de'));
select is((select push_consent from league_accounts where user_id=(select id from queue_fixture where i=1)),false,'Global withdrawal clears the league selection');
select is((select push_token is null from reminder_devices where user_id=(select id from queue_fixture where i=1)),true,'Global withdrawal retires registered delivery tokens');
select is((select preferences->>'reminderConsent' from motivation_preferences where user_id=(select id from queue_fixture where i=1)),'false','Global withdrawal clears the learning category');
select set_privacy_consent((select id from queue_fixture where i=1),jsonb_build_object('id',gen_random_uuid(),'purpose','push','granted',true,'version','privacy-v1','locale','de'));
select is((select push_consent from league_accounts where user_id=(select id from queue_fixture where i=1)),false,'Global permission alone cannot reactivate league notifications');
select * from finish();
rollback;
