import { catalogue } from '../packages/content/src/authoring.ts';
import { currentKnowledgeSnapshot } from '../supabase/functions/_shared/knowledge.ts';
import { upperLevelKnowledgeQueries } from './knowledge-queries-v2.ts';
import { levelFiveKnowledgeQueries } from './knowledge-queries-level-five.ts';

const queries = [...upperLevelKnowledgeQueries, ...levelFiveKnowledgeQueries];
const expected = new Set(
  catalogue.knowledgeArticles
    .filter((article) => /\.l[345]\./.test(article.id))
    .map((article) => article.id),
);
const queried = new Set(queries.map((query) => query.article));
if (
  expected.size !== 33 ||
  queried.size !== expected.size ||
  queries.length !== queried.size ||
  [...expected].some((id) => !queried.has(id))
)
  throw Error('Upper-level article coverage');
const preview = await currentKnowledgeSnapshot('preview');
for (const query of queries) {
  if ([query.de, query.us, query.deAlternate, query.usAlternate].some((text) => !text.trim()))
    throw Error(`Search question missing for ${query.article}`);
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const sections = new Set(
      preview.chunks
        .filter((chunk) => chunk.articleId === query.article && chunk.locale === locale)
        .map((chunk) => chunk.section),
    );
    if (sections.size !== 4) throw Error(`Four sections missing for ${query.article}/${locale}`);
  }
}
console.log(
  '33 articles across stages 3–5, 99 language versions and 198 localized search probes checked. Search rank needs Postgres.',
);
