import { z } from 'zod';

export const ANALYTICS_CONSENT_VERSION = 'analytics-supabase-v1';
const source = {
  lessonId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9.-]+$/),
  contentVersion: z.number().int().positive(),
  attemptId: z.uuid(),
};
/** Explicit allowlist: no answers, prompts, emails, URLs or arbitrary properties. */
export const analyticsEventSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('app_active') }).strict(),
  z.object({ name: z.literal('onboarding_completed') }).strict(),
  z.object({ name: z.literal('lesson_started'), ...source }).strict(),
  z
    .object({
      name: z.literal('paywall_viewed'),
      reason: z.enum(['onboarding', 'limit', 'premium', 'tutor', 'settings']),
    })
    .strict(),
]);
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export const analyticsRequestSchema = z
  .object({
    id: z.uuid(),
    consentId: z.uuid(),
    version: z.literal(1),
    platform: z.enum(['web', 'ios', 'android']),
    locale: z.enum(['de', 'en-US', 'en-GB']),
    event: analyticsEventSchema,
  })
  .strict();
