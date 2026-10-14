import { DatabaseSync } from 'node:sqlite';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { createDeviceRepository, initializeDeviceDatabase } from '@/storage/device-repository';
import { completedDeviceFixture } from '../jest/device-fixture';
import { useDeviceState } from '@/state/device';
import { usePlacementState } from '@/state/placement';
import { retainDeviceDetails } from '@/privacy/retention-device';
import type { PlacementData } from '@/placement/model';
let mockRepo: ReturnType<typeof createDeviceRepository>;
jest.mock('@/storage/device', () => ({ getDeviceRepository: () => Promise.resolve(mockRepo) }));
let db: DatabaseSync;
beforeEach(async () => {
  db = new DatabaseSync(':memory:');
  const driver: LessonDatabase = {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeDeviceDatabase(driver);
  mockRepo = createDeviceRepository(driver);
});
afterEach(() => {
  db.close();
});
it('removes old legacy placement answers without replacing another current placement and preserves completion', async () => {
  const old: PlacementData = {
    schemaVersion: 1,
    active: null,
    last: {
      id: 'legacy-old',
      seed: 'expired',
      startedAt: 1000,
      endedAt: 2000,
      bankKey: 'old-bank',
      actions: [],
      answer: null,
    },
  };
  const current: PlacementData = {
    schemaVersion: 1,
    active: {
      id: 'current-other-account',
      seed: 'current',
      startedAt: 4000,
      endedAt: null,
      bankKey: 'current-bank',
      actions: [],
      answer: null,
    },
    last: null,
  };
  await mockRepo.savePlacement(old);
  usePlacementState.setState({ phase: 'ready', data: current });
  useDeviceState.setState({ data: completedDeviceFixture() });
  await retainDeviceDetails(3000);
  expect((await mockRepo.loadPlacement())?.last).toBeNull();
  expect(usePlacementState.getState().data).toEqual(current);
  expect(useDeviceState.getState().data?.mini).toEqual({
    seed: 0,
    answer: null,
    hintLevel: 0,
    checked: false,
    detailsRemoved: true,
  });
  expect(useDeviceState.getState().completed).toBe(true);
});
it('erases only the stored owner even after a different account has become active', async () => {
  const data = completedDeviceFixture(),
    a = '00000000-0000-4000-8000-000000000081',
    b = '00000000-0000-4000-8000-000000000082';
  const stored = {
    schemaVersion: 1 as const,
    settings: {
      locale: 'de' as const,
      appearance: 'system' as const,
      reduceMotion: false,
      haptics: true,
    },
    onboarding: { ...data, account: 'email' as const, accountId: b },
  };
  await mockRepo.save(stored);
  await mockRepo.eraseAccount(a, [], { ...data, account: 'guest', accountId: null });
  expect((await mockRepo.load())?.onboarding.accountId).toBe(b);
  await mockRepo.eraseAccount(b, [], { ...data, account: 'guest', accountId: null });
  expect((await mockRepo.load())?.onboarding.accountId).toBeNull();
});
