import { describe, expect, it } from 'vitest';
import { analyticsRequestSchema, analyticsEventSchema } from './analytics.ts';
const event = { name: 'app_active' };
const request = {
  id: '00000000-0000-4000-8000-000000000001',
  consentId: '00000000-0000-4000-8000-000000000002',
  version: 1,
  platform: 'web',
  locale: 'de',
  event,
};
describe('bounded analytics allowlist', () => {
  it('accepts only the documented envelope', () => {
    expect(analyticsRequestSchema.parse(request)).toEqual(request);
  });
  it.each(['userId', 'email', 'answer', 'prompt', 'url', 'deviceId', 'occurredAt'])(
    'rejects extra %s at either level',
    (key) => {
      expect(analyticsRequestSchema.safeParse({ ...request, [key]: 'private' }).success).toBe(
        false,
      );
      expect(
        analyticsRequestSchema.safeParse({ ...request, event: { ...event, [key]: 'private' } })
          .success,
      ).toBe(false);
    },
  );
  it.each([
    'purchase_completed',
    'lesson_completed',
    'tutor_question_asked',
    'tutor_request_finished',
  ])('cannot forge server event %s', (name) => {
    expect(analyticsEventSchema.safeParse({ name }).success).toBe(false);
  });
  it.each(['person@example.org', 'https://example.org', '<script>', 'a'.repeat(121)])(
    'rejects a free-text lesson source %s',
    (lessonId) => {
      expect(
        analyticsEventSchema.safeParse({
          name: 'lesson_started',
          attemptId: request.id,
          contentVersion: 1,
          lessonId,
        }).success,
      ).toBe(false);
    },
  );
});
