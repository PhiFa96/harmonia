import { z } from 'zod';

export const friendsRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('invite'), token: z.uuid() }).strict(),
  z.object({ action: z.literal('accept'), token: z.uuid() }).strict(),
  z.object({ action: z.literal('remove'), friendId: z.uuid() }).strict(),
  z.object({ action: z.literal('block'), friendId: z.uuid() }).strict(),
  z.object({ action: z.literal('unblock'), friendId: z.uuid() }).strict(),
  z.object({ action: z.literal('quest'), friendId: z.uuid() }).strict(),
]);
export type FriendsRequest = z.infer<typeof friendsRequestSchema>;

export const friendsViewSchema = z
  .object({
    invite: z
      .object({ token: z.uuid(), expiresAt: z.number().int().nonnegative() })
      .strict()
      .nullable(),
    friends: z.array(
      z
        .object({
          id: z.uuid(),
          streak: z.number().int().nonnegative(),
          leagueTier: z.number().int().min(0).max(6),
        })
        .strict(),
    ),
    blocked: z.array(z.uuid()),
    badges: z.number().int().nonnegative(),
    questUsed: z.boolean(),
    quest: z
      .object({
        id: z.uuid(),
        week: z.iso.date(),
        friendId: z.uuid(),
        ownXp: z.number().int().nonnegative(),
        friendXp: z.number().int().nonnegative(),
        target: z.literal(300),
        completed: z.boolean(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type FriendsView = z.infer<typeof friendsViewSchema>;
