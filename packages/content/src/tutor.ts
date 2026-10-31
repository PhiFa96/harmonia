import { z } from 'zod';
import { reportSourceSchema } from './content-reports.ts';

export const TUTOR_PROMPT_VERSION = 5;
export const TUTOR_TOOL_VERSION = 3;
const tokens = z.number().int().nonnegative().max(10_000_000);
const money = z.number().int().nonnegative().max(1_000_000_000_000);
const rate = z.number().int().nonnegative().max(1_000_000);
export const tutorContextSchema = z
  .object({
    source: reportSourceSchema,
    answer: z.string().max(4096).nullable(),
    /** Legacy UI metadata, never proof of a previous grading action. */
    checked: z.boolean(),
  })
  .strict();
export const tutorRequestSchema = z
  .object({
    id: z.uuid(),
    conversationId: z.uuid(),
    message: z.string().trim().min(1).max(4000),
    locale: z.enum(['de', 'en-US', 'en-GB']),
    noteNaming: z.enum(['de', 'intl']),
    harmonySystem: z.enum(['functions', 'roman', 'both']).optional(),
    mode: z.enum(['chat', 'hint', 'explain', 'solution']),
    hintLevel: z.union([z.literal(1), z.literal(2)]).nullable(),
    context: tutorContextSchema.nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.mode === 'hint') !== (v.hintLevel !== null))
      ctx.addIssue({ code: 'custom', message: 'Hint level requires hint mode' });
    if (v.mode !== 'chat' && v.context === null)
      ctx.addIssue({ code: 'custom', message: 'Task mode requires context' });
    if (v.mode === 'explain' && v.context?.answer == null)
      ctx.addIssue({
        code: 'custom',
        message: 'Explanation requires an answer for server evaluation',
      });
  });
export type TutorRequest = z.infer<typeof tutorRequestSchema>;

/** Nano-USD pro Token: 1 USD/Million Token = 1000 Nano-USD/Token. Keine Modellpreise raten. */
export const tutorTariffSchema = z
  .object({
    version: z.string().min(1).max(128),
    source: z.url().max(512),
    verifiedAt: z.iso.datetime(),
    input: rate,
    output: rate,
    cacheRead: rate,
    cacheWrite5m: rate,
    cacheWrite1h: rate,
  })
  .strict();
export type TutorTariff = z.infer<typeof tutorTariffSchema>;
const allowance = z
  .object({ requests: z.number().int().min(0).max(1000), costNanoUsd: money })
  .strict();
export const tutorPolicySchema = z
  .object({
    enabled: z.boolean(),
    model: z.string().min(1).max(128).nullable(),
    tariff: tutorTariffSchema.nullable(),
    effort: z.enum(['low', 'medium', 'high', 'xhigh', 'max']),
    maxInputTokens: z.number().int().min(1024).max(100_000),
    maxOutputTokens: z.number().int().min(128).max(4096),
    maxRounds: z.number().int().min(1).max(6),
    maxToolsPerRound: z.number().int().min(1).max(8),
    timeoutMs: z.number().int().min(5000).max(90_000),
    requestsPerMinute: z.number().int().min(1).max(60),
    globalDailyCostNanoUsd: money,
    free: allowance,
    premium: allowance,
    max: allowance,
  })
  .strict()
  .refine((v) => !v.enabled || (v.model !== null && v.tariff !== null));
export type TutorPolicy = z.infer<typeof tutorPolicySchema>;
/** Nur technische Schutzgrenzen. Launch-Kontingente und Frontier-Modell werden in P2.18 gemessen. */
export const DEFAULT_TUTOR_POLICY: TutorPolicy = {
  enabled: false,
  model: null,
  tariff: null,
  effort: 'high',
  maxInputTokens: 32_000,
  maxOutputTokens: 1024,
  maxRounds: 4,
  maxToolsPerRound: 4,
  timeoutMs: 60_000,
  requestsPerMinute: 6,
  globalDailyCostNanoUsd: 10_000_000_000,
  free: { requests: 0, costNanoUsd: 0 },
  premium: { requests: 30, costNanoUsd: 1_000_000_000 },
  max: { requests: 60, costNanoUsd: 2_000_000_000 },
};
export const tutorUsageSchema = z
  .object({
    inputTokens: tokens,
    outputTokens: tokens,
    cacheReadTokens: tokens,
    cacheWrite5mTokens: tokens,
    cacheWrite1hTokens: tokens,
    unknownCacheWriteTokens: tokens,
    costNanoUsd: money,
    estimated: z.boolean(),
  })
  .strict();
export type TutorUsage = z.infer<typeof tutorUsageSchema>;
export const EMPTY_TUTOR_USAGE: TutorUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWrite5mTokens: 0,
  cacheWrite1hTokens: 0,
  unknownCacheWriteTokens: 0,
  costNanoUsd: 0,
  estimated: false,
};

const pitch = z
  .string()
  .regex(/^[A-G](?:bb|b|##|#)?-?\d{1,2}$/)
  .max(8);
const note = z
  .string()
  .regex(/^[A-G](?:bb|b|##|#)?$/)
  .max(3);
const interval = z.string().regex(/^-?(?:dd|d|m|M|P|A|AA)(?:[1-9]|1[0-5])$/);
const triad = z.enum(['major', 'minor', 'diminished', 'augmented']);
export const tutorToolSchemas = {
  analyze_interval: z.object({ from: pitch, to: pitch }).strict(),
  build_interval: z.object({ from: pitch, interval }).strict(),
  build_scale: z
    .object({
      tonic: pitch,
      type: z.enum([
        'major',
        'naturalMinor',
        'harmonicMinor',
        'melodicMinor',
        'ionian',
        'dorian',
        'phrygian',
        'lydian',
        'mixolydian',
        'aeolian',
        'locrian',
        'majorPentatonic',
        'minorPentatonic',
        'blues',
        'majorBlues',
        'wholeTone',
        'chromatic',
      ]),
      direction: z.enum(['ascending', 'descending']),
      includeOctave: z.boolean(),
    })
    .strict(),
  key_signature: z.object({ tonic: note, mode: z.enum(['major', 'minor']) }).strict(),
  identify_chord: z.object({ pitches: pitch.array().min(3).max(8) }).strict(),
  build_chord: z
    .object({
      root: note,
      type: triad,
      inversion: z.number().int().min(0).max(2),
      bassOctave: z.number().int().min(0).max(8),
    })
    .strict(),
  get_exercise_context: z.object({}).strict(),
  get_learner_summary: z.object({}).strict(),
  analyze_progression: z.object({}).strict(),
  check_voice_leading: z.object({}).strict(),
  render_example: z
    .object({ source: z.string().min(1).max(4096), bpm: z.number().int().min(30).max(240) })
    .strict(),
} as const;
export type TutorToolName = keyof typeof tutorToolSchemas;
export function tutorToolJsonSchema(name: TutorToolName) {
  const schema = z.toJSONSchema(tutorToolSchemas[name]);
  delete schema.$schema;
  return schema;
}
