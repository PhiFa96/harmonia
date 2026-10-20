-- Review and enable explicitly in the target project; not activated by migrations.
-- Runs only verified stored steps. Bounded backlog: repeat when 100 were closed.
select cron.schedule('harmonia-rush-close','* * * * *',
 $$select public.close_expired_rush(100);$$);
-- retain_rush is also called by the existing privacy-retention Edge job.
