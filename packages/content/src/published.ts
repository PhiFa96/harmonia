import data from './published.json' with { type: 'json' };
import { parseCatalogue } from './catalogue.ts';
import stages from './published-knowledge-stages.json' with { type: 'json' };
import { knowledgeStagesSchema } from './knowledge.ts';
import type { ExamTemplate } from './exam.ts';
export const examTemplates: readonly ExamTemplate[] = [];
export const catalogue = parseCatalogue(data);
export const knowledgeStages = knowledgeStagesSchema.parse(stages);
