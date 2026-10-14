import { describe, it, expect } from 'vitest';
import { catalogue } from './authoring.ts';
import { lessonPlan } from './lesson-flow.ts';
import {
  DEFAULT_ACCESS_POLICY as policy,
  refillEnergy,
  guestAccessStatus,
  accessSourceDetails,
  accessReserveSchema,
  preparedAdSlot,
} from './access.ts';
import { cancellationRequestSchema } from './cancellation.ts';
describe('Regenerating energy and canonical access', () => {
  it('preserves fractions, clamps full energy and rejects backward-clock refills', () => {
    const state = { balance: 0, refilledAt: 0, revision: 1 };
    expect(refillEnergy(policy, state, 599999).balance).toBe(0);
    const one = refillEnergy(policy, state, 650000);
    expect(one).toEqual({ balance: 1, refilledAt: 600000, revision: 1 });
    expect(refillEnergy(policy, one, 1199999).balance).toBe(1);
    expect(refillEnergy(policy, one, 1200000).balance).toBe(2);
    expect(refillEnergy(policy, one, 100).balance).toBe(1);
    expect(refillEnergy(policy, state, 100000000).balance).toBe(30);
  });
  it('policy changes clamp without retroactive accelerated regeneration', () => {
    expect(
      refillEnergy(
        { ...policy, energyCapacity: 20, energyRefillSeconds: 60 },
        { balance: 25, refilledAt: 0, revision: 1 },
        600000,
        2,
      ),
    ).toEqual({ balance: 20, refilledAt: 600000, revision: 2 });
    const status = guestAccessStatus(policy, { balance: 0, refilledAt: 0, revision: 1 }, 610000);
    expect(status.remaining).toBe(1);
    expect(Date.parse(status.resetAt)).toBe(1200000);
    expect(Date.parse(status.fullAt)).toBe(18000000);
  });
  it('derives cost, level and plan fingerprint from the catalogue', () => {
    const plan = lessonPlan(catalogue, 'notation.l1.staff.positions');
    if (!plan) throw new Error('Plan');
    const source = {
      kind: 'lesson' as const,
      lessonId: plan.id,
      contentVersion: plan.contentVersion,
      seed: 1,
      planKey: plan.planKey,
    };
    expect(accessSourceDetails(catalogue, source)).toEqual({
      cost: plan.exercises.length,
      level: 1,
    });
    expect(() => accessSourceDetails(catalogue, { ...source, planKey: 'forged' })).toThrow();
    expect(() => accessSourceDetails(catalogue, { ...source, contentVersion: 999 })).toThrow();
    expect(accessReserveSchema.safeParse({ id: 'x', source, cost: 1 }).success).toBe(false);
    for (const set of ['reading', 'pitch', 'tonality', 'chords', 'rhythm', 'knowledge'] as const)
      expect(
        accessSourceDetails(catalogue, { kind: 'practice', set, seed: 1, contentVersion: 1 }).cost,
      ).toBeGreaterThan(0);
  });
  it('only prepares ad slots after a free session', () => {
    expect(preparedAdSlot('free', 'complete')).toBe('after-session');
    expect(preparedAdSlot('free', 'exercise')).toBeNull();
    expect(preparedAdSlot('premium', 'complete')).toBeNull();
    expect(preparedAdSlot('max', 'complete')).toBeNull();
  });
  it('requires a reason for extraordinary declarations and strict bounded fields', () => {
    const body = {
      name: 'Test',
      email: 'test@example.invalid',
      contract: '',
      tier: 'premium',
      kind: 'ordinary',
      reason: '',
      date: 'earliest',
      locale: 'de',
    };
    const id = '00000000-0000-4000-8000-000000000001';
    expect(cancellationRequestSchema.safeParse({ id, body }).success).toBe(true);
    expect(
      cancellationRequestSchema.safeParse({ id, body: { ...body, kind: 'extraordinary' } }).success,
    ).toBe(false);
    expect(
      cancellationRequestSchema.safeParse({ id, body: { ...body, name: 'x'.repeat(201) } }).success,
    ).toBe(false);
    expect(
      cancellationRequestSchema.safeParse({ id, body: { ...body, date: '2026-02-30' } }).success,
    ).toBe(false);
  });
});
