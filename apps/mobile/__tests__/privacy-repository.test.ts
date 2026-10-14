import { DatabaseSync } from 'node:sqlite';
import { firstLesson, catalogue } from '@harmonia/content/authoring';
import { lessonEvent, retainLearningEvent, validateLearningEvent } from '@harmonia/content';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
} from '@harmonia/exercises';
import type { LessonDatabase } from '@/storage/lesson-repository';
import {
  createLearningRepository,
  initializeLearningDatabase,
} from '@/storage/learning-repository';
import { createPrivacyRepository, initializePrivacyDatabase } from '@/privacy/repository';
import { blockErasedScope } from '@/privacy/guard';
import { parseDeviceSnapshot } from '@/onboarding/model';
import { completedDeviceFixture } from '../jest/device-fixture';
let db: DatabaseSync;
const adapter = (): LessonDatabase => ({
  execAsync: (sql) => {
    db.exec(sql);
    return Promise.resolve();
  },
  runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
  getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
    Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
});
function raw(id = 'old') {
  let session = createLessonSession(firstLesson, 'privacy-sqlite');
  while (session.phase === 'initial') {
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (!item) throw new Error('Missing item');
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return lessonEvent(id, session, 1000, 2000, 'Europe/Berlin');
}
beforeEach(() => {
  db = new DatabaseSync(':memory:');
});
afterEach(() => {
  db.close();
});
it('compacts offline answers, preserves unlocking and reward, and never restores a raw server echo', async () => {
  await initializeLearningDatabase(adapter());
  const repo = createLearningRepository(adapter()),
    event = raw();
  await repo.save('owner', event);
  await repo.save('other', raw('other'));
  expect(await repo.compact('owner', catalogue, 3000)).toEqual(['old']);
  const [row] = await repo.list('owner');
  expect(row?.event.kind).toBe('retained');
  expect(row?.reward?.amount).toBeGreaterThan(0);
  expect(validateLearningEvent(catalogue, row?.event).lesson?.passed).toBe(true);
  await repo.merge('owner', {
    accepted: [],
    rows: [{ sequence: 1, event }],
    cursor: 1,
    more: false,
  });
  expect((await repo.list('owner'))[0]?.event.kind).toBe('retained');
  expect((await repo.list('other'))[0]?.event.kind).toBe('lesson');
  expect(await repo.compact('owner', catalogue, 3000)).toEqual([]);
});
it('replaces a cached raw row with the server summary without duplicating it', async () => {
  await initializeLearningDatabase(adapter());
  const repo = createLearningRepository(adapter()),
    event = raw();
  await repo.save('owner', event);
  await repo.merge('owner', {
    accepted: ['old'],
    rows: [{ sequence: 1, event: retainLearningEvent(catalogue, event) }],
    cursor: 1,
    more: false,
  });
  expect(await repo.list('owner')).toHaveLength(1);
  expect(JSON.stringify(await repo.list('owner'))).not.toContain('privacy-sqlite');
});
it('journals separate consent choices idempotently and refuses delayed writes after scoped erasure', async () => {
  await initializePrivacyDatabase(adapter());
  const repo = createPrivacyRepository(adapter());
  const event = {
    id: '00000000-0000-4000-8000-000000000031',
    purpose: 'push' as const,
    granted: true,
    version: 'privacy-v1' as const,
    locale: 'de' as const,
  };
  expect((await repo.choices('privacy-a')).push).toBe(false);
  await Promise.all([repo.save('privacy-a', event), repo.save('privacy-a', event)]);
  expect(await repo.list('privacy-a')).toHaveLength(1);
  await expect(repo.save('privacy-a', { ...event, granted: false })).rejects.toThrow('conflict');
  await repo.save('privacy-b', event);
  await repo.putMeta('delete:privacy-a', 'retry-token');
  blockErasedScope('privacy-a', []);
  await repo.erase('privacy-a');
  await expect(repo.save('privacy-a', event)).rejects.toThrow('Erased');
  expect((await repo.choices('privacy-a')).push).toBe(false);
  expect((await repo.choices('privacy-b')).push).toBe(true);
  expect(await repo.meta('delete:privacy-a')).toBe('retry-token');
});
it('loads a completed onboarding after removing its mini answer, but rejects incomplete bypasses', () => {
  const data = completedDeviceFixture(),
    snapshot = {
      schemaVersion: 1,
      settings: { locale: 'de', appearance: 'system', reduceMotion: false, haptics: true },
      onboarding: {
        ...data,
        mini: { seed: 0, answer: null, hintLevel: 0, checked: false, detailsRemoved: true },
      },
    };
  expect(parseDeviceSnapshot(JSON.stringify(snapshot)).onboarding.step).toBe('complete');
  expect(() =>
    parseDeviceSnapshot(
      JSON.stringify({
        ...snapshot,
        onboarding: { ...snapshot.onboarding, step: 'account', completedAt: null },
      }),
    ),
  ).toThrow();
});
