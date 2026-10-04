import { z } from 'zod';
import type { ExerciseSpec } from '@harmonia/exercises';
import { createRng, generateExercise } from '@harmonia/exercises';
const range = z
  .object({
    minMidi: z.number().int().min(21).max(108),
    maxMidi: z.number().int().min(21).max(108),
  })
  .strict()
  .refine((value) => value.minMidi <= value.maxMidi, 'Ungültiger Tonumfang');
const noteParams = z
  .object({
    clefs: z
      .array(z.enum(['treble', 'bass']))
      .nonempty()
      .optional(),
    range: range.optional(),
    maxAccidentals: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  })
  .strict();
const intervals = z.array(z.string().regex(/^(?:P|m|M|A|d)(?:[1-9]|1[0-5])$/)).nonempty();
export const exerciseSpecSchema = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('NOTE_NAME'), params: noteParams }).strict(),
    z
      .object({
        type: z.literal('INTERVAL_IDENTIFY_VISUAL'),
        params: noteParams
          .extend({
            intervals,
            direction: z.enum(['up', 'down', 'both']).optional(),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal('INTERVAL_IDENTIFY_AURAL'),
        params: noteParams
          .extend({
            intervals,
            playback: z.enum(['melodic-up', 'melodic-down', 'harmonic']).optional(),
          })
          .strict(),
      })
      .strict(),
  ])
  .transform((value): ExerciseSpec => {
    const base = {
      ...(value.params.clefs ? { clefs: value.params.clefs } : {}),
      ...(value.params.range ? { range: value.params.range } : {}),
      ...(value.params.maxAccidentals !== undefined
        ? { maxAccidentals: value.params.maxAccidentals }
        : {}),
    };
    if (value.type === 'NOTE_NAME') return { type: value.type, params: base };
    if (value.type === 'INTERVAL_IDENTIFY_VISUAL')
      return {
        type: value.type,
        params: {
          ...base,
          intervals: value.params.intervals,
          ...(value.params.direction ? { direction: value.params.direction } : {}),
        },
      };
    return {
      type: value.type,
      params: {
        ...base,
        intervals: value.params.intervals,
        ...(value.params.playback ? { playback: value.params.playback } : {}),
      },
    };
  })
  .superRefine((spec, context) => {
    try {
      generateExercise(spec, createRng('content-validation'));
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ungültige Übungsparameter oder unmöglicher Tonumfang',
      });
    }
  });
export const lessonSchema = z
  .object({
    id: z.string().min(1),
    contentVersion: z.number().int().positive(),
    status: z.enum(['entwurf', 'in_pruefung', 'freigegeben']),
    titleKey: z.literal('lesson.title'),
    introduction: z
      .array(
        z
          .object({
            titleKey: z.enum(['lesson.notesTitle', 'lesson.intervalsTitle', 'lesson.hearingTitle']),
            bodyKey: z.enum(['lesson.notesBody', 'lesson.intervalsBody', 'lesson.hearingBody']),
            examples: z
              .array(
                z
                  .object({
                    score: z.string().min(1),
                    captionKey: z.enum([
                      'lesson.referenceG',
                      'lesson.minorThird',
                      'lesson.majorThird',
                      'lesson.fourth',
                      'lesson.fifth',
                    ]),
                  })
                  .strict(),
              )
              .nonempty(),
          })
          .strict(),
      )
      .nonempty(),
    exercises: z.array(exerciseSpecSchema).length(10),
  })
  .strict();
export type LessonContent = z.infer<typeof lessonSchema>;
