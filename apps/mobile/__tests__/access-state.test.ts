import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_ACCESS_POLICY, guestAccessStatus } from '@harmonia/content';
import type { AccessGrant, AccessSource } from '@harmonia/content';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { createAccessRepository, initializeAccessDatabase } from '@/access/repository';
import { authorizeStart, useAccess, refreshAccess } from '@/access/state';
jest.unmock('@/access/state');
let mockRepo: ReturnType<typeof createAccessRepository>,
  mockConfigured = false,
  db: DatabaseSync;
jest.mock('@/access/storage', () => ({ getAccessRepository: () => Promise.resolve(mockRepo) }));
jest.mock('@/auth/config', () => ({
  configuredAuth: () =>
    mockConfigured ? { url: 'https://example.invalid', key: 'public-fixture' } : null,
}));
const source: AccessSource = { kind: 'practice', set: 'reading', seed: 1, contentVersion: 1 };
const status = () => guestAccessStatus(DEFAULT_ACCESS_POLICY, null, Date.now());
const grant = (id: string): AccessGrant => ({
  id,
  allowed: true,
  reason: 'allowed',
  cost: 9,
  status: status(),
});
const session = (id: string) =>
  ({ user: { id, is_anonymous: false }, access_token: 'fixture-' + id }) as NonNullable<
    ReturnType<typeof useAuthState.getState>['session']
  >;
const response = (data: unknown) =>
  ({ status: 200, json: () => Promise.resolve(data) }) as Response;
let fetchSpy: jest.SpyInstance;
beforeEach(async () => {
  db = new DatabaseSync(':memory:');
  await initializeAccessDatabase({
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  });
  mockRepo = createAccessRepository({
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  });
  mockConfigured = false;
  useAuthState.setState({ session: null, ready: true });
  fetchSpy = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.reject(new Error('offline')));
  await refreshAccess();
});
afterEach(async () => {
  mockConfigured = false;
  useAuthState.setState({ session: null });
  await refreshAccess();
  fetchSpy.mockRestore();
  db.close();
});
it('persists guest consumption and returns a saved grant offline without charging again', async () => {
  const first = await authorizeStart('a', source);
  expect(first.status.remaining).toBe(21);
  await authorizeStart('a', source);
  expect((await mockRepo.guestStatus(DEFAULT_ACCESS_POLICY, Date.now())).remaining).toBe(21);
  await expect(authorizeStart('a', { ...source, seed: 2 })).rejects.toThrow('conflict');
  expect(fetchSpy).not.toHaveBeenCalled();
});
it('discards a response after identity change before caching or publishing it', async () => {
  mockConfigured = true;
  let resolve!: (value: Response) => void;
  fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) =>
    init?.method === 'POST'
      ? new Promise((value) => {
          resolve = value;
        })
      : Promise.resolve(response(status())),
  );
  useAuthState.setState({ session: session('account-a') });
  await refreshAccess();
  const pending = authorizeStart('run', source);
  await new Promise<void>((value) => setTimeout(value, 0));
  useAuthState.setState({ session: session('account-b') });
  await refreshAccess();
  resolve(response(grant('run')));
  await expect(pending).rejects.toThrow('identity');
  expect(await mockRepo.existing('account-a', 'run', source)).toBeNull();
  expect(useAccess.getState().owner).toBe('account-b');
});
it('requires the server for a new account run but retains previously authorized runs offline', async () => {
  mockConfigured = true;
  fetchSpy.mockImplementation(() => Promise.resolve(response(status())));
  useAuthState.setState({ session: session('account-a') });
  await refreshAccess();
  await mockRepo.save('account-a', source, grant('saved'));
  fetchSpy.mockRejectedValue(new Error('offline'));
  expect((await authorizeStart('saved', source)).allowed).toBe(true);
  await expect(authorizeStart('new', source)).rejects.toThrow('offline');
  useAuthState.setState({ session: session('account-b') });
  await refreshAccess();
  await expect(authorizeStart('saved', source)).rejects.toThrow('offline');
});

it('defers auth-triggered energy initialization until device storage is ready', async () => {
  useDeviceState.setState({ phase: 'loading' });
  mockConfigured = true;
  useAuthState.setState({ session: session('during-boot') });
  await Promise.resolve();
  expect(fetchSpy).not.toHaveBeenCalled();
  useDeviceState.setState({ phase: 'ready' });
});
