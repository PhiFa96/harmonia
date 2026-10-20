-- P3.15: Vorschauartikel der Stufe 3 im bestehenden Wissensindex zulassen.
-- Bereits gespeicherte Stufen 1–2, Identitäten und RLS bleiben erhalten.
alter table public.knowledge_chunks
  drop constraint if exists knowledge_chunks_stage_check;

alter table public.knowledge_chunks
  add constraint knowledge_chunks_stage_check check (stage between 1 and 3);
