-- P3.19: rank original article text by German/English FTS and short title/heading similarity.
-- The index remains snapshot-bound; this adds no generated answers or external embeddings.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.search_knowledge(
  target_lane text,
  expected_snapshot text,
  language text,
  question text,
  skills text[] default '{}'
) returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare active knowledge_indexes; config regconfig; exact tsquery; broad tsquery; lexemes text[]; hits jsonb;
begin
  if target_lane is null or target_lane not in ('published','preview') or expected_snapshot is null or expected_snapshot !~ '^[a-f0-9]{64}$' or language is null or language not in ('de','en-US','en-GB') or question is null or length(question)>4000 or skills is null or cardinality(skills)>100 then raise exception 'Invalid knowledge search'; end if;
  select * into active from knowledge_indexes where lane=target_lane;
  if not found then return '{"state":"missing","hits":[]}'::jsonb; end if;
  if active.snapshot<>expected_snapshot then return '{"state":"stale","hits":[]}'::jsonb; end if;
  config:=case when language='de' then 'pg_catalog.german'::regconfig else 'pg_catalog.english'::regconfig end;
  exact:=websearch_to_tsquery(config,question);
  lexemes:=tsvector_to_array(to_tsvector(config,question));
  select to_tsquery(config,string_agg(quote_literal(token)||':*',' | ')) into broad from (select token from unnest(lexemes) token limit 32) words;
  select coalesce(jsonb_agg(jsonb_build_object('id',ranked.id,'rank',ranked.score) order by ranked.score desc,ranked.id),'[]'::jsonb) into hits from (
    select id,
      case when tsv@@exact then 2+ts_rank_cd(tsv,exact,32)
        when broad is not null and tsv@@broad then ts_rank_cd(tsv,broad,32)
        else 0 end +
      4*greatest(extensions.word_similarity(title,left(question,512)),
        extensions.word_similarity(heading,left(question,512))) +
      case when cardinality(skills)>0 and skill_ids&&skills then 0.5 else 0 end as score
    from knowledge_chunks where lane=target_lane and snapshot=expected_snapshot and locale=language and
      ((numnode(exact)>0 and tsv@@exact) or (broad is not null and tsv@@broad) or
        (cardinality(skills)>0 and skill_ids&&skills) or
        greatest(extensions.word_similarity(title,left(question,512)),
          extensions.word_similarity(heading,left(question,512)))>0.25)
    order by score desc,id limit 24
  ) ranked;
  return jsonb_build_object('state','ready','hits',hits);
end $$;
