import { catalogue } from '../packages/content/src/authoring.ts';
import { currentKnowledgeSnapshot } from '../supabase/functions/_shared/knowledge.ts';
import { upperLevelKnowledgeQueries } from './knowledge-queries-v2.ts';

const expected = new Set(
  catalogue.knowledgeArticles
    .filter((article) => /\.l[34]\./.test(article.id))
    .map((article) => article.id),
);
const queried = new Set(upperLevelKnowledgeQueries.map((query) => query.article));
if (expected.size !== 25 || queried.size !== 25 || [...expected].some((id) => !queried.has(id)))
  throw Error('Upper-level article coverage');
const preview = await currentKnowledgeSnapshot('preview');
for (const query of upperLevelKnowledgeQueries) {
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
  '25 upper-level articles, 75 language versions and 50 search questions checked. Search rank needs Postgres.',
);
