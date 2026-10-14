import data from './catalogue.json' with { type: 'json' };
import plan from './curriculum-plan.json' with { type: 'json' };
import { parseCatalogue, resolveLesson } from './catalogue.ts';
import { parseCurriculum } from './curriculum.ts';
import { knowledgeArticles } from './knowledge.ts';
export const catalogue = parseCatalogue(data);
export const knowledgeStages = Object.fromEntries(
  knowledgeArticles(catalogue, 'preview').map(({ article, stage }) => [article.id, stage]),
);
export const curriculumPlan = parseCurriculum(plan, catalogue);
const lesson = resolveLesson(catalogue, 'fundament.reading-and-listening.1');
if (!lesson) throw new Error('Erste Vorschaulektion fehlt');
export const firstLesson = lesson;
