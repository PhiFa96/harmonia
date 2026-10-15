import type * as Zustand from 'zustand';
jest.unmock('@/state/profile');
import type { Session } from '@supabase/supabase-js';
import { DEFAULT_ACCOUNT_SETTINGS } from '@harmonia/content';
import type { StoredAccountSettings } from '@harmonia/content';
import { completedDeviceFixture } from '../jest/device-fixture.ts';
const mockRecords = new Map<string, StoredAccountSettings>();
jest.mock('@/storage/profile', () => ({
  getProfileRepository: () =>
    Promise.resolve({
      load: (scope: string) => Promise.resolve(mockRecords.get(scope) ?? null),
      save: (scope: string, data: StoredAccountSettings) => {
        mockRecords.set(scope, structuredClone(data));
        return Promise.resolve();
      },
      erase: (scope: string) => {
        mockRecords.delete(scope);
        return Promise.resolve();
      },
    }),
}));
jest.mock('@/auth', () => ({
  useAuthState: jest
    .requireActual<typeof Zustand>('zustand')
    .create(() => ({ session: null as Session | null, ready: true, error: false })),
  getAuthClient: () => ({}),
}));
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { useSettings } from '@/state/settings';
import {
  initializeProfile,
  changeProfile,
  syncProfile,
  useProfile,
  captureGuestProfile,
} from '@/state/profile';
const actor = '00000000-0000-4000-8000-000000000011';
const row = (settings: object, revision = 1) => ({
  id: actor,
  settings,
  settings_revision: revision,
  display_name: 'Existing alias',
});
describe('Profile restoration and offline field patches', () => {
  it('restores server preferences, retains offline edits and preserves other server fields', async () => {
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL,
      originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    Object.assign(process.env, { EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' });
    Object.assign(process.env, {
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(24),
    });
    const remote = {
      ...DEFAULT_ACCOUNT_SETTINGS,
      noteNaming: 'intl' as const,
      referenceHz: 442,
      sound: true,
    };
    const requests: { url: string; body: unknown; authorization: unknown }[] = [];
    globalThis.fetch = jest.fn((input, init) => {
      requests.push({
        url: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : null,
        authorization: (init?.headers as Record<string, string>)['Authorization'],
      });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(row(remote)) } as Response);
    });
    try {
      useDeviceState.setState({
        data: completedDeviceFixture(),
        completed: true,
        phase: 'ready',
        storage: 'saved',
      });
      useAuthState.setState({ session: null });
      useSettings.setState({ sound: false, referenceHz: 440 });
      await captureGuestProfile();
      useAuthState.setState({
        session: { user: { id: actor }, access_token: 'own-fixture-token' } as Session,
      });
      await initializeProfile();
      expect(useSettings.getState().referenceHz).toBe(442);
      expect(useSettings.getState().sound).toBe(true);
      const profileRequests = requests.filter((request) =>
        request.url.includes('/rest/v1/profiles'),
      );
      expect(profileRequests).toHaveLength(1);
      expect(profileRequests[0]?.authorization).toBe('Bearer own-fixture-token');
      globalThis.fetch = jest.fn(() => Promise.reject(new Error('offline')));
      await changeProfile({ referenceHz: 443 });
      await syncProfile();
      expect(useProfile.getState().data?.dirty).toEqual({ referenceHz: 443 });
      expect(useSettings.getState().referenceHz).toBe(443);
      globalThis.fetch = jest.fn((input, init) => {
        const patch =
          typeof init?.body === 'string' ? (JSON.parse(init.body) as { patch: object }) : null;
        if (patch) {
          expect(patch.patch).toEqual({ referenceHz: 443 });
          Object.assign(remote, patch.patch);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(row(remote, 2)),
        } as Response);
      });
      await syncProfile();
      expect(useProfile.getState().sync).toBe('saved');
      expect(useProfile.getState().data?.dirty).toEqual({});
      expect(useSettings.getState().referenceHz).toBe(443);
      expect(useSettings.getState().sound).toBe(true);
      expect(mockRecords.get(actor)?.settings.displayName).toBe('Existing alias');
      useAuthState.setState({ session: null });
      await initializeProfile();
      expect(useSettings.getState().sound).toBe(false);
      expect(useProfile.getState().data?.settings.displayName).toBeNull();
      const savedGuest = changeProfile({ referenceHz: 442 });
      expect(useProfile.getState().sync).toBe('pending');
      await savedGuest;
      expect(useProfile.getState().sync).toBe('local');
      expect(mockRecords.get('guest')?.settings.referenceHz).toBe(442);
      // An account created before settings synchronization can already have a profile alias.
      mockRecords.delete(actor);
      let initializedLegacy = false;
      globalThis.fetch = jest.fn((_input, init) => {
        const body =
          typeof init?.body === 'string'
            ? (JSON.parse(init.body) as { patch: { displayName: string }; initialize: boolean })
            : null;
        if (body) {
          expect(body.initialize).toBe(true);
          expect(body.patch.displayName).toBe('Existing alias');
          initializedLegacy = true;
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(row(body?.patch ?? {}, body ? 1 : 0)),
        } as Response);
      });
      useAuthState.setState({
        session: { user: { id: actor }, access_token: 'own-fixture-token' } as Session,
      });
      await initializeProfile();
      expect(initializedLegacy).toBe(true);
      expect(useProfile.getState().data?.settings.displayName).toBe('Existing alias');
    } finally {
      globalThis.fetch = originalFetch;
      if (originalUrl === undefined)
        Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_URL');
      else Reflect.set(process.env, 'EXPO_PUBLIC_SUPABASE_URL', originalUrl);
      if (originalKey === undefined)
        Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
      else Reflect.set(process.env, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalKey);
    }
  });
});
