import { Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import type { AnalyticsEvent } from '@harmonia/content';
import { analyticsEventSchema } from '@harmonia/content';
import { useAuthState } from '@/auth';
import { configuredAuth } from '@/auth/config';
import { analyticsAllowed, privacyOwner, usePrivacy } from '@/privacy/state';
import { useSettings } from '@/state/settings';

const controllers = new Set<AbortController>();
let identity = '',
  seen = new Set<string>();
function scope() {
  const state = usePrivacy.getState();
  return analyticsAllowed() && !state.pending && state.analyticsConsentId && state.owner !== 'guest'
    ? state.owner + ':' + state.analyticsConsentId
    : '';
}
function reset() {
  const next = scope();
  if (identity === next) return;
  identity = next;
  seen = new Set();
  for (const controller of controllers) controller.abort();
  controllers.clear();
}
usePrivacy.subscribe(reset);
useAuthState.subscribe(reset);
/** Best effort, no disk queue or retroactive replay. Learning never waits for analytics. */
export function trackAnalytics(input: AnalyticsEvent, owner = privacyOwner()) {
  reset();
  const state = usePrivacy.getState(),
    session = useAuthState.getState().session,
    config = configuredAuth();
  if (!identity || owner !== state.owner || !session || !config) return;
  const parsed = analyticsEventSchema.safeParse(input);
  if (!parsed.success || !['web', 'ios', 'android'].includes(Platform.OS)) return;
  const event = parsed.data;
  const key =
    event.name === 'app_active'
      ? event.name + new Date().toISOString().slice(0, 10)
      : event.name === 'lesson_started'
        ? event.name + event.attemptId
        : event.name === 'onboarding_completed'
          ? event.name
          : randomUUID();
  if (seen.has(key)) return;
  if (seen.size >= 200) seen.clear();
  seen.add(key);
  const controller = new AbortController();
  const observed = seen;
  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);
  controllers.add(controller);
  void fetch(config.url + '/functions/v1/analytics', {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + session.access_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: randomUUID(),
      version: 1,
      consentId: state.analyticsConsentId,
      platform: Platform.OS,
      locale: useSettings.getState().locale ?? 'en-US',
      event,
    }),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) observed.delete(key);
    })
    .catch(() => {
      observed.delete(key);
    })
    .finally(() => {
      clearTimeout(timeout);
      controllers.delete(controller);
    });
}
