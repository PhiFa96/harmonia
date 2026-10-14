import { waitFor } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { createMemoryPrivacyRepository } from '@/privacy/memory';
import { useAuthState } from '@/auth';
import {
  usePrivacy,
  initializePrivacy,
  analyticsAllowed,
  setPrivacyConsent,
  syncPrivacy,
  deletePrivacyAccount,
  exportPrivacyData,
  recoverPrivacyDeletions,
} from '@/privacy/state';
import { useDeviceState } from '@/state/device';
import { eraseLocalAccount } from '@/privacy/local';
let mockRepo = createMemoryPrivacyRepository();
jest.mock('@/privacy/storage', () => ({ getPrivacyRepository: () => Promise.resolve(mockRepo) }));
jest.mock('@/privacy/local', () => ({ eraseLocalAccount: jest.fn(() => Promise.resolve()) }));
jest.mock('@/auth', () => {
  const actual = jest.requireActual<{ useAuthState: typeof useAuthState }>('@/auth');
  return {
    ...actual,
    signOutDevice: jest.fn(() => {
      actual.useAuthState.setState({ session: null });
      return Promise.resolve();
    }),
  };
});
const policy = {
  version: 'privacy-v1',
  learningMonths: 12,
  tutorMonths: 12,
  reportMonths: 12,
  auditMonths: 12,
  receiptDays: 30,
  analyticsEnabled: false,
  marketingEnabled: false,
  legalPublished: false,
} as const;
const choices = { analytics: false, push: false, marketing: false };
const ownerA = '00000000-0000-4000-8000-000000000091',
  ownerB = '00000000-0000-4000-8000-000000000092';
const session = (id: string) =>
  ({ access_token: 'test-token-' + id, user: { id, is_anonymous: false } }) as Session;
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let mockFetch: jest.SpyInstance;
beforeEach(async () => {
  mockRepo = createMemoryPrivacyRepository();
  mockFetch = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.resolve(response({ choices, recentSignIn: true, policy })));
  Reflect.set(process.env, 'EXPO_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
  Reflect.set(
    process.env,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'sb_publishable_local_fixture_test_only_000000',
  );
  useDeviceState.setState({ phase: 'ready', storage: 'memory' });
  useAuthState.setState({ session: session(ownerA), ready: true });
  await initializePrivacy();
  await syncPrivacy();
  jest.mocked(eraseLocalAccount).mockClear();
  mockFetch.mockClear();
});
afterEach(() => {
  mockFetch.mockRestore();
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_URL');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
});
it('requires current-owner purpose consent and enabled reviewed policy before analytics', () => {
  usePrivacy.setState({ choices: { ...choices, analytics: true } });
  expect(analyticsAllowed()).toBe(false);
  usePrivacy.setState({
    policy: { ...policy, version: 'privacy-v1', analyticsEnabled: true, legalPublished: true },
  });
  expect(analyticsAllowed()).toBe(true);
  usePrivacy.setState({ owner: ownerB });
  expect(analyticsAllowed()).toBe(false);
});
it('turns withdrawal off immediately even when its server synchronization fails', async () => {
  usePrivacy.setState({ choices: { ...choices, push: true } });
  mockFetch.mockRejectedValue(new Error('offline'));
  await setPrivacyConsent('push', false);
  await syncPrivacy();
  expect(usePrivacy.getState().choices.push).toBe(false);
  expect(usePrivacy.getState().pending).toBe(true);
  expect((await mockRepo.list(ownerA))[0]?.acked).toBe(false);
});
it('recovers a deleted account on startup and keeps another signed-in account intact', async () => {
  const id = '00000000-0000-4000-8000-000000000093';
  await mockRepo.putMeta('delete:' + ownerA, id);
  useAuthState.setState({ session: session(ownerB) });
  await initializePrivacy();
  await syncPrivacy();
  mockFetch.mockResolvedValue(
    response({ id, state: 'deleted', receivedAt: '2026-10-14T10:00:00Z', externalPending: true }),
  );
  await recoverPrivacyDeletions();
  expect(eraseLocalAccount).toHaveBeenCalledWith(ownerA);
  expect(useAuthState.getState().session?.user.id).toBe(ownerB);
  expect(await mockRepo.meta('delete:' + ownerA)).toBeNull();
});
it('preserves the retry marker when local deletion fails after successful server deletion', async () => {
  mockFetch.mockResolvedValue(
    response({
      id: '00000000-0000-4000-8000-000000000001',
      state: 'deleted',
      receivedAt: '2026-10-14T10:00:00Z',
      externalPending: true,
    }),
  );
  jest.mocked(eraseLocalAccount).mockRejectedValueOnce(new Error('disk'));
  await expect(deletePrivacyAccount()).rejects.toThrow('disk');
  expect(await mockRepo.meta('delete:' + ownerA)).not.toBeNull();
  expect(useAuthState.getState().session?.user.id).toBe(ownerA);
  expect(usePrivacy.getState().busy).toBe(false);
});
it('a late response from account A cannot overwrite account B consent', async () => {
  let release: (value: Response) => void = () => undefined;
  mockFetch.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const old = syncPrivacy();
  await Promise.resolve();
  await Promise.resolve();
  useAuthState.setState({ session: session(ownerB) });
  release(response({ choices: { ...choices, push: true }, recentSignIn: true, policy }));
  await old;
  await waitFor(() => {
    expect(usePrivacy.getState().owner).toBe(ownerB);
    expect(usePrivacy.getState().choices.push).toBe(false);
  });
});
it('never opens another SQLite database while the first device database is still initializing', async () => {
  useDeviceState.setState({ phase: 'loading' });
  await expect(deletePrivacyAccount()).rejects.toThrow('storage not ready');
  await expect(exportPrivacyData()).rejects.toThrow('storage not ready');
  expect(mockFetch).not.toHaveBeenCalled();
});
