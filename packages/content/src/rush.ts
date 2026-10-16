import { z } from 'zod';
import { createRng, generateExercise, evaluateExercise, ratingBucket } from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { exerciseSpecSchema } from './schema.ts';

export const RUSH_MODES = ['three', 'five', 'survival'] as const;
export const RUSH_SCOPES = ['day', 'week', 'all', 'friends'] as const;
export const rushModeSchema = z.enum(RUSH_MODES);
export type RushMode = z.infer<typeof rushModeSchema>;
export const rushPolicySchema = z
  .object({
    version: z.literal(1),
    freeDaily: z.number().int().min(1).max(10),
    paidDaily: z.number().int().min(1).max(100),
    xpCap: z.number().int().min(0).max(30),
    minAnswerMs: z.number().int().min(350).max(3000),
    difficultyEvery: z.number().int().min(3).max(20),
  })
  .strict();
export const DEFAULT_RUSH_POLICY = {
  version: 1,
  freeDaily: 1,
  paidDaily: 100,
  xpCap: 30,
  minAnswerMs: 350,
  difficultyEvery: 5,
} as const;
/** Quota and XP changes must not erase an otherwise comparable all-time record. */
export function rushBankIdentity(pool: RushPool, policy: z.infer<typeof rushPolicySchema>) {
  return JSON.stringify({
    engine: 1,
    pool,
    difficultyEvery: policy.difficultyEvery,
    minAnswerMs: policy.minAnswerMs,
  });
}
const candidateSchema = z
  .object({ spec: exerciseSpecSchema, difficulty: z.number().int().min(1).max(5) })
  .strict();
export const rushPoolSchema = z.array(candidateSchema).min(1).max(256);
export type RushPool = z.infer<typeof rushPoolSchema>;
/** Fast, silent, single-answer tasks; no microphone, playback or timing-input advantage. */
export function rushPool(catalogue: ContentCatalogue): RushPool {
  const types = new Set([
    'NOTE_NAME',
    'INTERVAL_IDENTIFY_VISUAL',
    'SCALE_IDENTIFY',
    'KEYSIG_IDENTIFY',
    'CHORD_IDENTIFY',
    'METER_IDENTIFY',
    'KNOWLEDGE_MC',
    'CONTEXT_CHOICE',
  ]);
  const unique = new Map<string, RushPool[number]>();
  for (const lesson of catalogue.lessons) {
    const unit = catalogue.units.find((u) => u.id === lesson.unitId);
    const level = catalogue.levels.find((l) => l.id === unit?.levelId);
    const siblings = catalogue.lessons.filter((l) => l.unitId === lesson.unitId);
    const stage = Math.min(5, (level?.number ?? 1) * 2 - 1 + Math.min(1, siblings.indexOf(lesson)));
    for (const id of lesson.exerciseSetIds) {
      const set = catalogue.exerciseSets.find((s) => s.id === id);
      for (const { spec } of set?.exercises ?? []) {
        if (
          !types.has(spec.type) ||
          (spec.type === 'CHORD_IDENTIFY' && spec.params.presentation === 'aural')
        )
          continue;
        const key = ratingBucket(spec, set?.contentVersion ?? 1);
        const previous = unique.get(key);
        if (!previous || stage < previous.difficulty) unique.set(key, { spec, difficulty: stage });
      }
    }
  }
  return [...unique.values()]
    .sort(
      (a, b) =>
        a.difficulty - b.difficulty ||
        JSON.stringify(a.spec).localeCompare(JSON.stringify(b.spec), 'en'),
    )
    .slice(0, 256);
}
/** One deterministic task per ordinal; the frozen bank and policy define the competition. */
export function rushQuestion(pool: RushPool, seed: string, index: number, every = 5) {
  if (!Number.isSafeInteger(index) || index < 0 || !pool.length || every < 1)
    throw new RangeError('Invalid Rush question');
  const levels = [...new Set(pool.map((p) => p.difficulty))].sort((a, b) => a - b);
  const difficulty = levels[Math.min(levels.length - 1, Math.floor(index / every))];
  const candidates = pool.filter((p) => p.difficulty === difficulty);
  const rng = createRng(seed + ':select:' + String(index));
  const candidate = rng.pick(candidates);
  return { ...candidate, seed: seed + ':item:' + String(index) };
}
export function gradeRush(question: ReturnType<typeof rushQuestion>, answer: string) {
  return evaluateExercise(generateExercise(question.spec, createRng(question.seed)), answer);
}
export const rushRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), id: z.uuid(), mode: rushModeSchema }).strict(),
  z
    .object({
      action: z.literal('answer'),
      id: z.uuid(),
      index: z.number().int().nonnegative().max(2147483646),
      answer: z.string().min(1).max(4096),
    })
    .strict(),
  z.object({ action: z.literal('finish'), id: z.uuid() }).strict(),
  z.object({ action: z.literal('abandon'), id: z.uuid() }).strict(),
]);
export type RushRequest = z.infer<typeof rushRequestSchema>;
export const rushViewSchema = z
  .object({
    id: z.uuid(),
    mode: rushModeSchema,
    bank: z.string().regex(/^[a-f0-9]{64}$/),
    state: z.enum(['active', 'finished', 'abandoned']),
    startedAt: z.number().int().nonnegative(),
    deadline: z.number().int().nonnegative().nullable(),
    serverNow: z.number().int().nonnegative(),
    index: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    mistakes: z.number().int().min(0).max(3),
    score: z.number().int().nonnegative(),
    xp: z.number().int().min(0).max(30),
    question: candidateSchema.extend({ seed: z.string().min(1).max(256) }).nullable(),
    last: z
      .object({
        index: z.number().int().nonnegative(),
        answer: z.string().max(4096),
        correct: z.boolean(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type RushView = z.infer<typeof rushViewSchema>;
export const rushStatusSchema = z
  .object({
    remaining: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    resetAt: z.number().int().nonnegative(),
    run: rushViewSchema.nullable(),
  })
  .strict();
export type RushStatus = z.infer<typeof rushStatusSchema>;
export const rushLeaderboardSchema = z
  .object({
    mode: rushModeSchema,
    scope: z.enum(RUSH_SCOPES),
    bank: z.string().regex(/^[a-f0-9]{64}$/),
    available: z.boolean(),
    entries: z
      .array(
        z
          .object({
            rank: z.number().int().positive(),
            score: z.number().int().nonnegative(),
            isYou: z.boolean(),
          })
          .strict(),
      )
      .max(51),
  })
  .strict();
export type RushLeaderboard = z.infer<typeof rushLeaderboardSchema>;
