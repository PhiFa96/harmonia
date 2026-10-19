import { z } from 'zod';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { publicCatalogue } from './catalogue.ts';
import { contentIdSchema, contentStatusSchema } from './schema.ts';

export const KNOWLEDGE_SCHEMA_VERSION = 1;
export const KNOWLEDGE_LOCALES = ['de', 'en-US', 'en-GB'] as const;
export const KNOWLEDGE_MAX_DOCUMENTS = 6;
export const KNOWLEDGE_DOCUMENT_BUDGET = 6000;
export const knowledgeLocaleSchema = z.enum(KNOWLEDGE_LOCALES);
export type KnowledgeLocale = z.infer<typeof knowledgeLocaleSchema>;
export const knowledgeLaneSchema = z.enum(['published', 'preview']);
export type KnowledgeLane = z.infer<typeof knowledgeLaneSchema>;
export const knowledgeStagesSchema = z.record(
  contentIdSchema,
  z.union([z.literal(1), z.literal(2), z.literal(3)]),
);
export type KnowledgeStages = z.infer<typeof knowledgeStagesSchema>;
export const knowledgeDigestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const position = z.number().int().min(0).max(1000000);
export const knowledgeChunkSchema = z
  .object({
    id: knowledgeDigestSchema,
    articleId: contentIdSchema,
    contentVersion: z.number().int().positive(),
    status: contentStatusSchema,
    locale: knowledgeLocaleSchema,
    stage: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    section: position,
    part: position,
    startChar: position,
    endChar: position,
    title: z.string().trim().min(1).max(300),
    heading: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(3600),
    skillIds: contentIdSchema.array().min(1).max(100),
  })
  .strict()
  .refine(
    (v) =>
      v.endChar > v.startChar &&
      Array.from(v.body).length <= 1800 &&
      Array.from(v.body).length === v.endChar - v.startChar,
  );
export type KnowledgeChunk = z.infer<typeof knowledgeChunkSchema>;
export const knowledgeSnapshotSchema = z
  .object({
    schemaVersion: z.literal(KNOWLEDGE_SCHEMA_VERSION),
    lane: knowledgeLaneSchema,
    contentVersion: z.number().int().positive(),
    digest: knowledgeDigestSchema,
    articleCount: z.number().int().min(0).max(1000),
    chunks: knowledgeChunkSchema.array().max(5000),
  })
  .strict();
export type KnowledgeSnapshot = z.infer<typeof knowledgeSnapshotSchema>;
export const knowledgeSearchResponseSchema = z
  .object({
    state: z.enum(['ready', 'missing', 'stale']),
    hits: z
      .object({ id: knowledgeDigestSchema, rank: z.number().nonnegative() })
      .strict()
      .array()
      .max(24),
  })
  .strict();
export const knowledgeCitationSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
    chunkId: knowledgeDigestSchema,
    snapshot: knowledgeDigestSchema,
    articleId: contentIdSchema,
    contentVersion: z.number().int().positive(),
    locale: knowledgeLocaleSchema,
    section: position,
    part: position,
    title: z.string().min(1).max(300),
    heading: z.string().min(1).max(300),
    quote: z.string().min(1).max(3600),
    startChar: position,
    endChar: position,
    round: z.number().int().min(0).max(5),
    blockIndex: position,
    preview: z.boolean(),
    href: z.string().max(1024),
  })
  .strict()
  .refine(
    (citation) =>
      citation.endChar > citation.startChar &&
      Array.from(citation.quote).length === citation.endChar - citation.startChar &&
      citation.quote.trim().length > 0 &&
      citation.href ===
        knowledgeArticleHref({
          id: citation.chunkId,
          articleId: citation.articleId,
          contentVersion: citation.contentVersion,
          locale: citation.locale,
          section: citation.section,
          part: citation.part,
        }),
  );
export type KnowledgeCitation = z.infer<typeof knowledgeCitationSchema>;
export interface KnowledgeBundle {
  state: 'ready' | 'empty' | 'unavailable';
  snapshot: string;
  lane: KnowledgeLane;
  chunks: KnowledgeChunk[];
}
const targetNumber = z.union([
  z.number(),
  z
    .string()
    .regex(/^\d{1,7}$/)
    .transform(Number),
]);
export const articleTargetSchema = z
  .object({
    articleId: contentIdSchema,
    version: targetNumber.pipe(z.number().int().positive()),
    locale: knowledgeLocaleSchema,
    section: targetNumber.pipe(z.number().int().min(0).max(1000)),
    part: targetNumber.pipe(z.number().int().min(0).max(1000)),
    digest: knowledgeDigestSchema,
  })
  .strict();
export function knowledgeArticleHref(
  chunk: Pick<
    KnowledgeChunk,
    'id' | 'articleId' | 'contentVersion' | 'locale' | 'section' | 'part'
  >,
) {
  return `/article?articleId=${encodeURIComponent(chunk.articleId)}&version=${String(chunk.contentVersion)}&locale=${chunk.locale}&section=${String(chunk.section)}&part=${String(chunk.part)}&digest=${chunk.id}`;
}
/** Gleiche kanonische Textform für Index, Dokumente, Zitatprüfung und Artikelseite. */
export function knowledgeText(value: string) {
  const normalized = value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
  if (!normalized || normalized.includes('\0') || /\$t\(|\{\{/.test(normalized))
    throw new Error('Unresolved knowledge text');
  return normalized;
}
export function splitKnowledgeBody(value: string, limit = 1800) {
  if (!Number.isInteger(limit) || limit < 100 || limit > 1800) throw new RangeError('Chunk limit');
  const chars = Array.from(knowledgeText(value)),
    parts: { body: string; startChar: number; endChar: number }[] = [];
  let start = 0;
  while (start < chars.length) {
    let end = Math.min(chars.length, start + limit);
    if (end < chars.length) {
      for (let at = end; at > start + limit / 2; at--)
        if (/\s/.test(chars[at] ?? '')) {
          end = at;
          break;
        }
    }
    while (end > start && /\s/.test(chars[end - 1] ?? '')) end--;
    parts.push({ body: chars.slice(start, end).join(''), startChar: start, endChar: end });
    start = end;
    while (start < chars.length && /\s/.test(chars[start] ?? '')) start++;
  }
  return parts;
}
/** Status und Stufe werden ausschließlich aus dem Katalog abgeleitet. */
export function knowledgeArticles(
  catalogue: ContentCatalogue,
  lane: KnowledgeLane,
  knownStages: KnowledgeStages = {},
): { article: ContentCatalogue['knowledgeArticles'][number]; stage: 1 | 2 | 3 }[] {
  const levels = new Map(catalogue.levels.map((v) => [v.id, v.number])),
    units = new Map(catalogue.units.map((v) => [v.id, levels.get(v.levelId)])),
    trained = new Map<string, number>();
  for (const lesson of catalogue.lessons) {
    const stage = units.get(lesson.unitId);
    if (stage !== undefined)
      for (const skill of lesson.skillIds)
        trained.set(skill, Math.min(trained.get(skill) ?? Infinity, stage));
  }
  const selected = lane === 'published' ? publicCatalogue(catalogue) : catalogue;
  return selected.knowledgeArticles.flatMap((article) => {
    const stages = article.skillIds.map((id) => trained.get(id) ?? Infinity),
      stage = knownStages[article.id] ?? Math.max(...stages);
    return stage === 1 || stage === 2 || stage === 3 ? [{ article, stage }] : [];
  });
}
export function knowledgeArticleParts(
  article: ContentCatalogue['knowledgeArticles'][number],
  stage: 1 | 2 | 3,
  locale: KnowledgeLocale,
  translate: (key: `content.${string}`) => string,
) {
  const title = knowledgeText(translate(article.titleKey));
  return article.sections.flatMap((section, index) => {
    const heading = knowledgeText(translate(section.headingKey));
    return splitKnowledgeBody(translate(section.bodyKey)).map((text, part) => ({
      articleId: article.id,
      contentVersion: article.contentVersion,
      status: article.status,
      locale,
      stage,
      section: index,
      part,
      title,
      heading,
      skillIds: [...article.skillIds].sort(),
      ...text,
    }));
  });
}
export function knowledgeChunkFingerprint(chunk: Omit<KnowledgeChunk, 'id'>) {
  return JSON.stringify([
    KNOWLEDGE_SCHEMA_VERSION,
    chunk.articleId,
    chunk.contentVersion,
    chunk.status,
    chunk.locale,
    chunk.stage,
    chunk.section,
    chunk.part,
    chunk.startChar,
    chunk.endChar,
    chunk.title,
    chunk.heading,
    chunk.body,
    chunk.skillIds,
  ]);
}
export async function buildKnowledgeSnapshot(
  catalogue: ContentCatalogue,
  lane: KnowledgeLane,
  translate: (locale: KnowledgeLocale, key: `content.${string}`) => string,
  digest: (text: string) => Promise<string>,
  knownStages: KnowledgeStages = {},
): Promise<KnowledgeSnapshot> {
  const articles = knowledgeArticles(catalogue, lane, knownStages),
    chunks: KnowledgeChunk[] = [];
  for (const { article, stage } of articles)
    for (const locale of KNOWLEDGE_LOCALES) {
      for (const part of knowledgeArticleParts(article, stage, locale, (key) =>
        translate(locale, key),
      ))
        chunks.push(
          knowledgeChunkSchema.parse({
            ...part,
            id: await digest(knowledgeChunkFingerprint(part)),
          }),
        );
    }
  chunks.sort((a, b) => a.id.localeCompare(b.id));
  return knowledgeSnapshotSchema.parse({
    schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
    lane,
    contentVersion: catalogue.contentVersion,
    articleCount: articles.length,
    chunks,
    digest: await digest(
      JSON.stringify([
        KNOWLEDGE_SCHEMA_VERSION,
        lane,
        catalogue.contentVersion,
        chunks.map((c) => c.id),
      ]),
    ),
  });
}
/** Ein Quellenlink darf nur die tatsächlich zitierte, noch verfügbare Fassung öffnen. */
export async function resolveKnowledgeArticle(
  catalogue: ContentCatalogue,
  target: unknown,
  translate: (locale: KnowledgeLocale, key: `content.${string}`) => string,
  digest: (text: string) => Promise<string>,
  knownStages: KnowledgeStages = {},
) {
  const parsed = articleTargetSchema.safeParse(target);
  if (!parsed.success) return null;
  const link = parsed.data,
    source = knowledgeArticles(catalogue, 'preview', knownStages).find(
      (a) => a.article.id === link.articleId,
    );
  if (source?.article.contentVersion !== link.version) return null;
  const text = (key: `content.${string}`) => knowledgeText(translate(link.locale, key));
  const parts = knowledgeArticleParts(source.article, source.stage, link.locale, text);
  const part = parts.find((p) => p.section === link.section && p.part === link.part);
  if (!part || (await digest(knowledgeChunkFingerprint(part))) !== link.digest) return null;
  return {
    article: source.article,
    locale: link.locale,
    section: link.section,
    part,
    title: text(source.article.titleKey),
    sections: source.article.sections.map((section) => ({
      heading: text(section.headingKey),
      body: text(section.bodyKey),
      examples: section.examples.map((example) => ({
        ...example,
        caption: text(example.captionKey),
      })),
    })),
  };
}
export type ResolvedKnowledgeArticle = NonNullable<
  Awaited<ReturnType<typeof resolveKnowledgeArticle>>
>;
