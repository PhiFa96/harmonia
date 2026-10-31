import type {
  Message,
  MessageCreateParamsStreaming,
  Usage,
} from 'npm:@anthropic-ai/sdk@1.3.0/resources/messages';
import type { TutorModelProvider } from '../../supabase/functions/_shared/tutor-provider.ts';
import { measuredTutorUsage, addTutorUsage } from '../../supabase/functions/_shared/tutor-usage.ts';
import { EMPTY_TUTOR_USAGE, tutorToolSchemas } from '../../packages/content/src/index.ts';
import type {
  TutorPolicy,
  TutorUsage,
  KnowledgeBundle,
  TutorAnswer,
} from '../../packages/content/src/index.ts';
import { fingerprint, canonical } from './hash.ts';
import type {
  CacheEntry,
  Pending,
  BenchmarkVariant,
  BenchmarkCase,
  BenchmarkOutcome,
} from './schema.ts';
import { cachedMessageSchema, outcomeSchema } from './schema.ts';
import type { TutorResult } from '../../supabase/functions/_shared/tutor-runtime.ts';

/** Rekonstruiert denselben Werkzeugdialog aus quittierten Batch-Antworten. Fehlender Schritt wird nur geplant. */
export class ReplayBatchProvider implements TutorModelProvider {
  pending: Pending | null = null;
  calls: BenchmarkOutcome['tools'] = [];
  private byId = new Map<string, BenchmarkOutcome['tools'][number]>();
  markTool(id: string, ok: boolean) {
    const call = this.byId.get(id);
    if (call) call.ok = ok;
  }
  rounds = 0;
  batchUsage: TutorUsage = { ...EMPTY_TUTOR_USAGE };
  streamUsage: TutorUsage = { ...EMPTY_TUTOR_USAGE };
  private episodeId: string;
  private variant: BenchmarkVariant;
  private locale: 'de' | 'en-US' | 'en-GB';
  private policy: TutorPolicy;
  private streamTariff: NonNullable<TutorPolicy['tariff']>;
  private cache: Record<string, CacheEntry>;
  constructor(
    episodeId: string,
    variant: BenchmarkVariant,
    locale: 'de' | 'en-US' | 'en-GB',
    policy: TutorPolicy,
    streamTariff: NonNullable<TutorPolicy['tariff']>,
    cache: Record<string, CacheEntry>,
  ) {
    this.episodeId = episodeId;
    this.variant = variant;
    this.locale = locale;
    this.policy = policy;
    this.streamTariff = streamTariff;
    this.cache = cache;
  }
  async stream(
    original: MessageCreateParamsStreaming,
    signal: AbortSignal,
    onText: (text: string) => void,
    onUsage: (usage: Usage) => void,
  ): Promise<Message> {
    signal.throwIfAborted();
    const suffix = this.variant.instructions[this.locale];
    const params = {
      ...original,
      stream: false as const,
      ...(suffix
        ? {
            system: [
              ...(typeof original.system === 'string'
                ? [{ type: 'text' as const, text: original.system }]
                : (original.system ?? [])),
              { type: 'text' as const, text: suffix },
            ],
          }
        : {}),
    };
    const id = await fingerprint([this.episodeId, this.rounds, params]),
      entry = this.cache[id];
    if (!entry) {
      if (!this.policy.tariff) throw Error('Tarif fehlt');
      const rate = Math.max(
        this.policy.tariff.input,
        this.policy.tariff.cacheRead,
        this.policy.tariff.cacheWrite5m,
        this.policy.tariff.cacheWrite1h,
      );
      this.pending = {
        id,
        episodeId: this.episodeId,
        params: JSON.parse(JSON.stringify(params)) as Pending['params'],
        reservationNanoUsd:
          this.policy.maxInputTokens * rate +
          this.policy.maxOutputTokens * this.policy.tariff.output,
      };
      throw Error('Batch step pending');
    }
    this.rounds++;
    if (entry.type !== 'succeeded') {
      const reserve = (tariff: NonNullable<TutorPolicy['tariff']>) =>
        this.policy.maxInputTokens *
          Math.max(tariff.input, tariff.cacheRead, tariff.cacheWrite5m, tariff.cacheWrite1h) +
        this.policy.maxOutputTokens * tariff.output;
      if (!this.policy.tariff) throw Error('Tarif fehlt');
      this.batchUsage = {
        ...this.batchUsage,
        costNanoUsd: this.batchUsage.costNanoUsd + reserve(this.policy.tariff),
        estimated: true,
      };
      this.streamUsage = {
        ...this.streamUsage,
        costNanoUsd: this.streamUsage.costNanoUsd + reserve(this.streamTariff),
        estimated: true,
      };
      throw Error('Terminal batch result: ' + entry.type);
    }
    const message = cachedMessageSchema.parse(entry.message) as unknown as Message;
    if (message.model !== this.variant.model) throw Error('Modellquittung passt nicht zum Versuch');
    const tariff = this.policy.tariff;
    if (!tariff) throw Error('Tarif fehlt');
    this.batchUsage = addTutorUsage(this.batchUsage, measuredTutorUsage(message.usage, tariff));
    this.streamUsage = addTutorUsage(
      this.streamUsage,
      measuredTutorUsage(message.usage, this.streamTariff),
    );
    onUsage(message.usage);
    for (const block of message.content) {
      if (block.type === 'text') onText(block.text);
      if (block.type === 'tool_use') {
        const trace = {
          name: block.name,
          input: JSON.parse(
            JSON.stringify(block.input),
          ) as BenchmarkOutcome['tools'][number]['input'],
          ok: false,
        };
        this.calls.push(trace);
        this.byId.set(block.id, trace);
      }
    }
    return message;
  }
}
export function automaticChecks(
  c: BenchmarkCase,
  result: TutorResult | TutorAnswer,
  calls: BenchmarkOutcome['tools'],
  knowledge?: KnowledgeBundle,
): BenchmarkOutcome['checks'] {
  const matches = c.calls.every((expected) =>
    calls.some((actual) => {
      if (actual.name !== expected.name || !actual.ok) return false;
      const schema = tutorToolSchemas[expected.name],
        left = schema.safeParse(expected.input),
        right = schema.safeParse(actual.input);
      return left.success && right.success && canonical(left.data) === canonical(right.data);
    }),
  );
  return {
    completed: result.status === 'complete' && result.text.trim().length > 0,
    tools: matches && !result.errors.includes('tool_error'),
    sources:
      !result.errors.includes('invalid_citation') &&
      (!knowledge ||
        (result.citations ?? []).every((cite) => {
          const chunk = knowledge.chunks.find((c) => c.id === cite.chunkId);
          return (
            chunk &&
            cite.snapshot === knowledge.snapshot &&
            cite.locale === chunk.locale &&
            cite.articleId === chunk.articleId &&
            cite.contentVersion === chunk.contentVersion &&
            cite.title === chunk.title &&
            cite.heading === chunk.heading &&
            cite.section === chunk.section &&
            cite.part === chunk.part &&
            cite.preview === (knowledge.lane === 'preview') &&
            cite.startChar >= chunk.startChar &&
            cite.endChar <= chunk.endChar &&
            Array.from(chunk.body)
              .slice(cite.startChar - chunk.startChar, cite.endChar - chunk.startChar)
              .join('') === cite.quote
          );
        })) &&
      c.sourceArticles.every((article) =>
        result.citations?.some((cite) => cite.articleId === article),
      ),
    examples: !c.exampleRequired || result.examples.length > 0,
    noRuntimeError: !result.errors.some((e) =>
      [
        'tool_error',
        'input_limit',
        'output_limit',
        'round_limit',
        'model_limit',
        'timeout',
        'provider',
        'unverified_example',
      ].includes(e),
    ),
  };
}
export async function outcome(
  c: BenchmarkCase,
  episodeId: string,
  result: TutorResult,
  provider: ReplayBatchProvider,
  knowledge: KnowledgeBundle,
): Promise<BenchmarkOutcome> {
  const checks = automaticChecks(c, result, provider.calls, knowledge);
  return outcomeSchema.parse({
    episodeId,
    status: checks.completed ? 'complete' : 'failed',
    answer: result,
    batchUsage: provider.batchUsage,
    streamUsage: provider.streamUsage,
    rounds: provider.rounds,
    tools: provider.calls,
    checks,
    answerHash: await fingerprint([result, provider.calls, checks, provider.rounds]),
  });
}
