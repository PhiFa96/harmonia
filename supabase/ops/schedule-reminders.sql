-- Nach freigegebener Staging-/Produktionsbereitstellung manuell ausführen.
-- Vault vorher im Dashboard befüllen: harmonia_project_url (https://...supabase.co)
-- und harmonia_service_role_key. Niemals echte Schlüssel in diese Datei eintragen.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('harmonia-learning-reminders','* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='harmonia_project_url') || '/functions/v1/reminder-dispatch',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='harmonia_service_role_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);
-- Abschalten: select cron.unschedule('harmonia-learning-reminders');
