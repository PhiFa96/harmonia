import { z } from 'zod';
import type { ExerciseSpec } from '@harmonia/exercises';
import {
  createRng,
  generateExercise,
  MVP_SCALE_TYPES,
  MVP_TRIAD_TYPES,
  MVP_METERS,
  KNOWLEDGE_TOPICS,
  ORDER_TOPICS,
  LISTENING_QUESTIONS,
} from '@harmonia/exercises';
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
const meterParams = z
  .object({ meters: z.array(z.enum(MVP_METERS)).nonempty(), clefs: noteParams.shape.clefs })
  .strict();
const rhythmParams = meterParams
  .extend({
    tempos: z.array(z.number().int().min(60).max(120)).nonempty().optional(),
    level: z.enum(['basic', 'dotted', 'pulse', 'quarters']).optional(),
    rests: z.boolean().optional(),
    toleranceMs: z.number().int().min(40).max(180).optional(),
  })
  .strict();
const meterIdentifyParams = meterParams
  .extend({ presentation: z.literal('pickup').optional() })
  .strict();
const maxDots = z.union([z.literal(0), z.literal(1)]).optional();
const knowledgeParams = z
  .object({
    topics: z.array(z.enum(KNOWLEDGE_TOPICS)).nonempty(),
    maxDots,
    maxAccidentals: z.union([z.literal(1), z.literal(2)]).optional(),
  })
  .strict();
const knowledgeMcParams = knowledgeParams
  .extend({ presentation: z.enum(['symbol', 'measure-gap']).optional() })
  .strict();
const matchParams = knowledgeParams
  .extend({ count: z.number().int().min(2).max(4).optional() })
  .strict();
const orderParams = z
  .object({
    topics: z.array(z.enum(ORDER_TOPICS)).nonempty(),
    maxDots,
    count: z.number().int().min(3).max(6).optional(),
    direction: z.enum(['ascending', 'descending', 'both']).optional(),
  })
  .strict();
const chordParams = noteParams
  .extend({
    types: z.array(z.enum(MVP_TRIAD_TYPES)).nonempty(),
    roots: z
      .array(z.string().regex(/^[A-G](?:bb|b|##|#)?$/))
      .nonempty()
      .optional(),
    inversions: z
      .array(z.union([z.literal(0), z.literal(1), z.literal(2)]))
      .nonempty()
      .optional(),
  })
  .strict();
const fifths = z.array(z.number().int().min(-7).max(7)).nonempty();
const scaleParams = noteParams
  .extend({
    types: z.array(z.enum(MVP_SCALE_TYPES)).nonempty(),
    fifths: fifths.optional(),
    direction: z.enum(['ascending', 'descending', 'both']).optional(),
  })
  .strict();
const signatureParams = z
  .object({
    clefs: z
      .array(z.enum(['treble', 'bass']))
      .nonempty()
      .optional(),
    modes: z
      .array(z.enum(['major', 'minor']))
      .nonempty()
      .optional(),
    fifths: fifths.optional(),
  })
  .strict();
export const exerciseSpecSchema = z
  .discriminatedUnion('type', [
    z
      .object({
        type: z.literal('LISTENING_CHOICE'),
        params: z
          .object({
            question: z.enum(LISTENING_QUESTIONS),
            tempos: z.array(z.number().int().min(60).max(120)).nonempty().optional(),
          })
          .strict(),
      })
      .strict(),
    z.object({ type: z.literal('KNOWLEDGE_MC'), params: knowledgeMcParams }).strict(),
    z.object({ type: z.literal('MATCH'), params: matchParams }).strict(),
    z.object({ type: z.literal('ORDER'), params: orderParams }).strict(),
    z.object({ type: z.literal('RHYTHM_TAP'), params: rhythmParams }).strict(),
    z.object({ type: z.literal('METER_IDENTIFY'), params: meterIdentifyParams }).strict(),
    z.object({ type: z.literal('CHORD_BUILD'), params: chordParams }).strict(),
    z
      .object({
        type: z.literal('CHORD_IDENTIFY'),
        params: chordParams
          .extend({ presentation: z.enum(['visual', 'aural']).optional() })
          .strict(),
      })
      .strict(),
    z.object({ type: z.literal('SCALE_BUILD'), params: scaleParams }).strict(),
    z.object({ type: z.literal('SCALE_IDENTIFY'), params: scaleParams }).strict(),
    z.object({ type: z.literal('KEYSIG_BUILD'), params: signatureParams }).strict(),
    z.object({ type: z.literal('KEYSIG_IDENTIFY'), params: signatureParams }).strict(),
    z
      .object({
        type: z.literal('NOTE_NAME'),
        params: noteParams.extend({ includeOctave: z.boolean().optional() }).strict(),
      })
      .strict(),
    z.object({ type: z.literal('NOTE_PLACE'), params: noteParams }).strict(),
    z
      .object({
        type: z.literal('KEY_FIND'),
        params: noteParams
          .extend({ presentation: z.enum(['notation', 'name', 'score']).optional() })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal('INTERVAL_BUILD'),
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
        type: z.literal('INTERVAL_IDENTIFY_VISUAL'),
        params: noteParams
          .extend({
            intervals,
            direction: z.enum(['up', 'down', 'both']).optional(),
            question: z
              .enum(['number', 'direction', 'motion', 'semitones', 'quality', 'perfect'])
              .optional(),
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
    if (value.type === 'LISTENING_CHOICE')
      return {
        type: value.type,
        params: {
          question: value.params.question,
          ...(value.params.tempos ? { tempos: value.params.tempos } : {}),
        },
      };
    if (value.type === 'KNOWLEDGE_MC')
      return {
        type: value.type,
        params: {
          ...(value.params.presentation ? { presentation: value.params.presentation } : {}),
          topics: value.params.topics,
          ...(value.params.maxDots === undefined ? {} : { maxDots: value.params.maxDots }),
          ...(value.params.maxAccidentals === undefined
            ? {}
            : { maxAccidentals: value.params.maxAccidentals }),
        },
      };
    if (value.type === 'MATCH')
      return {
        type: value.type,
        params: {
          topics: value.params.topics,
          ...(value.params.maxDots === undefined ? {} : { maxDots: value.params.maxDots }),
          ...(value.params.count === undefined ? {} : { count: value.params.count }),
          ...(value.params.maxAccidentals === undefined
            ? {}
            : { maxAccidentals: value.params.maxAccidentals }),
        },
      };
    if (value.type === 'ORDER')
      return {
        type: value.type,
        params: {
          topics: value.params.topics,
          ...(value.params.maxDots === undefined ? {} : { maxDots: value.params.maxDots }),
          ...(value.params.count === undefined ? {} : { count: value.params.count }),
          ...(value.params.direction ? { direction: value.params.direction } : {}),
        },
      };
    if (value.type === 'RHYTHM_TAP' || value.type === 'METER_IDENTIFY')
      return {
        type: value.type,
        params: {
          meters: value.params.meters,
          ...(value.params.clefs ? { clefs: value.params.clefs } : {}),
          ...(value.type === 'METER_IDENTIFY' && value.params.presentation
            ? { presentation: value.params.presentation }
            : {}),
          ...(value.type === 'RHYTHM_TAP'
            ? {
                ...(value.params.tempos ? { tempos: value.params.tempos } : {}),
                ...(value.params.level ? { level: value.params.level } : {}),
                ...(value.params.rests !== undefined ? { rests: value.params.rests } : {}),
                ...(value.params.toleranceMs !== undefined
                  ? { toleranceMs: value.params.toleranceMs }
                  : {}),
              }
            : {}),
        },
      };
    if (value.type === 'KEYSIG_BUILD' || value.type === 'KEYSIG_IDENTIFY')
      return {
        type: value.type,
        params: {
          ...(value.params.clefs ? { clefs: value.params.clefs } : {}),
          ...(value.params.modes ? { modes: value.params.modes } : {}),
          ...(value.params.fifths ? { fifths: value.params.fifths } : {}),
        },
      };
    const base = {
      ...(value.params.clefs ? { clefs: value.params.clefs } : {}),
      ...(value.params.range ? { range: value.params.range } : {}),
      ...(value.params.maxAccidentals !== undefined
        ? { maxAccidentals: value.params.maxAccidentals }
        : {}),
    };
    if (value.type === 'CHORD_BUILD' || value.type === 'CHORD_IDENTIFY')
      return {
        type: value.type,
        params: {
          ...base,
          types: value.params.types,
          ...(value.params.roots ? { roots: value.params.roots } : {}),
          ...(value.params.inversions ? { inversions: value.params.inversions } : {}),
          ...(value.type === 'CHORD_IDENTIFY' && value.params.presentation
            ? { presentation: value.params.presentation }
            : {}),
        },
      };
    if (value.type === 'SCALE_BUILD' || value.type === 'SCALE_IDENTIFY')
      return {
        type: value.type,
        params: {
          ...base,
          types: value.params.types,
          ...(value.params.direction ? { direction: value.params.direction } : {}),
          ...(value.params.fifths ? { fifths: value.params.fifths } : {}),
        },
      };
    if (value.type === 'KEY_FIND')
      return {
        type: value.type,
        params: {
          ...base,
          ...(value.params.presentation ? { presentation: value.params.presentation } : {}),
        },
      };
    if (value.type === 'NOTE_NAME')
      return {
        type: value.type,
        params: {
          ...base,
          ...(value.params.includeOctave === undefined
            ? {}
            : { includeOctave: value.params.includeOctave }),
        },
      };
    if (value.type === 'NOTE_PLACE') return { type: value.type, params: base };
    if (value.type === 'INTERVAL_IDENTIFY_VISUAL' || value.type === 'INTERVAL_BUILD')
      return {
        type: value.type,
        params: {
          ...base,
          intervals: value.params.intervals,
          ...(value.params.direction ? { direction: value.params.direction } : {}),
          ...(value.type === 'INTERVAL_IDENTIFY_VISUAL' && value.params.question
            ? { question: value.params.question }
            : {}),
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
        code: 'custom',
        message: 'Ungültige Übungsparameter oder keine gültige Aufgabenvariante',
      });
    }
  });
export const contentIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
export const contentTextKeySchema = z
  .string()
  .regex(/^content\.[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+$/)
  .refine(
    (value) =>
      !value.split('.').some((part) => ['constructor', 'prototype', '__proto__'].includes(part)),
    'Unzulässiger Textpfad',
  )
  .transform((value) => value as `content.${string}`);
export const contentStatusSchema = z.enum(['entwurf', 'in_pruefung', 'freigegeben']);
export const exampleSchema = z
  .object({ score: z.string().min(1), captionKey: contentTextKeySchema })
  .extend({
    pulse: z
      .object({ bpm: z.number().int().min(60).max(120) })
      .strict()
      .optional(),
    keyboard: z
      .object({
        first: z.number().int().min(21).max(108),
        last: z.number().int().min(21).max(108),
        showOctaves: z.boolean().optional(),
      })
      .strict()
      .refine((value) => value.first <= value.last, 'Ungültiger Klaviatur-Ausschnitt')
      .optional(),
  })
  .strict()
  .refine((value) => !(value.pulse && value.keyboard), 'Ein Beispiel hat nur eine Darstellungsart');
export const introductionSchema = z
  .object({
    titleKey: contentTextKeySchema,
    bodyKey: contentTextKeySchema,
    examples: z.array(exampleSchema).nonempty(),
  })
  .strict();

/** Aufgelöste Lektion für den vorhandenen Spieler; Aufgabenanzahl ist nicht fest verdrahtet. */
export const lessonSchema = z
  .object({
    id: contentIdSchema,
    contentVersion: z.number().int().positive(),
    status: contentStatusSchema,
    titleKey: contentTextKeySchema,
    introduction: z.array(introductionSchema),
    exercises: z.array(exerciseSpecSchema).min(1).max(200),
  })
  .strict();
export type LessonContent = z.infer<typeof lessonSchema>;
