import { z } from 'zod';
import {
  contentIdSchema,
  contentStatusSchema,
  contentTextKeySchema,
  exampleSchema,
  exerciseSpecSchema,
} from './schema.ts';

const ids = z
  .array(contentIdSchema)
  .refine((values) => new Set(values).size === values.length, 'Doppelte Referenz');
const metadata = z.object({
  id: contentIdSchema,
  contentVersion: z.number().int().positive(),
  status: contentStatusSchema,
  titleKey: contentTextKeySchema,
});
export const areaSchema = metadata.strict();
export const levelSchema = metadata
  .extend({ areaId: contentIdSchema, number: z.number().int().min(1).max(6) })
  .strict();
export const unitSchema = metadata
  .extend({
    levelId: contentIdSchema,
    /** Omitted preserves the existing lesson sequence. Explicit skill prerequisites still apply. */
    lessonOrder: z.enum(['sequential', 'independent']).optional(),
  })
  .strict();
export const skillSchema = metadata
  .extend({ areaId: contentIdSchema, prerequisites: ids })
  .strict();
export const exerciseSetSchema = metadata
  .extend({
    skillIds: ids.refine((values) => values.length > 0, 'Fähigkeit fehlt'),
    exercises: z
      .array(
        z.object({ spec: exerciseSpecSchema, count: z.number().int().min(1).max(200) }).strict(),
      )
      .nonempty(),
  })
  .strict()
  .refine(
    (set) => set.exercises.reduce((total, entry) => total + entry.count, 0) <= 200,
    'Zu viele Aufgaben',
  );
export const knowledgeCardSchema = metadata
  .extend({
    skillIds: ids,
    bodyKey: contentTextKeySchema,
    examples: z.array(exampleSchema).nonempty(),
  })
  .strict();
export const knowledgeArticleSchema = metadata
  .extend({
    skillIds: ids,
    sections: z
      .array(
        z
          .object({
            headingKey: contentTextKeySchema,
            bodyKey: contentTextKeySchema,
            examples: z.array(exampleSchema),
          })
          .strict(),
      )
      .nonempty(),
  })
  .strict();
export const catalogueLessonSchema = metadata
  .extend({
    unitId: contentIdSchema,
    skillIds: ids.refine((values) => values.length > 0, 'Fähigkeit fehlt'),
    introductionCardIds: ids,
    exerciseSetIds: ids.refine((values) => values.length > 0, 'Übungssatz fehlt'),
  })
  .strict();
export const catalogueSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: z.number().int().positive(),
    areas: z.array(areaSchema),
    levels: z.array(levelSchema),
    units: z.array(unitSchema),
    skills: z.array(skillSchema),
    exerciseSets: z.array(exerciseSetSchema),
    knowledgeCards: z.array(knowledgeCardSchema),
    knowledgeArticles: z.array(knowledgeArticleSchema),
    lessons: z.array(catalogueLessonSchema),
  })
  .strict();
export type ContentCatalogue = z.infer<typeof catalogueSchema>;
export type ContentRecord =
  | ContentCatalogue['lessons'][number]
  | ContentCatalogue['skills'][number]
  | ContentCatalogue['areas'][number];
export const COLLECTIONS = [
  'areas',
  'levels',
  'units',
  'skills',
  'exerciseSets',
  'knowledgeCards',
  'knowledgeArticles',
  'lessons',
] as const;
