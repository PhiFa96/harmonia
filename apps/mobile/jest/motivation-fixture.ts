import { DEFAULT_REWARD_RULE, motivationSummary } from '@harmonia/content';
import type { MotivationLocal, MotivationResponse } from '@harmonia/content';
export function motivationFixture(): MotivationLocal {
  return {
    preferences: {
      dailyGoal: 20,
      reminderConsent: false,
      reminderTime: '18:00',
      locale: 'de',
      timeZone: 'Europe/Berlin',
    },
    dirty: true,
    practicedAt: 0,
    rules: [DEFAULT_REWARD_RULE],
    purchases: [],
    server: null,
    serverEvidenceKey: null,
    preferencesEstablished: false,
  };
}
export function motivationResponse(): MotivationResponse {
  return {
    preferences: motivationFixture().preferences,
    rules: [DEFAULT_REWARD_RULE],
    summary: motivationSummary([], Date.now(), 'Europe/Berlin'),
    pushAvailable: false,
    pushRegistered: false,
    remoteReminders: false,
    accepted: [],
    purchases: [],
  };
}
