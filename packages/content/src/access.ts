import { z } from 'zod';
import {
  createFreePracticeSession,
  PRACTICE_CONTENT_VERSION,
  PRACTICE_SETS,
} from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { lessonPlan, isPracticeLesson, practiceSourceLessons } from './lesson-flow.ts';
import { resolveLesson } from './catalogue.ts';

export const accessPolicySchema = z
  .object({
    version: z.literal(1),
    model: z.literal('energy'),
    energyCapacity: z.number().int().min(20).max(1000),
    energyRefillSeconds: z.number().int().min(60).max(86400),
    freeMaxLevel: z.number().int().min(0).max(8),
    checkoutEnabled: z.boolean(),
    adsPrepared: z.literal(true),
    adsEnabled: z.literal(false),
  })
  .strict();
export type AccessPolicy = z.infer<typeof accessPolicySchema>;
export const DEFAULT_ACCESS_POLICY: AccessPolicy = {
  version: 1,
  model: 'energy',
  energyCapacity: 30,
  energyRefillSeconds: 600,
  freeMaxLevel: 2,
  checkoutEnabled: false,
  adsPrepared: true,
  adsEnabled: false,
};
const seed = z.union([
  z.string().min(1).max(128),
  z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
]);
export const accessSourceSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('lesson'),
      lessonId: z.string().min(1).max(128),
      contentVersion: z.number().int().positive(),
      planKey: z.string().max(4096).optional(),
      seed,
    })
    .strict(),
  z
    .object({
      kind: z.literal('practice'),
      set: z.enum(PRACTICE_SETS.filter((s) => s !== 'mini')),
      contentVersion: z.number().int().positive(),
      seed,
    })
    .strict(),
]);
export type AccessSource = z.infer<typeof accessSourceSchema>;
export const accessReserveSchema = z
  .object({ id: z.string().min(1).max(256), source: accessSourceSchema })
  .strict();
export const accessStatusSchema = z
  .object({
    revision: z.number().int().positive(),
    policy: accessPolicySchema,
    tier: z.enum(['free', 'premium', 'max']),
    resetAt: z.iso.datetime({ offset: true }),
    fullAt: z.iso.datetime({ offset: true }),
    used: z.number().int().nonnegative(),
    remaining: z.number().int().nonnegative().nullable(),
  })
  .strict();
export type AccessStatus = z.infer<typeof accessStatusSchema>;
export const accessGrantSchema = z
  .object({
    allowed: z.boolean(),
    reason: z.enum(['allowed', 'limit', 'premium', 'conflict']),
    status: accessStatusSchema,
    id: z.string().max(256),
    cost: z.number().int().nonnegative(),
  })
  .strict();
export type AccessGrant = z.infer<typeof accessGrantSchema>;
/** Counts and level come from the canonical source, never the request. */
export function accessSourceDetails(catalogue: ContentCatalogue, source: AccessSource) {
  if (source.kind === 'practice') {
    if (source.contentVersion !== PRACTICE_CONTENT_VERSION)
      throw new Error('Changed practice source');
    return { cost: createFreePracticeSession(source.set, source.seed).items.length, level: 0 };
  }
  const lesson = source.planKey
    ? lessonPlan(catalogue, source.lessonId, source.planKey)
    : resolveLesson(catalogue, source.lessonId);
  if (
    isPracticeLesson(source.lessonId) &&
    lesson &&
    source.planKey &&
    lesson.contentVersion === source.contentVersion
  ) {
    // All referenced levels count, so mixed practice cannot bypass a future premium level.
    const refs = practiceSourceLessons(source.planKey);
    const levels = refs.map((id) => {
      const record = catalogue.lessons.find((l) => l.id === id);
      const unit = catalogue.units.find((u) => u.id === record?.unitId);
      return catalogue.levels.find((l) => l.id === unit?.levelId)?.number;
    });
    if (!levels.length || levels.some((level) => level === undefined))
      throw new Error('Changed practice level');
    return {
      cost: lesson.exercises.length,
      level: Math.max(...levels.filter((level) => level !== undefined)),
    };
  }
  const record = catalogue.lessons.find((l) => l.id === source.lessonId),
    unit = catalogue.units.find((u) => u.id === record?.unitId);
  if (
    !lesson ||
    !unit ||
    lesson.contentVersion !== source.contentVersion ||
    (source.planKey && (!('planKey' in lesson) || lesson.planKey !== source.planKey))
  )
    throw new Error('Changed lesson source');
  const level = catalogue.levels.find((value) => value.id === unit.levelId);
  if (!level) throw new Error('Changed level source');
  return { cost: lesson.exercises.length, level: level.number };
}
export interface EnergyState {
  balance: number;
  refilledAt: number;
  revision: number;
}
/** Preserve fractional refill time. Clock rollback never grants extra energy. */
export function refillEnergy(
  policy: AccessPolicy,
  previous: EnergyState | null,
  now: number,
  revision = 1,
): EnergyState {
  if (!previous) return { balance: policy.energyCapacity, refilledAt: now, revision };
  const anchor = Math.max(now, previous.refilledAt);
  if (previous.revision !== revision)
    return {
      balance: Math.min(policy.energyCapacity, previous.balance),
      refilledAt: anchor,
      revision,
    };
  const ticks = Math.floor(
    Math.max(0, now - previous.refilledAt) / (policy.energyRefillSeconds * 1000),
  );
  const balance = Math.min(policy.energyCapacity, previous.balance + ticks);
  return {
    balance,
    refilledAt:
      balance === policy.energyCapacity
        ? anchor
        : previous.refilledAt + ticks * policy.energyRefillSeconds * 1000,
    revision,
  };
}
export function guestAccessStatus(
  policy: AccessPolicy,
  state: EnergyState | null,
  now: number,
  revision = 1,
): AccessStatus {
  const energy = refillEnergy(policy, state, now, revision),
    interval = policy.energyRefillSeconds * 1000;
  return {
    revision,
    policy,
    tier: 'free',
    resetAt: new Date(energy.refilledAt + interval).toISOString(),
    fullAt: new Date(
      energy.refilledAt + (policy.energyCapacity - energy.balance) * interval,
    ).toISOString(),
    used: policy.energyCapacity - energy.balance,
    remaining: energy.balance,
  };
}
/** Future ad insertion points: never render during an exercise and never for paid learners. */
export function preparedAdSlot(tier: AccessStatus['tier'], phase: 'exercise' | 'complete') {
  return tier === 'free' && phase === 'complete' ? ('after-session' as const) : null;
}
