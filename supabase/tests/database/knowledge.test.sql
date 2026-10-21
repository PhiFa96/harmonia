begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
select ok((select relrowsecurity from pg_class where oid='public.knowledge_indexes'::regclass),'Index RLS');
select ok((select relrowsecurity from pg_class where oid='public.knowledge_chunks'::regclass),'Chunk RLS');
select ok(exists(select 1 from pg_indexes where tablename='knowledge_chunks' and indexdef like '%USING gin (tsv)%'),'Stored full-text GIN index');
select ok(not has_function_privilege('anon','search_knowledge(text,text,text,text,text[])','execute'),'Guest cannot search private index');
select ok(not has_function_privilege('authenticated','replace_knowledge_index(text,text,integer,integer,jsonb)','execute'),'Account cannot replace sources');
select is((select column_default from information_schema.columns where table_schema='public' and table_name='tutor_requests' and column_name='prompt_version'),'5','Prompt version 5 for new requests');
-- Eigenständige Transaktionsdaten; bestehende Indexe am Ende vollständig zurückrollen.
delete from knowledge_indexes;
create function public.knowledge_test_entry(language text,status text default 'entwurf') returns jsonb language sql as $$
  select jsonb_build_object('id',case language when 'de' then repeat('a',64) when 'en-US' then repeat('b',64) else repeat('c',64) end,
    'articleId','test.rhythm.article','locale',language,'contentVersion',13,'status',status,'stage',1,'section',0,'part',0,'startChar',0,
    'endChar',length(case language when 'de' then 'Viertelnoten und Pausen im Takt.' when 'en-US' then 'Quarter notes and rests fill a measure.' else 'Crotchets and rests fill a bar.' end),
    'title','Rhythm','heading','Values','body',case language when 'de' then 'Viertelnoten und Pausen im Takt.' when 'en-US' then 'Quarter notes and rests fill a measure.' else 'Crotchets and rests fill a bar.' end,
    'skillIds',jsonb_build_array('test.rhythm'))
$$;
set local role service_role;
select is(search_knowledge('preview',repeat('d',64),'de','Puls')->>'state','missing','Unconfigured index explicit');
select ok(replace_knowledge_index('preview',repeat('d',64),13,1,jsonb_build_array(knowledge_test_entry('de'),knowledge_test_entry('en-US'),knowledge_test_entry('en-GB'))),'Atomic preview replacement');
select ok(not replace_knowledge_index('preview',repeat('d',64),13,1,jsonb_build_array(knowledge_test_entry('de'),knowledge_test_entry('en-US'),knowledge_test_entry('en-GB'))),'Idempotent replacement');
select is(jsonb_array_length(search_knowledge('preview',repeat('d',64),'de','Viertelnote')->'hits'),1,'German stemming');
select is(search_knowledge('preview',repeat('d',64),'en-US','quarter note')->'hits'->0->>'id',repeat('b',64),'US stemming and exact locale');
select is(search_knowledge('preview',repeat('d',64),'en-GB','crotchet')->'hits'->0->>'id',repeat('c',64),'UK stemming and exact locale');
select is(jsonb_array_length(search_knowledge('preview',repeat('d',64),'en-US','crotchets')->'hits'),0,'UK term never falls through into US');
select is(jsonb_array_length(search_knowledge('preview',repeat('d',64),'de','Galaxienantriebsleistung')->'hits'),0,'Unrelated topic has no invented source');
select is(jsonb_array_length(search_knowledge('preview',repeat('d',64),'de','',array['test.rhythm'])->'hits'),1,'Trusted skill fallback');
select is(search_knowledge('preview',repeat('e',64),'de','Puls')->>'state','stale','Stale snapshot has no hits');
select throws_ok($$select search_knowledge('preview',repeat('d',64),'de',repeat('x',4001))$$,'P0001','Invalid knowledge search','Question bound');
select throws_ok($$select search_knowledge('preview',repeat('d',64),'fr','Puls')$$,'P0001','Invalid knowledge search','Unknown locale rejected');
select throws_ok($$select search_knowledge(null,repeat('d',64),'de','Puls')$$,'P0001','Invalid knowledge search','Null lane rejected');
select throws_ok($$select search_knowledge('preview',null,'de','Puls')$$,'P0001','Invalid knowledge search','Null snapshot rejected');
select throws_ok($$select search_knowledge('preview',repeat('d',64),'de',null)$$,'P0001','Invalid knowledge search','Null question rejected');
select throws_ok($$select replace_knowledge_index('preview',repeat('d',64),14,0,'[]')$$,'P0001','Inconsistent knowledge replay','Same hash cannot change metadata');
select throws_ok($$select replace_knowledge_index('preview',repeat('e',64),12,0,'[]')$$,'P0001','Knowledge version rollback','No old release rollback');
select throws_ok($$select replace_knowledge_index('preview',repeat('e',64),13,0,jsonb_build_array(knowledge_test_entry('de')))$$,'P0001','Inconsistent knowledge index','Article count validated');
select throws_ok($$select replace_knowledge_index('preview',repeat('e',64),13,1,jsonb_build_array(knowledge_test_entry('de'),knowledge_test_entry('de')))$$,'23505',null,'Duplicate chunks fail atomically');
select throws_ok($$select replace_knowledge_index('published',repeat('e',64),13,1,jsonb_build_array(knowledge_test_entry('de')))$$,'P0001','Inconsistent knowledge index','Drafts forbidden in public lane');
select throws_ok($$select replace_knowledge_index('preview',null,13,0,'[]')$$,'P0001','Invalid knowledge index','Null digest rejected');
select is((select snapshot from knowledge_indexes where lane='preview'),repeat('d',64),'Failed replacements preserve old complete snapshot');
select is((select count(*)::integer from knowledge_chunks where lane='preview'),3,'Failed replacements preserve all chunks');
select ok(replace_knowledge_index('published',repeat('e',64),13,1,jsonb_build_array(knowledge_test_entry('de','freigegeben'))),'Reviewed synthetic source publishable');
set local role anon;
select is((select count(*)::integer from knowledge_indexes),1,'Guest sees only public metadata');
select is((select count(*)::integer from knowledge_chunks),1,'Guest sees only reviewed public sources');
select throws_ok($$select search_knowledge('preview',repeat('d',64),'de','Puls')$$,'42501',null,'Private search denied');
select throws_ok($$delete from knowledge_indexes$$,'42501',null,'Guest cannot withdraw sources');
set local role authenticated;
select is((select count(*)::integer from knowledge_chunks),1,'Signed-in readers also see only public sources');
select throws_ok($$update knowledge_chunks set body='poisoned'$$,'42501',null,'Account cannot edit source text');
set local role service_role;
select ok(replace_knowledge_index('preview',repeat('f',64),13,0,'[]'),'Withdrawal uses whole-index transaction');
select is((select count(*)::integer from knowledge_chunks where lane='preview'),0,'Old chunks removed by withdrawal');
select is(jsonb_array_length(search_knowledge('preview',repeat('f',64),'de','Viertelnoten')->'hits'),0,'Withdrawn text no longer searchable');
select is((select count(*)::integer from knowledge_chunks where lane='published'),1,'Withdrawal does not cross lanes');
reset role;
select * from finish();
rollback;
