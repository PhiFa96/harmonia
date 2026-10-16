-- Prompt v3 (P2-Abschluss) wurde ohne passenden Spaltenstandard eingeführt; neue Anfragen trugen weiter Version 2.
alter table public.tutor_requests alter column prompt_version set default 3;
