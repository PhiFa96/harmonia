import { z } from 'zod';
import { tutorRequestSchema, tutorUsageSchema } from './tutor.ts';
import { knowledgeCitationSchema } from './knowledge.ts';
export const tutorScopeSchema = z
  .object({
    locale: tutorRequestSchema.shape.locale,
    noteNaming: tutorRequestSchema.shape.noteNaming,
    mode: tutorRequestSchema.shape.mode,
    hintLevel: tutorRequestSchema.shape.hintLevel,
    context: tutorRequestSchema.shape.context,
  })
  .strict()
  .refine(
    (scope) =>
      tutorRequestSchema.safeParse({
        ...scope,
        id: '00000000-0000-4000-8000-000000000001',
        conversationId: '00000000-0000-4000-8000-000000000002',
        message: 'scope',
      }).success,
  );
export type TutorScope = z.infer<typeof tutorScopeSchema>;
export const tutorAnswerStatusSchema = z.enum([
  'complete',
  'refused',
  'partial',
  'failed',
  'cancelled',
]);
export const tutorExampleSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  example: z.object({
    source: z.string().min(1).max(4096),
    bpm: z.number().int().min(30).max(240),
    score: z.unknown(),
    timeline: z.unknown(),
  }),
});
export type TutorExample = z.infer<typeof tutorExampleSchema>;
export const tutorAnswerSchema = z.object({
  text: z.string().max(131072),
  examples: tutorExampleSchema.array().max(48),
  errors: z.string().max(128).array().max(100),
  status: tutorAnswerStatusSchema,
  citations: knowledgeCitationSchema.array().max(100).optional(),
  sourceState: z.enum(['cited', 'no_source', 'unavailable']).optional(),
  simulation: z.boolean().optional(),
});
export type TutorAnswer = z.infer<typeof tutorAnswerSchema>;
export const tutorAccountSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  resetAt: z.iso.datetime({ offset: true }),
  tier: z.enum(['free', 'premium', 'max']),
  requestsUsed: z.number().int().nonnegative(),
  requestsLimit: z.number().int().nonnegative(),
  requestsRemaining: z.number().int().nonnegative(),
  availability: z.enum([
    'unavailable',
    'subscription',
    'quota',
    'busy',
    'rate',
    'budget',
    'available',
  ]),
  simulation: z.boolean().optional(),
});
export type TutorAccount = z.infer<typeof tutorAccountSchema>;
export const tutorConversationSchema = z.object({
  id: z.uuid(),
  context: tutorScopeSchema,
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
export type TutorConversation = z.infer<typeof tutorConversationSchema>;
export const tutorMessageSchema = z.discriminatedUnion('role', [
  z.object({
    id: z.number().int().positive(),
    role: z.literal('user'),
    content: z.object({ text: z.string().max(4000) }),
    created_at: z.iso.datetime({ offset: true }),
  }),
  z.object({
    id: z.number().int().positive(),
    role: z.literal('assistant'),
    content: tutorAnswerSchema,
    created_at: z.iso.datetime({ offset: true }),
  }),
]);
export type TutorMessage = z.infer<typeof tutorMessageSchema>;
export const tutorConversationsSchema = z.object({
  conversations: tutorConversationSchema.array().max(20),
  next: z.uuid().nullable(),
});
export const tutorHistorySchema = z.object({
  conversation: tutorConversationSchema,
  messages: tutorMessageSchema.array().max(100),
  next: z.number().int().positive().nullable(),
  older: z.number().int().positive().nullable().optional(),
});
const code = z.string().min(1).max(128),
  id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const tutorStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('meta'),
    id: z.uuid(),
    conversationId: z.uuid(),
    promptVersion: z.number().int().positive(),
    toolVersion: z.number().int().positive(),
    simulation: z.boolean(),
  }),
  z.object({ type: z.literal('text'), text: z.string().max(131072) }),
  z.object({ type: z.literal('tool'), name: code, id, ok: z.boolean() }),
  tutorExampleSchema.extend({ type: z.literal('example') }),
  z.object({ type: z.literal('notice'), code }),
  z.object({
    type: z.literal('knowledge'),
    state: z.enum(['ready', 'empty', 'unavailable']),
    count: z.number().int().min(0).max(6),
    snapshot: z.string().regex(/^[a-f0-9]{64}$/),
    preview: z.boolean(),
  }),
  z.object({ type: z.literal('citation'), citation: knowledgeCitationSchema }),
  z.object({
    type: z.literal('usage'),
    usage: tutorUsageSchema,
    model: code,
    tariffVersion: code,
    simulation: z.boolean(),
  }),
  z.object({
    type: z.literal('replay'),
    id: z.uuid(),
    conversationId: z.uuid(),
    result: tutorAnswerSchema,
    usage: tutorUsageSchema,
  }),
  z.object({ type: z.literal('done'), status: tutorAnswerStatusSchema, replay: z.boolean() }),
  z.object({ type: z.literal('error'), code, retryId: z.uuid().optional() }),
]);
export type TutorStreamEvent = z.infer<typeof tutorStreamEventSchema>;
export const TUTOR_REPORT_CATEGORIES = [
  'incorrect',
  'unclear',
  'inappropriate',
  'technical',
  'other',
] as const;
export const tutorReportSchema = z
  .object({
    id: z.uuid(),
    conversationId: z.uuid(),
    messageId: z.number().int().positive(),
    category: z.enum(TUTOR_REPORT_CATEGORIES),
    message: z.string().trim().max(2000),
  })
  .strict();
export type TutorReport = z.infer<typeof tutorReportSchema>;
export const tutorReportResponseSchema = z.union([
  z.object({ accepted: z.uuid() }).strict(),
  z.object({ error: z.enum(['missing', 'conflict']) }).strict(),
]);
