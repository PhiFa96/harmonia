import { z } from 'zod';
import { updateGlicko2 } from '@harmonia/exercises';
import type { Glicko2Rating } from '@harmonia/exercises';

export const duelRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('find') }).strict(),
  z.object({ action: z.literal('invite'), token: z.uuid() }).strict(),
  z.object({ action: z.literal('accept'), token: z.uuid() }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z
    .object({
      action: z.literal('answer'),
      game: z.uuid(),
      index: z.number().int().min(0).max(10000),
      answer: z.string().min(1).max(4096),
    })
    .strict(),
]);
export type DuelRequest = z.infer<typeof duelRequestSchema>;
const progress = z
  .object({ index: z.number().int().nonnegative(), score: z.number().int().nonnegative() })
  .strict();
const question = z
  .object({ spec: z.unknown(), difficulty: z.number().int().min(1).max(5), seed: z.string() })
  .strict();
export const duelViewSchema = z.discriminatedUnion('phase', [
  z.object({ phase: z.literal('idle') }).strict(),
  z.object({ phase: z.literal('queue'), joinedAt: z.number().int().nonnegative() }).strict(),
  z
    .object({
      phase: z.literal('invite'),
      token: z.uuid(),
      expiresAt: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      phase: z.literal('game'),
      id: z.uuid(),
      kind: z.enum(['live', 'friend', 'ghost']),
      state: z.enum(['active', 'finished']),
      startsAt: z.number().int().nonnegative(),
      deadline: z.number().int().nonnegative(),
      serverNow: z.number().int().nonnegative(),
      own: progress.extend({
        correct: z.number().int().nonnegative(),
        mistakes: z.number().int().nonnegative(),
      }),
      rival: progress,
      ghostScore: z.number().int().nonnegative().nullable(),
      outcome: z.enum(['win', 'loss', 'draw']).nullable(),
      ratingBefore: z.number().nullable(),
      ratingAfter: z.number().nullable(),
      question: question.nullable(),
      last: z
        .object({ index: z.number().int().nonnegative(), answer: z.string(), correct: z.boolean() })
        .strict()
        .nullable(),
    })
    .strict(),
]);
export type DuelView = z.infer<typeof duelViewSchema>;

export interface DuelRatingPlayer extends Glicko2Rating {
  readonly userId: string;
  readonly score: number;
  readonly matches: number;
}
/** One finished live game is one Glicko-2 period for each participant. */
export function rateDuelPair(players: readonly [DuelRatingPlayer, DuelRatingPlayer], at: number) {
  if (
    !Number.isSafeInteger(at) ||
    at < 0 ||
    players[0].userId === players[1].userId ||
    players.some(
      (p) =>
        !Number.isSafeInteger(p.matches) ||
        p.matches < 0 ||
        !Number.isSafeInteger(p.score) ||
        p.score < 0,
    )
  )
    throw new RangeError('Invalid duel result');
  return players.map((player, index) => {
    const rival = players[index === 0 ? 1 : 0];
    const score = player.score > rival.score ? 1 : player.score < rival.score ? 0 : 0.5;
    return {
      userId: player.userId,
      ...updateGlicko2(player, [{ opponent: rival, score }]),
      attempts: player.matches + 1,
      updatedAt: at,
    };
  });
}
