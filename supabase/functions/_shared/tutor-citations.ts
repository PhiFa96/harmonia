import type {
  DocumentBlockParam,
  TextCitation,
} from 'npm:@anthropic-ai/sdk@0.133.0/resources/messages';
import {
  knowledgeCitationSchema,
  knowledgeArticleHref,
} from '../../../packages/content/src/index.ts';
import type {
  KnowledgeBundle,
  KnowledgeCitation,
  KnowledgeChunk,
} from '../../../packages/content/src/index.ts';
export function knowledgeDocuments(chunks: KnowledgeChunk[]): DocumentBlockParam[] {
  return chunks.map((chunk) => ({
    type: 'document',
    source: { type: 'text', media_type: 'text/plain', data: chunk.body },
    title: chunk.title + ' — ' + chunk.heading,
    context: JSON.stringify({
      articleId: chunk.articleId,
      contentVersion: chunk.contentVersion,
      locale: chunk.locale,
      section: chunk.section,
      part: chunk.part,
    }),
    citations: { enabled: true },
  }));
}
/** Nur native Plaintext-Zitate mit einem nachweislich passenden Textbereich werden zu App-Links. */
export function validateTutorCitation(
  raw: TextCitation,
  bundle: KnowledgeBundle,
  round: number,
  blockIndex: number,
  id: string,
): KnowledgeCitation | null {
  if (
    raw.type !== 'char_location' ||
    !Number.isInteger(raw.document_index) ||
    raw.document_index < 0 ||
    !Number.isInteger(raw.start_char_index) ||
    !Number.isInteger(raw.end_char_index) ||
    raw.start_char_index < 0 ||
    raw.end_char_index <= raw.start_char_index ||
    raw.file_id !== null
  )
    return null;
  const chunk = bundle.chunks[raw.document_index];
  if (!chunk) return null;
  const chars = Array.from(chunk.body);
  let start = raw.start_char_index,
    end = raw.end_char_index;
  if (chars.slice(start, end).join('') !== raw.cited_text || end > chars.length) {
    // Manche Adapter verwenden UTF-16-Einheiten. Auch dann muss das genaue Zitat passen.
    if (end > chunk.body.length || chunk.body.slice(start, end) !== raw.cited_text) return null;
    start = Array.from(chunk.body.slice(0, start)).length;
    end = start + Array.from(raw.cited_text).length;
    if (chars.slice(start, end).join('') !== raw.cited_text) return null;
  }
  const parsed = knowledgeCitationSchema.safeParse({
    id,
    chunkId: chunk.id,
    snapshot: bundle.snapshot,
    articleId: chunk.articleId,
    contentVersion: chunk.contentVersion,
    locale: chunk.locale,
    section: chunk.section,
    part: chunk.part,
    title: chunk.title,
    heading: chunk.heading,
    quote: raw.cited_text,
    startChar: chunk.startChar + start,
    endChar: chunk.startChar + end,
    round,
    blockIndex,
    preview: bundle.lane === 'preview',
    href: knowledgeArticleHref(chunk),
  });
  return parsed.success ? parsed.data : null;
}
