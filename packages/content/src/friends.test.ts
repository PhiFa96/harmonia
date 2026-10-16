import { describe, expect, it } from 'vitest';
import { friendsRequestSchema, friendsViewSchema } from './friends.ts';

const id = 'a3080000-0000-4000-8000-000000000001';
describe('friend API boundary', () => {
  it('only accepts random invitation codes and friend IDs, not identity search fields', () => {
    expect(friendsRequestSchema.safeParse({ action: 'accept', token: id }).success).toBe(true);
    expect(
      friendsRequestSchema.safeParse({ action: 'accept', token: id, email: 'x@y.test' }).success,
    ).toBe(false);
    expect(friendsRequestSchema.safeParse({ action: 'search', name: 'Alex' }).success).toBe(false);
    expect(
      friendsRequestSchema.safeParse({ action: 'block', friendId: id, contacts: [] }).success,
    ).toBe(false);
  });
  it('allows only minimal streak, league and quest progress in the response', () => {
    const view = {
      invite: null,
      friends: [{ id, streak: 4, leagueTier: 2 }],
      blocked: [],
      badges: 1,
      questUsed: true,
      quest: {
        id,
        week: '2026-10-12',
        friendId: id,
        ownXp: 180,
        friendXp: 120,
        target: 300,
        completed: true,
      },
    };
    expect(friendsViewSchema.safeParse(view).success).toBe(true);
    expect(
      friendsViewSchema.safeParse({ ...view, friends: [{ ...view.friends[0], email: 'x@y.test' }] })
        .success,
    ).toBe(false);
  });
});
