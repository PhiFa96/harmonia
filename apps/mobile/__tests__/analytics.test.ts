import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import { usePrivacy } from '@/privacy/state';
import { trackAnalytics } from '@/analytics/track';
import { useDeviceState } from '@/state/device';
const owner = '00000000-0000-4000-8000-000000000081',
  consent = '00000000-0000-4000-8000-000000000082';
const session = (id: string) =>
  ({ user: { id, is_anonymous: false }, access_token: 'test-token' }) as Session;
const policy = {
  version: 'privacy-v1',
  learningMonths: 12,
  tutorMonths: 12,
  reportMonths: 12,
  auditMonths: 12,
  receiptDays: 30,
  analyticsEnabled: true,
  marketingEnabled: false,
  legalPublished: true,
} as const;
let request: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
beforeEach(() => {
  useDeviceState.setState({ phase: 'loading' });
  Reflect.set(process.env, 'EXPO_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
  Reflect.set(
    process.env,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'sb_publishable_local_fixture_test_only_000000',
  );
  request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  useAuthState.setState({ ready: true, session: session(owner) });
  usePrivacy.setState({
    owner,
    choices: { analytics: true, push: false, marketing: false },
    phase: 'ready',
    pending: false,
    analyticsConsentId: consent,
    policy,
  });
});
afterEach(() => {
  request.mockRestore();
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_URL');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
});
it('deduplicates foreground days and contains only the exact allowed properties', () => {
  trackAnalytics({ name: 'app_active' });
  trackAnalytics({ name: 'app_active' });
  expect(request).toHaveBeenCalledTimes(1);
  const init = request.mock.calls[0]?.[1];
  if (!init) throw new Error('Expected request');
  if (typeof init.body !== 'string') throw new Error('Expected JSON string');
  const data = JSON.parse(init.body) as Record<string, unknown>;
  expect(Object.keys(data).sort()).toEqual(
    ['id', 'version', 'consentId', 'platform', 'locale', 'event'].sort(),
  );
  expect(data['event']).toEqual({ name: 'app_active' });
  expect(init.body).not.toContain(owner);
});
it.each(['policy', 'pending', 'owner', 'consent', 'choice', 'guest'])(
  'never collects when %s is unavailable',
  (kind) => {
    if (kind === 'policy') usePrivacy.setState({ policy: { ...policy, legalPublished: false } });
    if (kind === 'pending') usePrivacy.setState({ pending: true });
    if (kind === 'owner') usePrivacy.setState({ owner: 'another' });
    if (kind === 'consent') usePrivacy.setState({ analyticsConsentId: null });
    if (kind === 'choice')
      usePrivacy.setState({ choices: { analytics: false, push: false, marketing: false } });
    if (kind === 'guest') useAuthState.setState({ session: null });
    trackAnalytics({ name: 'app_active' });
    expect(request).not.toHaveBeenCalled();
  },
);
it('aborts in-flight requests immediately on withdrawal and never replays them', () => {
  trackAnalytics({ name: 'app_active' });
  const signal = request.mock.calls[0]?.[1]?.signal;
  usePrivacy.setState({ choices: { analytics: false, push: false, marketing: false } });
  expect(signal?.aborted).toBe(true);
  trackAnalytics({ name: 'app_active' });
  expect(request).toHaveBeenCalledTimes(1);
});
it('rejects a late lesson start owned by the previous account', () => {
  trackAnalytics(
    { name: 'lesson_started', lessonId: 'prototype', contentVersion: 1, attemptId: consent },
    'another',
  );
  expect(request).not.toHaveBeenCalled();
});
