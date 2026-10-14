import { describe, expect, it } from 'vitest';
import { catalogue, firstLesson } from './authoring.ts';
import {
  lessonEvent,
  retainLearningEvent,
  unavailableRetainedEvent,
  validateLearningEvent,
  learningSyncRequestSchema,
} from './learning-evidence.ts';
import {
  retentionCutoff,
  privacyDeleteSchema,
  consentEventSchema,
  DEFAULT_CONSENTS,
} from './privacy.ts';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
} from '@harmonia/exercises';
function evidence() {
  let session = createLessonSession(firstLesson, 'retention-proof');
  while (session.phase === 'initial') {
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (!item) throw new Error('Missing item');
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return lessonEvent('retention-proof', session, 1000, 2000, 'Europe/Berlin');
}
describe('Privacy boundaries and twelve calendar months', () => {
  it('clamps leap days without deleting a day too early', () => {
    expect(new Date(retentionCutoff(Date.parse('2028-02-29T13:45:00Z'))).toISOString()).toBe(
      '2027-02-28T13:45:00.000Z',
    );
    expect(new Date(retentionCutoff(Date.parse('2026-10-14T13:45:00Z'))).toISOString()).toBe(
      '2025-10-14T13:45:00.000Z',
    );
  });
  it('retains verified unlocking and timezone, removes every answer and seed', () => {
    const raw = evidence(),
      compact = retainLearningEvent(catalogue, raw);
    expect(validateLearningEvent(catalogue, compact).lesson).toEqual(
      validateLearningEvent(catalogue, raw).lesson,
    );
    expect(compact.timeZone).toBe('Europe/Berlin');
    for (const key of ['seed', 'initial', 'review', 'actions', 'startedAt'])
      expect(compact).not.toHaveProperty(key);
    expect(learningSyncRequestSchema.safeParse({ events: [compact], since: 0 }).success).toBe(
      false,
    );
  });
  it('rejects forged retained grades and does not invent progress for changed sources', () => {
    const raw = evidence(),
      compact = retainLearningEvent(catalogue, raw);
    if (compact.sourceKind !== 'lesson') throw new Error('Wrong source');
    expect(() =>
      validateLearningEvent(catalogue, {
        ...compact,
        progress: { ...compact.progress, passed: false },
      }),
    ).toThrow();
    expect(() => validateLearningEvent(catalogue, unavailableRetainedEvent(raw))).toThrow(
      'changed',
    );
  });
  it('defaults optional purposes off and requires both explicit deletion acknowledgements', () => {
    expect(Object.values(DEFAULT_CONSENTS)).toEqual([false, false, false]);
    const id = '00000000-0000-4000-8000-000000000011';
    expect(privacyDeleteSchema.safeParse({ id, confirm: true }).success).toBe(false);
    expect(
      privacyDeleteSchema.safeParse({
        id,
        confirm: true,
        subscriptionsAcknowledged: true,
        user_id: 'other',
      }).success,
    ).toBe(false);
    expect(
      consentEventSchema.safeParse({
        id,
        purpose: 'push',
        granted: true,
        version: 'privacy-v0',
        locale: 'de',
      }).success,
    ).toBe(false);
  });
});
