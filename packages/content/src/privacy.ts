import { z } from 'zod';
export const PRIVACY_VERSION = 'privacy-v1';
export const consentPurposeSchema = z.enum(['analytics', 'push', 'marketing']);
export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;
export const consentEventSchema = z
  .object({
    id: z.uuid(),
    purpose: consentPurposeSchema,
    granted: z.boolean(),
    version: z.enum([PRIVACY_VERSION, 'analytics-supabase-v1']),
    locale: z.enum(['de', 'en-US', 'en-GB']),
  })
  .strict();
export type ConsentEvent = z.infer<typeof consentEventSchema>;
export const consentChoicesSchema = z
  .object({ analytics: z.boolean(), push: z.boolean(), marketing: z.boolean() })
  .strict();
export const DEFAULT_CONSENTS = { analytics: false, push: false, marketing: false } as const;
export const privacyDeleteSchema = z
  .object({ id: z.uuid(), confirm: z.literal(true), subscriptionsAcknowledged: z.literal(true) })
  .strict();
export const privacyReceiptSchema = z
  .object({
    id: z.uuid(),
    receivedAt: z.iso.datetime({ offset: true }),
    state: z.enum(['processing', 'deleted']),
    externalPending: z.boolean(),
  })
  .strict();
export function retentionCutoff(now: number, months = 12) {
  const date = new Date(now),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.getTime();
}
export const PRIVACY_EXPORT_SECTIONS = [
  'account',
  'profiles',
  'learning',
  'skillRatings',
  'cardReviews',
  'leagueAccount',
  'leagueMemberships',
  'rushRuns',
  'rushSteps',
  'rushUsage',
  'duelRatings',
  'duelGames',
  'duelPlayers',
  'duelSteps',
  'duelQueue',
  'duelInvitesSent',
  'duelInvitesAccepted',
  'friendships',
  'rewards',
  'motivation',
  'freezes',
  'streaks',
  'reminders',
  'consents',
  'contentReports',
  'conversations',
  'messages',
  'tutorRequests',
  'tutorReports',
  'aiUsage',
  'entitlements',
  'billingEvents',
  'access',
  'energy',
  'cancellations',
  'analyticsParticipants',
  'analyticsEvents',
] as const;
export const privacyPolicySchema = z
  .object({
    version: z.literal(PRIVACY_VERSION),
    learningMonths: z.literal(12),
    tutorMonths: z.literal(12),
    reportMonths: z.literal(12),
    auditMonths: z.literal(12),
    receiptDays: z.number().int().min(1).max(90),
    analyticsEnabled: z.boolean(),
    marketingEnabled: z.boolean(),
    legalPublished: z.boolean(),
  })
  .strict();
