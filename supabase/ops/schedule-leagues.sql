-- After deployment, as database owner. No external keys or provider calls.
-- Every minute catches up at most 100 cohorts; UTC week boundaries live in SQL.
create extension if not exists pg_cron;
select cron.schedule('harmonia-weekly-leagues','* * * * *',
 $job$ select public.close_league_weeks(now(),100); $job$);
-- Disable: select cron.unschedule('harmonia-weekly-leagues');
-- Check: select jobname,schedule,active from cron.job where jobname='harmonia-weekly-leagues';
-- For a large backlog, repeat until remaining=false; never change client clocks.
