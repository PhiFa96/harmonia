// Echte SDK-Streamparser und Engine; ausschließlich ersetzter KI-Transport, keine Live-Antworten.
import {
  DEFAULT_TUTOR_POLICY,
  resolveKnowledgeArticle,
  KNOWLEDGE_DOCUMENT_BUDGET,
} from '../packages/content/src/index.ts';
import type {
  KnowledgeBundle,
  KnowledgeChunk,
  TutorRequest,
  TutorPolicy,
} from '../packages/content/src/index.ts';
import { catalogue } from '../packages/content/src/authoring.ts';
import { contentMessages } from '../packages/i18n/src/authoring-content-messages.ts';
import { contentTranslator } from '../packages/i18n/src/instance.ts';
import {
  currentKnowledgeSnapshot,
  selectKnowledgeChunks,
  knowledgeLane,
} from '../supabase/functions/_shared/knowledge.ts';
import {
  knowledgeDocuments,
  validateTutorCitation,
} from '../supabase/functions/_shared/tutor-citations.ts';
import { hash } from '../supabase/functions/_shared/hash.ts';
import { AnthropicTutorProvider } from '../supabase/functions/_shared/tutor-provider.ts';
import { localTutorFetch } from '../supabase/functions/_shared/tutor-local-fixture.ts';
import { runTutor } from '../supabase/functions/_shared/tutor-runtime.ts';
import type { TutorEvent } from '../supabase/functions/_shared/tutor-runtime.ts';
import type { TextCitation } from 'npm:@anthropic-ai/sdk@1.3.0/resources/messages';
let checks = 0;
function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(label);
  checks++;
}
const preview = await currentKnowledgeSnapshot('preview'),
  published = await currentKnowledgeSnapshot('published');
check(
  preview.articleCount === 63 &&
    preview.chunks.length === 1119 &&
    preview.chunks.filter((chunk) => chunk.stage === 3).length === 144 &&
    preview.chunks.filter((chunk) => chunk.stage === 4).length === 156 &&
    preview.chunks.filter((chunk) => chunk.stage === 5).length === 96,
  'All stage 1–5 articles and locales',
);
check(published.chunks.length === 0, 'Unreviewed articles cannot become public sources');
check(
  knowledgeLane((key) =>
    key === 'HARMONIA_LOCAL_PREVIEW' ? 'true' : 'https://remote.supabase.co',
  ) === 'published',
  'Remote preview forbidden',
);
const hits = preview.chunks.map((c) => ({ id: c.id }));
for (const locale of ['de', 'en-US', 'en-GB'] as const) {
  const selected = selectKnowledgeChunks(preview, locale, [
    { id: 'f'.repeat(64) },
    ...hits,
    ...hits,
  ]);
  check(selected.chunks.length > 0 && selected.chunks.length <= 6, 'Bounded retrieval');
  check(
    new Set(selected.chunks.map((c) => c.id)).size === selected.chunks.length,
    'Duplicate/foreign hits ignored',
  );
  check(
    selected.chunks.every((c) => c.locale === locale),
    'No locale leakage',
  );
  check(
    selected.chunks.reduce((n, c) => n + new TextEncoder().encode(JSON.stringify(c)).length, 0) <=
      KNOWLEDGE_DOCUMENT_BUDGET,
    'Source byte budget',
  );
  check(
    [...new Set(selected.chunks.map((c) => c.articleId))].every(
      (id) => selected.chunks.filter((c) => c.articleId === id).length <= 3,
    ),
    'Article diversity',
  );
  // Ein hoch gerankter Artikel mit vielen Abschnitten verdrängt zwei weitere Artikel nicht.
  const byArticle = new Map<string, { id: string }[]>();
  for (const c of preview.chunks.filter((entry) => entry.locale === locale))
    byArticle.set(c.articleId, [...(byArticle.get(c.articleId) ?? []), { id: c.id }]);
  const crowded = [...byArticle.values()].filter((chunks) => chunks.length >= 3).slice(0, 3);
  check(crowded.length === 3, 'Fixture: three articles with at least three sections');
  const diverse = selectKnowledgeChunks(preview, locale, crowded.flat());
  const leading = diverse.chunks.slice(0, 3).map((c) => c.articleId);
  check(
    new Set(leading).size === 3 && new Set(diverse.chunks.map((c) => c.articleId)).size === 3,
    'First round secures three distinct articles before filling by rank',
  );
  const text = contentTranslator(locale, contentMessages);
  for (const chunk of preview.chunks.filter((c) => c.locale === locale)) {
    const source = await resolveKnowledgeArticle(
      catalogue,
      {
        articleId: chunk.articleId,
        version: chunk.contentVersion,
        locale,
        section: chunk.section,
        part: chunk.part,
        digest: chunk.id,
      },
      (_locale, key) => text(key),
      hash,
    );
    check(source?.part.body === chunk.body, 'Every native source link resolves to exact body');
  }
}
const chunk = preview.chunks.find(
  (c) => c.locale === 'de' && c.articleId === 'notation.l1.staff.article',
);
check(chunk, 'Required source');
const bundle: KnowledgeBundle = {
  lane: 'preview',
  snapshot: preview.digest,
  state: 'ready',
  chunks: [chunk],
};
const quote = Array.from(chunk.body).slice(0, 30).join('');
const raw: TextCitation = {
  type: 'char_location',
  document_index: 0,
  document_title: 'Untrusted',
  file_id: null,
  start_char_index: 0,
  end_char_index: 30,
  cited_text: quote,
};
check(
  validateTutorCitation(raw, bundle, 0, 0, 'test')?.title === chunk.title,
  'Title comes from trusted catalogue',
);
for (const bad of [
  { ...raw, document_index: 8 },
  { ...raw, document_index: -1 },
  { ...raw, start_char_index: 0.5 },
  { ...raw, cited_text: 'invented quote' },
  { ...raw, end_char_index: 9999999 },
  { ...raw, file_id: 'external' },
])
  check(validateTutorCitation(bad, bundle, 0, 0, 'test') === null, 'Invalid reference rejected');
const unicode: KnowledgeChunk = { ...chunk, body: '😀 Musik ♯ klingt', startChar: 10, endChar: 26 };
const unicodeBundle = { ...bundle, chunks: [unicode] };
check(
  validateTutorCitation(
    { ...raw, start_char_index: 2, end_char_index: 7, cited_text: 'Musik' },
    unicodeBundle,
    0,
    0,
    'test',
  )?.startChar === 12,
  'Codepoint offsets',
);
check(
  validateTutorCitation(
    { ...raw, start_char_index: 3, end_char_index: 8, cited_text: 'Musik' },
    unicodeBundle,
    0,
    0,
    'test',
  )?.startChar === 12,
  'UTF16 adapters require identical quotation',
);
const policy: TutorPolicy = {
  ...DEFAULT_TUTOR_POLICY,
  enabled: true,
  model: 'synthetic-test-model',
  tariff: {
    version: 'test',
    source: 'https://example.invalid',
    verifiedAt: '2026-10-14T00:00:00Z',
    input: 5000,
    output: 25000,
    cacheRead: 500,
    cacheWrite5m: 6250,
    cacheWrite1h: 10000,
  },
};
const request: TutorRequest = {
  id: '11111111-1111-4111-8111-111111111111',
  conversationId: '22222222-2222-4222-8222-222222222222',
  message: 'fixture:knowledge',
  locale: 'de',
  noteNaming: 'de',
  mode: 'chat',
  hintLevel: null,
  context: null,
};
const captured: Record<string, unknown>[] = [],
  events: TutorEvent[] = [];
const fetcher: typeof fetch = (url, options) => {
  captured.push(
    JSON.parse(typeof options?.body === 'string' ? options.body : '{}') as Record<string, unknown>,
  );
  return localTutorFetch(url, options);
};
const run = (
  message: string,
  knowledge: KnowledgeBundle = bundle,
  extra: Partial<TutorPolicy> = {},
) =>
  runTutor({
    provider: new AnthropicTutorProvider('no-secret', fetcher),
    request: { ...request, message },
    policy: { ...policy, ...extra },
    context: { available: false },
    history: [],
    knowledge,
    signal: new AbortController().signal,
    emit: (e) => {
      events.push(e);
    },
  });
const good = await run('fixture:knowledge');
check(
  good.result.status === 'complete' && good.result.sourceState === 'cited',
  'Native SDK citations accepted',
);
check(good.result.citations?.length === 1, 'Stream and final-message citations deduplicate');
check(
  events.some((e) => e.type === 'citation') &&
    events.some((e) => e.type === 'knowledge' && e.count === 1),
  'SSE sources streamed',
);
check(
  good.result.citations[0]?.quote === Array.from(chunk.body).slice(0, 80).join(''),
  'Exact quoted source',
);
check(
  JSON.stringify(captured[0]).includes('"citations":{"enabled":true}'),
  'Documents supplied before the first call',
);
const calls = captured.length;
const tools = await run('fixture:knowledge fixture:tools');
check(
  tools.result.status === 'complete' &&
    tools.result.citations?.length === 1 &&
    captured.length === calls + 2,
  'Citations survive engine tool continuation',
);
for (const bad of ['fixture:bad-index', 'fixture:bad-quote']) {
  const result = await run('fixture:knowledge ' + bad);
  check(
    result.result.citations?.length === 0 && result.result.errors.includes('invalid_citation'),
    'Invalid native citation never linked',
  );
}
check(
  (await run('fixture:knowledge', { ...bundle, chunks: [], state: 'unavailable' })).result
    .sourceState === 'unavailable',
  'Missing index has explicit source state',
);
check(
  (
    await run('fixture:knowledge', { ...bundle, chunks: [], state: 'empty' })
  ).result.errors.includes('no_library_source'),
  'Unsupported answer marked unsourced',
);
const docs = knowledgeDocuments(bundle.chunks);
check(docs[0]?.source.type === 'text', 'Plain-text citations only');
const beforeTrim = captured.length;
const trimmed = await run('fixture:knowledge', bundle, {
  maxInputTokens: new TextEncoder().encode(JSON.stringify(captured[0])).length - 100,
});
check(
  trimmed.result.citations?.length === 0 && captured.length === beforeTrim + 1,
  'Source trimming still allows an unsourced call',
);
check(
  JSON.stringify(captured.at(-1)).includes('\\"documents\\":0'),
  'Trusted task metadata follows actual trimmed documents',
);
console.log(
  `${String(checks)} Wissensbasis-/SDK-Prüfungen bestanden. Preload benötigt einen Modellaufruf vor der Antwort; Werkzeug-Retrieval mindestens zwei. Keine Live-Qualitäts- oder Kostenmessung.`,
);
