-- P4.19: Stufe-5-Artikel im internen Entwurfsindex unterstützen.
-- Keine Indexbefüllung, Freigabe oder Änderung der RLS-/Publikationsregeln.
alter table public.knowledge_chunks
  drop constraint if exists knowledge_chunks_stage_check;

alter table public.knowledge_chunks
  add constraint knowledge_chunks_stage_check check (stage between 1 and 5);
