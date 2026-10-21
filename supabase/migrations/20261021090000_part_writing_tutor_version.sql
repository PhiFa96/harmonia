-- P4.10: version metadata only; no deployment or feature enablement.
alter table public.tutor_requests alter column prompt_version set default 5;
