import { z } from 'zod';

/** Dynamics are league names, never a measurement of musical proficiency. */
export const LEAGUE_LEVELS = ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff'] as const;
const tier = z.number().int().min(0).max(6);
const week = z.iso.date();
export const leagueSnapshotSchema = z
  .object({
    weekStart: week,
    weekEnd: week,
    tier,
    pushConsent: z.boolean(),
    cohort: z
      .object({
        capacity: z.number().int().min(10).max(100),
        movement: z.number().int().min(1).max(10),
        entries: z
          .array(
            z
              .object({
                slot: z.number().int().min(1).max(100),
                rank: z.number().int().min(1).max(100),
                xp: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
                isYou: z.boolean(),
              })
              .strict(),
          )
          .min(1)
          .max(100),
      })
      .strict()
      .nullable(),
    result: z
      .object({
        weekStart: week,
        tier,
        rank: z.number().int().min(1).max(100),
        xp: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        outcome: z.enum(['promoted', 'stayed', 'relegated']),
        nextTier: tier,
        seen: z.boolean(),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const c = value.cohort;
    if (
      c &&
      (c.entries.length > c.capacity ||
        c.movement * 2 > c.capacity ||
        c.entries.filter((e) => e.isYou).length !== 1 ||
        new Set(c.entries.map((e) => e.slot)).size !== c.entries.length ||
        c.entries.some((e, i) => e.rank !== i + 1 || e.slot > c.capacity))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid league roster' });
    if (
      Date.parse(value.weekEnd) - Date.parse(value.weekStart) !== 7 * 86400000 ||
      new Date(value.weekStart).getUTCDay() !== 1
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid league week' });
  });
export type LeagueSnapshot = z.infer<typeof leagueSnapshotSchema>;
/** Matches the database's non-overlapping zones, including small cohorts. */
export function leagueOutcome(rank: number, size: number, tier: number, movement: number) {
  const places = Math.min(movement, Math.floor(size / 2));
  return rank <= places && tier < 6
    ? 'promoted'
    : rank > size - places && tier > 0
      ? 'relegated'
      : 'stayed';
}
