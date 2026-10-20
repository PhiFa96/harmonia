import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import {
  buildKnowledgeSnapshot,
  knowledgeSearchResponseSchema,
  KNOWLEDGE_MAX_DOCUMENTS,
  KNOWLEDGE_DOCUMENT_BUDGET,
} from '../../../packages/content/src/index.ts';
import type {
  KnowledgeSnapshot,
  KnowledgeLane,
  KnowledgeBundle,
  KnowledgeLocale,
  TutorRequest,
} from '../../../packages/content/src/index.ts';
import {
  catalogue as published,
  knowledgeStages,
} from '../../../packages/content/src/published.ts';
import { contentMessages as releasedMessages } from '../../../packages/i18n/src/published-content-messages.ts';
import { contentTranslator } from '../../../packages/i18n/src/instance.ts';
import { hash } from './hash.ts';
import { redactTutorText } from './tutor-prompt.ts';
import { LOCAL_TUTOR_URL } from './tutor-local-fixture.ts';
export function knowledgeLane(env: (name: string) => string | undefined): KnowledgeLane {
  return env('HARMONIA_LOCAL_PREVIEW') === 'true' && LOCAL_TUTOR_URL.test(env('SUPABASE_URL') ?? '')
    ? 'preview'
    : 'published';
}
const snapshots = new Map<KnowledgeLane, Promise<KnowledgeSnapshot>>();
export function currentKnowledgeSnapshot(lane: KnowledgeLane): Promise<KnowledgeSnapshot> {
  let snapshot = snapshots.get(lane);
  if (!snapshot) {
    snapshot = (async () => {
      const catalogue =
          lane === 'preview'
            ? (await import('../../../packages/content/src/authoring.ts')).catalogue
            : published,
        messages =
          lane === 'preview'
            ? (await import('../../../packages/i18n/src/authoring-content-messages.ts'))
                .contentMessages
            : releasedMessages,
        instances = {
          de: contentTranslator('de', messages),
          'en-US': contentTranslator('en-US', messages),
          'en-GB': contentTranslator('en-GB', messages),
        };
      return await buildKnowledgeSnapshot(
        catalogue,
        lane,
        (locale, key) => {
          return instances[locale](key);
        },
        hash,
        lane === 'published' ? knowledgeStages : {},
      );
    })();
    snapshots.set(lane, snapshot);
    void snapshot.catch(() => {
      snapshots.delete(lane);
    });
  }
  return snapshot;
}
export function selectKnowledgeChunks(
  snapshot: KnowledgeSnapshot,
  locale: KnowledgeLocale,
  hits: { id: string }[],
): KnowledgeBundle {
  const known = new Map(snapshot.chunks.filter((c) => c.locale === locale).map((c) => [c.id, c])),
    chunks: KnowledgeBundle['chunks'] = [],
    perArticle = new Map<string, number>();
  let used = 0;
  const include = (hit: { id: string }, distinctOnly: boolean) => {
    const chunk = known.get(hit.id);
    if (
      !chunk ||
      chunks.some((c) => c.id === chunk.id) ||
      (distinctOnly && perArticle.has(chunk.articleId)) ||
      (perArticle.get(chunk.articleId) ?? 0) >= 3
    )
      return;
    const size = new TextEncoder().encode(JSON.stringify(chunk)).length;
    if (used + size > KNOWLEDGE_DOCUMENT_BUDGET) return;
    used += size;
    chunks.push(chunk);
    perArticle.set(chunk.articleId, (perArticle.get(chunk.articleId) ?? 0) + 1);
  };
  // Erste Treffer aus mehreren Artikeln sichern, bevor Abschnitte eines Titels das Budget füllen.
  for (const hit of hits) {
    if (perArticle.size >= 3 || chunks.length >= KNOWLEDGE_MAX_DOCUMENTS) break;
    include(hit, true);
  }
  for (const hit of hits) {
    if (chunks.length >= KNOWLEDGE_MAX_DOCUMENTS) break;
    include(hit, false);
  }
  return {
    lane: snapshot.lane,
    snapshot: snapshot.digest,
    state: chunks.length ? 'ready' : 'empty',
    chunks,
  };
}
export async function retrieveKnowledge(
  client: SupabaseClient,
  request: TutorRequest,
  context: unknown,
): Promise<KnowledgeBundle> {
  const lane = knowledgeLane((key) => Deno.env.get(key)),
    snapshot = await currentKnowledgeSnapshot(lane);
  if (!snapshot.chunks.length)
    return { lane, snapshot: snapshot.digest, state: 'empty', chunks: [] };
  const catalogue =
      lane === 'preview'
        ? (await import('../../../packages/content/src/authoring.ts')).catalogue
        : published,
    id =
      context &&
      typeof context === 'object' &&
      'contentId' in context &&
      typeof context.contentId === 'string'
        ? context.contentId
        : null,
    skills = catalogue.lessons.find((lesson) => lesson.id === id)?.skillIds ?? [];
  const result = await client.rpc('search_knowledge', {
    target_lane: lane,
    expected_snapshot: snapshot.digest,
    language: request.locale,
    question: redactTutorText(request.message),
    skills,
  });
  if (result.error) return { lane, snapshot: snapshot.digest, state: 'unavailable', chunks: [] };
  const parsed = knowledgeSearchResponseSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.state !== 'ready')
    return { lane, snapshot: snapshot.digest, state: 'unavailable', chunks: [] };
  // Modelltexte kommen aus dem versionierten Katalog; manipulierte/unbekannte Datenbankzeilen werden nicht weitergegeben.
  return selectKnowledgeChunks(snapshot, request.locale, parsed.data.hits);
}
