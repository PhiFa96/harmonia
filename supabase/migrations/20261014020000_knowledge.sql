-- P2.16: atomar ersetzbare, sprachabhängige Wissensbasis. Vorschau nie öffentlich lesen.
create table public.knowledge_indexes (
  lane text primary key check (lane in ('published','preview')),
  snapshot text not null check (snapshot ~ '^[a-f0-9]{64}$'),
  content_version integer not null check (content_version>0),
  article_count integer not null check (article_count between 0 and 1000),
  chunk_count integer not null check (chunk_count between 0 and 5000),
  updated_at timestamptz not null default now(),
  unique(lane,snapshot)
);
create table public.knowledge_chunks (
  lane text not null,
  snapshot text not null,
  id text not null check (id ~ '^[a-f0-9]{64}$'),
  article_id text not null check (article_id ~ '^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$'),
  locale text not null check (locale in ('de','en-US','en-GB')),
  content_version integer not null check (content_version>0),
  status text not null check (status in ('entwurf','in_pruefung','freigegeben')),
  stage integer not null check (stage between 1 and 2),
  section integer not null check (section between 0 and 1000000),
  part integer not null check (part between 0 and 1000000),
  start_char integer not null check (start_char>=0),
  end_char integer not null check (end_char>start_char),
  title text not null check (length(btrim(title)) between 1 and 300),
  heading text not null check (length(btrim(heading)) between 1 and 300),
  body text not null check (length(btrim(body)) between 1 and 1800),
  skill_ids text[] not null check (cardinality(skill_ids) between 1 and 100),
  tsv tsvector generated always as (
    setweight(to_tsvector(case when locale='de' then 'pg_catalog.german'::regconfig else 'pg_catalog.english'::regconfig end,title||' '||heading),'A') ||
    setweight(to_tsvector(case when locale='de' then 'pg_catalog.german'::regconfig else 'pg_catalog.english'::regconfig end,body),'B')
  ) stored,
  primary key(lane,id),
  foreign key(lane,snapshot) references public.knowledge_indexes(lane,snapshot) on delete cascade,
  check (lane<>'published' or status='freigegeben'),
  check (end_char-start_char=length(body))
);
create index knowledge_chunks_fts on public.knowledge_chunks using gin(tsv);
create index knowledge_chunks_skills on public.knowledge_chunks using gin(skill_ids);
create index knowledge_chunks_source on public.knowledge_chunks(lane,locale,article_id,section,part);
alter table public.knowledge_indexes enable row level security;
alter table public.knowledge_chunks enable row level security;
revoke all on public.knowledge_indexes,public.knowledge_chunks from anon,authenticated;
grant select on public.knowledge_indexes,public.knowledge_chunks to anon,authenticated;
grant all on public.knowledge_indexes,public.knowledge_chunks to service_role;
create policy knowledge_indexes_published on public.knowledge_indexes for select to anon,authenticated using(lane='published');
create policy knowledge_chunks_published on public.knowledge_chunks for select to anon,authenticated using(lane='published' and status='freigegeben');

create function public.replace_knowledge_index(target_lane text,new_snapshot text,version integer,article_total integer,entries jsonb)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
declare prior knowledge_indexes;
begin
  if target_lane is null or target_lane not in ('published','preview') or new_snapshot is null or new_snapshot !~ '^[a-f0-9]{64}$' or version is null or version<1 or article_total is null or article_total<0 or article_total>1000 or entries is null or jsonb_typeof(entries)<>'array' or jsonb_array_length(entries)>5000 then raise exception 'Invalid knowledge index'; end if;
  perform pg_advisory_xact_lock(hashtextextended('harmonia.knowledge.'||target_lane,21600));
  select * into prior from knowledge_indexes where lane=target_lane;
  if found then
    if prior.content_version>version then raise exception 'Knowledge version rollback'; end if;
    if prior.snapshot=new_snapshot then
      if prior.content_version<>version or prior.article_count<>article_total or prior.chunk_count<>jsonb_array_length(entries) then raise exception 'Inconsistent knowledge replay'; end if;
      return false;
    end if;
  end if;
  if (select count(distinct value->>'articleId') from jsonb_array_elements(entries))<>article_total or
    exists(select 1 from jsonb_array_elements(entries) where (value->>'contentVersion')::integer>version or (target_lane='published' and value->>'status'<>'freigegeben')) then raise exception 'Inconsistent knowledge index'; end if;
  -- Validierung/Einfügen erfolgt in derselben Transaktion: kein teilweise ersetzter Index sichtbar.
  delete from knowledge_indexes where lane=target_lane;
  insert into knowledge_indexes(lane,snapshot,content_version,article_count,chunk_count) values(target_lane,new_snapshot,version,article_total,jsonb_array_length(entries));
  insert into knowledge_chunks(lane,snapshot,id,article_id,locale,content_version,status,stage,section,part,start_char,end_char,title,heading,body,skill_ids)
  select target_lane,new_snapshot,value->>'id',value->>'articleId',value->>'locale',(value->>'contentVersion')::integer,value->>'status',(value->>'stage')::integer,(value->>'section')::integer,(value->>'part')::integer,(value->>'startChar')::integer,(value->>'endChar')::integer,value->>'title',value->>'heading',value->>'body',array(select jsonb_array_elements_text(value->'skillIds')) from jsonb_array_elements(entries);
  return true;
end $$;

create function public.search_knowledge(target_lane text,expected_snapshot text,language text,question text,skills text[] default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
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
    select id,case when tsv@@exact then 2+ts_rank_cd(tsv,exact,32) when broad is not null and tsv@@broad then ts_rank_cd(tsv,broad,32) else 0 end +
      case when cardinality(skills)>0 and skill_ids&&skills then 0.5 else 0 end as score
    from knowledge_chunks where lane=target_lane and snapshot=expected_snapshot and locale=language and
      ((numnode(exact)>0 and tsv@@exact) or (broad is not null and tsv@@broad) or (cardinality(skills)>0 and skill_ids&&skills))
    order by score desc,id limit 24
  ) ranked;
  return jsonb_build_object('state','ready','hits',hits);
end $$;
revoke all on function public.replace_knowledge_index(text,text,integer,integer,jsonb),public.search_knowledge(text,text,text,text,text[]) from public,anon,authenticated;
grant execute on function public.replace_knowledge_index(text,text,integer,integer,jsonb),public.search_knowledge(text,text,text,text,text[]) to service_role;
-- Promptänderung versionieren; bestehende Nutzungsbelege behalten ihre Version.
alter table public.tutor_requests alter column prompt_version set default 2;
