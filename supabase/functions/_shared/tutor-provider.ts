import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';
import type {
  Message,
  MessageParam,
  MessageCreateParamsStreaming,
  Usage,
} from 'npm:@anthropic-ai/sdk@0.133.0/resources/messages';
import type { TutorPolicy, TutorTariff, TutorUsage } from '../../../packages/content/src/index.ts';
import { EMPTY_TUTOR_USAGE, tutorUsageSchema } from '../../../packages/content/src/index.ts';

/** Transportgrenze: Produktions-SDK und Deno-Simulation verwenden dieselben Request-/Streamtypen. */
export interface TutorModelProvider {
  stream(
    params: MessageCreateParamsStreaming,
    signal: AbortSignal,
    onText: (text: string) => void,
    onUsage: (usage: Usage) => void,
  ): Promise<Message>;
}
export type TutorModelMessage = MessageParam;
export class AnthropicTutorProvider implements TutorModelProvider {
  private client: Anthropic;
  constructor(key: string, transport?: typeof fetch) {
    this.client = new Anthropic({
      apiKey: key,
      baseURL: 'https://api.anthropic.com',
      authToken: null,
      webhookKey: null,
      logLevel: 'off',
      maxRetries: 0,
      ...(transport ? { fetch: transport } : {}),
    });
  }
  async stream(
    params: MessageCreateParamsStreaming,
    signal: AbortSignal,
    onText: (text: string) => void,
    onUsage: (usage: Usage) => void,
  ) {
    const stream = this.client.messages.stream(params, { signal });
    let usage: Usage | null = null;
    stream.on('streamEvent', (event) => {
      if (event.type === 'message_start') usage = event.message.usage;
      if (event.type === 'message_delta' && usage)
        usage = {
          ...usage,
          input_tokens: event.usage.input_tokens ?? usage.input_tokens,
          output_tokens: event.usage.output_tokens,
          cache_creation_input_tokens:
            event.usage.cache_creation_input_tokens ?? usage.cache_creation_input_tokens,
          cache_read_input_tokens:
            event.usage.cache_read_input_tokens ?? usage.cache_read_input_tokens,
        };
      if (usage) onUsage(usage);
    });
    stream.on('text', onText);
    return await stream.finalMessage();
  }
}
export function measuredTutorUsage(raw: Usage, tariff: TutorTariff): TutorUsage {
  const write5m = raw.cache_creation?.ephemeral_5m_input_tokens ?? 0,
    write1h = raw.cache_creation?.ephemeral_1h_input_tokens ?? 0,
    unknown = Math.max(0, (raw.cache_creation_input_tokens ?? 0) - write5m - write1h);
  return tutorUsageSchema.parse({
    inputTokens: raw.input_tokens,
    outputTokens: raw.output_tokens,
    cacheReadTokens: raw.cache_read_input_tokens ?? 0,
    cacheWrite5mTokens: write5m,
    cacheWrite1hTokens: write1h,
    unknownCacheWriteTokens: unknown,
    costNanoUsd:
      raw.input_tokens * tariff.input +
      raw.output_tokens * tariff.output +
      (raw.cache_read_input_tokens ?? 0) * tariff.cacheRead +
      write5m * tariff.cacheWrite5m +
      write1h * tariff.cacheWrite1h +
      unknown * Math.max(tariff.cacheWrite5m, tariff.cacheWrite1h),
    estimated: unknown > 0,
  });
}
export function addTutorUsage(a: TutorUsage, b: TutorUsage): TutorUsage {
  return tutorUsageSchema.parse({
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWrite5mTokens: a.cacheWrite5mTokens + b.cacheWrite5mTokens,
    cacheWrite1hTokens: a.cacheWrite1hTokens + b.cacheWrite1hTokens,
    unknownCacheWriteTokens: a.unknownCacheWriteTokens + b.unknownCacheWriteTokens,
    costNanoUsd: a.costNanoUsd + b.costNanoUsd,
    estimated: a.estimated || b.estimated,
  });
}
export function tutorReservation(policy: TutorPolicy) {
  const tariff = policy.tariff;
  if (!tariff) return 0;
  return tutorUsageSchema.shape.costNanoUsd.parse(
    policy.maxRounds *
      (policy.maxInputTokens *
        Math.max(tariff.input, tariff.cacheRead, tariff.cacheWrite5m, tariff.cacheWrite1h) +
        policy.maxOutputTokens * tariff.output),
  );
}
export const emptyTutorUsage = (): TutorUsage => ({ ...EMPTY_TUTOR_USAGE });
