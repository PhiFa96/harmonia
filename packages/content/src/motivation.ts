import { z } from 'zod';
import { lessonDay, timeZoneSchema } from './calendar.ts';

const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const rewardRuleSchema = z
  .object({
    version: z.number().int().positive(),
    effectiveAt: time,
    lesson: z.number().int().min(0).max(1000),
    repeat: z.number().int().min(0).max(1000),
    accuracyBonus: z.number().int().min(0).max(1000),
    accuracyPercent: z.number().int().min(80).max(100),
    independentBonus: z.number().int().min(0).max(1000),
    newCoins: z.number().int().min(0).max(1000),
    repeatCoins: z.number().int().min(0).max(1000),
    freezePrice: z.number().int().min(1).max(1000),
    hintWeights: z.tuple([
      z.literal(100),
      z.number().int().min(0).max(100),
      z.number().int().min(0).max(100),
      z.literal(0),
    ]),
  })
  .strict()
  .refine((r) => r.hintWeights[1] >= r.hintWeights[2]);
export type RewardRule = z.infer<typeof rewardRuleSchema>;
export const DEFAULT_REWARD_RULE: RewardRule = {
  version: 1,
  effectiveAt: 0,
  lesson: 10,
  repeat: 5,
  accuracyBonus: 5,
  accuracyPercent: 90,
  independentBonus: 3,
  newCoins: 3,
  repeatCoins: 1,
  freezePrice: 10,
  hintWeights: [100, 90, 80, 0],
};
export function rewardRuleAt(rules: readonly RewardRule[], at: number): RewardRule {
  const rule = [...rules]
    .filter((r) => r.effectiveAt <= at)
    .sort((a, b) => b.effectiveAt - a.effectiveAt || b.version - a.version)[0];
  if (!rule) throw new Error('XP-Regel fehlt');
  return rewardRuleSchema.parse(rule);
}
export const activitySchema = z
  .object({
    id: z.string().min(1).max(256),
    at: time,
    timeZone: timeZoneSchema,
    amount: z.number().int().min(0).max(3000),
    qualified: z.boolean(),
    coins: z.number().int().min(0).max(1000),
  })
  .strict();
export type MotivationActivity = z.infer<typeof activitySchema>;
export const freezePurchaseSchema = z
  .object({
    id: z.uuid(),
    at: time,
    price: z.number().int().min(1).max(1000),
    ruleVersion: z.number().int().positive(),
    timeZone: timeZoneSchema,
  })
  .strict();
export type FreezePurchase = z.infer<typeof freezePurchaseSchema>;
const ordinal = (date: string) => Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000);
/** Reisen wechseln die Kalenderbasis erst nach dem Übergang in der bisherigen Zeitzone. */
export function streakSummary(
  input: readonly MotivationActivity[],
  now: number,
  timeZone: string,
  purchases: readonly FreezePurchase[] = [],
) {
  timeZoneSchema.parse(timeZone);
  const timeline = [
    ...input.filter((a) => a.qualified).map((a) => ({ kind: 'activity' as const, value: a })),
    ...purchases.map((p) => ({ kind: 'purchase' as const, value: p })),
  ]
    .filter((e) => e.value.at <= now)
    .sort(
      (a, b) =>
        a.value.at - b.value.at ||
        (a.kind === b.kind ? a.value.id.localeCompare(b.value.id) : a.kind === 'activity' ? -1 : 1),
    );
  let previous: MotivationActivity | undefined,
    activeDay = 0,
    processedDay = 0,
    current = 0,
    longest = 0,
    earnedDays = 0,
    available = 0,
    used = 0,
    travel = false;
  const refunds: string[] = [];
  function gap(missing: number) {
    if (missing <= 0) return;
    const protectedDays = current > 0 ? Math.min(missing, available) : 0;
    available -= protectedDays;
    used += protectedDays;
    if (missing > protectedDays) {
      current = 0;
      earnedDays = 0;
    }
    processedDay += missing;
  }
  function advance(at: number) {
    if (!previous) return;
    const elapsed = Math.max(
      0,
      ordinal(lessonDay(at, previous.timeZone)) -
        ordinal(lessonDay(previous.at, previous.timeZone)),
    );
    gap(Math.max(0, activeDay + elapsed - 1 - processedDay));
  }
  for (const entry of timeline) {
    if (entry.kind === 'purchase') {
      advance(entry.value.at);
      // Ein später geladener Offline-Tag kann einen früher legalen Kauf überflüssig machen.
      if (available === 2) refunds.push(entry.value.id);
      else available++;
      continue;
    }
    const activity = entry.value;
    if (!previous) {
      activeDay = ordinal(lessonDay(activity.at, activity.timeZone));
      processedDay = activeDay;
      current = 1;
      earnedDays = 1;
    } else {
      const step = Math.max(
        0,
        ordinal(lessonDay(activity.at, previous.timeZone)) -
          ordinal(lessonDay(previous.at, previous.timeZone)),
      );
      travel ||= activity.timeZone !== previous.timeZone;
      if (step > 0) {
        const target = activeDay + step;
        gap(Math.max(0, target - 1 - processedDay));
        current++;
        earnedDays++;
        activeDay = target;
        processedDay = target;
      }
    }
    if (earnedDays >= 7) {
      available = Math.min(2, available + 1);
      earnedDays -= 7;
    }
    longest = Math.max(longest, current);
    previous = activity;
  }
  advance(now);
  return {
    current,
    longest,
    freezesAvailable: available,
    freezesUsed: used,
    daysUntilFreeze: 7 - earnedDays,
    lastActiveDate: previous ? lessonDay(previous.at, previous.timeZone) : null,
    travel,
    refunds,
  };
}
export const streakSchema = z
  .object({
    current: z.number().int().nonnegative(),
    longest: z.number().int().nonnegative(),
    freezesAvailable: z.number().int().min(0).max(2),
    freezesUsed: z.number().int().nonnegative(),
    daysUntilFreeze: z.number().int().min(1).max(7),
    lastActiveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    travel: z.boolean(),
    refunds: z.uuid().array(),
  })
  .strict();
export function motivationSummary(
  activities: readonly MotivationActivity[],
  now: number,
  timeZone: string,
  practicedAt = 0,
  purchases: readonly FreezePurchase[] = [],
) {
  const today = lessonDay(now, timeZone),
    eligible = activities.filter((a) => a.at <= now);
  const streak = streakSummary(eligible, now, timeZone, purchases);
  const spent = purchases
    .filter((p) => p.at <= now && !streak.refunds.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);
  return {
    coins: Math.max(0, eligible.reduce((sum, a) => sum + a.coins, 0) - spent),
    at: now,
    timeZone,
    today,
    totalXP: eligible.reduce((sum, a) => sum + a.amount, 0),
    todayXP: eligible
      .filter((a) => lessonDay(a.at, timeZone) === today)
      .reduce((sum, a) => sum + a.amount, 0),
    practiced:
      (practicedAt <= now && practicedAt > 0 && lessonDay(practicedAt, timeZone) === today) ||
      eligible.some((a) => lessonDay(a.at, timeZone) === today),
    streak,
  };
}
export const motivationSummarySchema = z
  .object({
    coins: z.number().int().nonnegative(),
    at: time,
    timeZone: timeZoneSchema,
    today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    totalXP: z.number().int().nonnegative(),
    todayXP: z.number().int().nonnegative(),
    practiced: z.boolean(),
    streak: streakSchema,
  })
  .strict();
export type MotivationSummary = z.infer<typeof motivationSummarySchema>;
export const motivationPreferencesSchema = z
  .object({
    dailyGoal: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]),
    reminderConsent: z.boolean(),
    reminderTime: z.string().regex(/^(?:0[8-9]|1\d|20):[0-5]\d$/),
    locale: z.enum(['de', 'en-US', 'en-GB']),
    timeZone: timeZoneSchema,
  })
  .strict();
export type MotivationPreferences = z.infer<typeof motivationPreferencesSchema>;
export const motivationRequestSchema = z
  .object({
    rushFormat: z.literal(1).optional(),
    deviceId: z.uuid(),
    deviceKey: z.uuid(),
    deviceRevision: time,
    purchases: freezePurchaseSchema.array().max(20).optional(),
    preferences: motivationPreferencesSchema.optional(),
    initializePreferences: z.boolean().optional(),
    practicedAt: time.optional(),
    remindedAt: time.optional(),
    pushToken: z
      .string()
      .regex(/^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{1,128}\]$/)
      .nullable()
      .optional(),
  })
  .strict();
export const motivationResponseSchema = z
  .object({
    rushActivities: activitySchema.array().max(100000).optional(),
    preferences: motivationPreferencesSchema,
    rules: rewardRuleSchema.array().min(1).max(1000),
    summary: motivationSummarySchema,
    pushAvailable: z.boolean(),
    pushRegistered: z.boolean(),
    remoteReminders: z.boolean().default(false),
    accepted: z.uuid().array().max(20),
    purchases: freezePurchaseSchema.array(),
  })
  .strict();
export type MotivationRequest = z.infer<typeof motivationRequestSchema>;
export type MotivationResponse = z.infer<typeof motivationResponseSchema>;

export const motivationDeviceSchema = z
  .object({ id: z.uuid(), key: z.uuid(), revision: time })
  .strict();
export type MotivationDevice = z.infer<typeof motivationDeviceSchema>;
export const motivationLocalSchema = z
  .object({
    preferences: motivationPreferencesSchema,
    dirty: z.boolean(),
    practicedAt: time,
    rules: rewardRuleSchema.array().min(1).max(1000),
    purchases: z
      .object({
        purchase: freezePurchaseSchema,
        acked: z.boolean(),
        rejected: z.boolean().optional(),
      })
      .strict()
      .array()
      .max(100000),
    server: motivationResponseSchema.nullable(),
    serverEvidenceKey: z.string().nullable().default(null),
    preferencesEstablished: z.boolean().default(false),
  })
  .strict();
export type MotivationLocal = z.infer<typeof motivationLocalSchema>;

export const motivationHistorySchema = z
  .object({
    revision: z.string(),
    activities: activitySchema.array().max(100000),
    purchases: freezePurchaseSchema.array().max(100000),
  })
  .strict();

export const motivationRejectionSchema = z
  .object({
    error: z.enum(['price', 'balance', 'stock']),
    id: z.uuid(),
    accepted: z.uuid().array().max(20),
  })
  .strict();
