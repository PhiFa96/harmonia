-- P3.16: interne Stufe-4-Artikel für den Vorschauindex zulassen.
-- Bestehende Stufen, Identitäten, RLS und Freigabestatus bleiben unberührt.
alter table public.knowledge_chunks
  drop constraint if exists knowledge_chunks_stage_check;

alter table public.knowledge_chunks
  add constraint knowledge_chunks_stage_check check (stage between 1 and 4);
