-- Operator template; not executed by migrations or local setup.
-- Bind harmonia_project_url and harmonia_service_role_key in Vault after rollout.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('harmonia-duel-settlement','* * * * *', $job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='harmonia_project_url') || '/functions/v1/duel',
  headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='harmonia_service_role_key')),
  body := '{"action":"sweep"}'::jsonb, timeout_milliseconds := 55000
 );
$job$);
-- One call settles at most 100 games. Monitor non-2xx replies and more=true.
-- Disable: select cron.unschedule('harmonia-duel-settlement');
