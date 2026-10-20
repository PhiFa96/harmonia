import { z } from 'zod';
import {
  tutorScopeSchema,
  tutorPolicySchema,
  tutorToolSchemas,
  tutorAnswerSchema,
  tutorUsageSchema,
  knowledgeCitationSchema,
  knowledgeChunkSchema,
  tutorTariffSchema,
} from '../../packages/content/src/index.ts';

export const LOCALES = ['de', 'en-US', 'en-GB'] as const;
export const CRITERIA = ['factual', 'tools', 'sources', 'hints', 'languageTone'] as const;
export const json = z.json();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const key = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const texts = z
  .object({
    de: z.string().min(1).max(4000),
    'en-US': z.string().min(1).max(4000),
    'en-GB': z.string().min(1).max(4000),
  })
  .strict();
export const caseSchema = z
  .object({
    id: key,
    status: z.literal('entwurf'),
    category: z.enum(['facts', 'task', 'library', 'trap', 'off-topic']),
    questions: texts,
    scope: tutorScopeSchema,
    exerciseType: z.string().nullable(),
    calls: z
      .object({
        name: z.enum(
          Object.keys(tutorToolSchemas) as [
            keyof typeof tutorToolSchemas,
            ...(keyof typeof tutorToolSchemas)[],
          ],
        ),
        input: json,
      })
      .strict()
      .array()
      .max(8),
    expectedFacts: json,
    learnerFixture: json.optional(),
    sourceArticles: z.string().array().max(3),
    exampleRequired: z.boolean(),
    reviewNotes: z.string().min(1),
  })
  .strict();
export type BenchmarkCase = z.infer<typeof caseSchema>;
export const catalogueSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.number().int().positive(),
    cases: caseSchema.array().min(200).max(1000),
  })
  .strict();
export type BenchmarkCatalogue = z.infer<typeof catalogueSchema>;
const effort = tutorPolicySchema.shape.effort;
export const variantSchema = z
  .object({
    id: key,
    model: z.string().min(1).max(128),
    roleEffort: z
      .object({ chat: effort, explain: effort, hint: effort, solution: effort })
      .strict(),
    instructions: z
      .object({
        de: z.string().max(2000),
        'en-US': z.string().max(2000),
        'en-GB': z.string().max(2000),
      })
      .strict(),
  })
  .strict();
export type BenchmarkVariant = z.infer<typeof variantSchema>;
export const configSchema = z
  .object({
    schemaVersion: z.literal(1),
    lane: z.enum(['preview', 'published']),
    sourceMode: z.enum(['postgres', 'supplied']),
    variants: variantSchema.array().min(1).max(8),
    limits: z
      .object({
        maxInputTokens: tutorPolicySchema.shape.maxInputTokens,
        maxOutputTokens: tutorPolicySchema.shape.maxOutputTokens,
        maxRounds: tutorPolicySchema.shape.maxRounds,
        maxToolsPerRound: tutorPolicySchema.shape.maxToolsPerRound,
      })
      .strict(),
    streamTariff: tutorTariffSchema,
    batchTariff: tutorTariffSchema,
    modelEvidence: z.object({ source: z.url(), verifiedAt: z.iso.datetime() }).strict(),
  })
  .strict();
export type BenchmarkConfig = z.infer<typeof configSchema>;
export const preparationSchema = z
  .object({
    schemaVersion: z.literal(1),
    catalogueHash: digest,
    configHash: digest,
    runtimeHash: digest,
    knowledgeSnapshot: digest,
    episodes: z
      .object({
        id: key,
        caseId: key,
        locale: z.enum(LOCALES),
        variant: key,
        knowledge: z
          .object({
            state: z.enum(['ready', 'empty', 'unavailable']),
            snapshot: digest,
            lane: z.enum(['preview', 'published']),
            chunks: knowledgeChunkSchema.array().max(6),
          })
          .strict(),
      })
      .strict()
      .array()
      .min(1)
      .max(24000),
  })
  .strict();
export type Preparation = z.infer<typeof preparationSchema>;
export const catalogueReviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    catalogueHash: digest,
    reviews: z
      .object({
        caseId: key,
        locale: z.enum(LOCALES),
        caseHash: digest,
        reviewer: z.literal('claude-code'),
        freshContext: z.literal(true),
        approved: z.boolean(),
        reviewedAt: z.iso.datetime(),
        methods: z.enum(['table', 'tonal', 'literature', 'score-engine']).array().min(2).max(4),
        references: z.string().min(1).array().min(1).max(10),
        notes: z.string().min(1).max(4000),
      })
      .strict()
      .array()
      .max(3000),
  })
  .strict();
export type CatalogueReview = z.infer<typeof catalogueReviewSchema>;
export const gradeSchema = z
  .object({
    episodeId: key,
    answerHash: digest,
    reviewer: z.literal('claude-code'),
    freshContext: z.literal(true),
    reviewedAt: z.iso.datetime(),
    verdicts: z
      .object({
        factual: z.boolean(),
        tools: z.boolean(),
        sources: z.boolean(),
        hints: z.boolean(),
        languageTone: z.boolean(),
      })
      .strict(),
    notes: z.string().min(1).max(8000),
    references: z.string().min(1).array().max(10),
  })
  .strict();
export const gradesSchema = z
  .object({ schemaVersion: z.literal(1), runHash: digest, grades: gradeSchema.array().max(24000) })
  .strict();
export type AnswerGrade = z.infer<typeof gradeSchema>;
export type AnswerGrades = z.infer<typeof gradesSchema>;
export const toolTraceSchema = z
  .object({ name: z.string(), input: json, ok: z.boolean() })
  .strict();
export const outcomeSchema = z
  .object({
    episodeId: key,
    status: z.enum(['complete', 'failed']),
    answer: tutorAnswerSchema,
    batchUsage: tutorUsageSchema,
    streamUsage: tutorUsageSchema,
    rounds: z.number().int().min(0).max(6),
    tools: toolTraceSchema.array().max(48),
    checks: z
      .object({
        completed: z.boolean(),
        tools: z.boolean(),
        sources: z.boolean(),
        examples: z.boolean(),
        noRuntimeError: z.boolean(),
      })
      .strict(),
    answerHash: digest,
  })
  .strict();
export type BenchmarkOutcome = z.infer<typeof outcomeSchema>;
export const reportInputSchema = z
  .object({
    schemaVersion: z.literal(1),
    simulation: z.boolean(),
    catalogueHash: digest,
    configHash: digest,
    runtimeHash: digest,
    preparationHash: digest,
    receiptsHash: digest,
    lane: z.enum(['preview', 'published']),
    sourceMode: z.enum(['postgres', 'supplied']),
    outcomes: outcomeSchema.array().max(24000),
  })
  .strict();
export type ReportInput = z.infer<typeof reportInputSchema>;
export const budgetSchema = z
  .object({
    premiumMonthlyModelBudgetNanoUsd: z.number().int().positive().max(1e12),
    maxMonthlyModelBudgetNanoUsd: z.number().int().positive().max(1e12),
    activeDaysPerMonth: z.number().int().min(1).max(31),
    safetyMultiplier: z.number().min(1).max(10),
  })
  .strict();
export type Budget = z.infer<typeof budgetSchema>;
export { digest, key, knowledgeCitationSchema };

export const cachedMessageSchema = z
  .object({
    id: z.string().min(1).max(128),
    model: z.string().min(1).max(128),
    role: z.literal('assistant'),
    type: z.literal('message'),
    content: z
      .discriminatedUnion('type', [
        z
          .object({
            type: z.literal('text'),
            text: z.string().max(131072),
            citations: z.array(json).nullable().optional(),
          })
          .loose(),
        z
          .object({
            type: z.literal('tool_use'),
            id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
            name: z.string().min(1).max(128),
            input: json,
          })
          .loose(),
        z
          .object({
            type: z.literal('thinking'),
            thinking: z.string().max(131072),
            signature: z.string().max(131072),
          })
          .loose(),
        z.object({ type: z.literal('redacted_thinking'), data: z.string().max(131072) }).loose(),
      ])
      .array()
      .max(100),
    stop_reason: z
      .enum([
        'end_turn',
        'max_tokens',
        'stop_sequence',
        'tool_use',
        'pause_turn',
        'refusal',
        'model_context_window_exceeded',
      ])
      .nullable(),
    stop_sequence: z.string().nullable(),
    usage: z
      .object({
        input_tokens: z.number().int().nonnegative(),
        output_tokens: z.number().int().nonnegative(),
        cache_read_input_tokens: z.number().int().nonnegative().nullable().default(null),
        cache_creation_input_tokens: z.number().int().nonnegative().nullable().default(null),
        cache_creation: z
          .object({
            ephemeral_5m_input_tokens: z.number().int().nonnegative().default(0),
            ephemeral_1h_input_tokens: z.number().int().nonnegative().default(0),
          })
          .nullable()
          .default(null),
      })
      .loose(),
  })
  .loose();
export type CachedMessage = z.infer<typeof cachedMessageSchema>;
export const cacheEntrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('succeeded'), message: cachedMessageSchema }).strict(),
  z
    .object({ type: z.enum(['errored', 'canceled', 'expired']), reason: z.string().max(1000) })
    .strict(),
]);
export type CacheEntry = z.infer<typeof cacheEntrySchema>;
export const pendingSchema = z
  .object({
    id: digest,
    episodeId: key,
    params: json,
    reservationNanoUsd: z.number().int().nonnegative().max(1e12),
  })
  .strict();
export type Pending = z.infer<typeof pendingSchema>;
export const workerOutputSchema = z
  .object({ pending: pendingSchema.array().max(24000), report: reportInputSchema })
  .strict();
export const journalSchema = z
  .object({
    schemaVersion: z.literal(1),
    simulation: z.boolean(),
    createdAt: z.iso.datetime(),
    catalogue: catalogueSchema,
    config: configSchema,
    preparation: preparationSchema,
    budgetNanoUsd: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    cache: z.record(digest, cacheEntrySchema),
    waves: z
      .object({
        number: z.number().int().positive(),
        state: z.enum(['planned', 'submitted', 'ended', 'uncertain']),
        batchId: z.string().min(1).max(256).nullable(),
        requests: pendingSchema.array().min(1).max(24000),
        reservationNanoUsd: z.number().int().positive(),
        costNanoUsd: z.number().int().nonnegative().nullable(),
        estimated: z.boolean(),
      })
      .strict()
      .array()
      .max(6),
    report: reportInputSchema.nullable(),
  })
  .strict();
export type Journal = z.infer<typeof journalSchema>;
