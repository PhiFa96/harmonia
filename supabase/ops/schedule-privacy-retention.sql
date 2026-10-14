-- Manually bind only after rollout of rowFormat=2 clients and approved retention/backup procedures.
-- Populate Vault via the Dashboard: harmonia_project_url, harmonia_service_role_key.
-- This template is not executed by migrations or development setup.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('harmonia-privacy-retention','*/10 * * * *', $job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='harmonia_project_url') || '/functions/v1/privacy-retention',
  headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='harmonia_service_role_key')),
  body := '{}'::jsonb, timeout_milliseconds := 55000
 );
$job$);
-- Monitor HTTP status and more=true; investigate stalled jobs. Stop:
-- select cron.unschedule('harmonia-privacy-retention');
