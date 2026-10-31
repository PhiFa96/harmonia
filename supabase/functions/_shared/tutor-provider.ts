import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import type {
  Message,
  MessageParam,
  MessageCreateParamsStreaming,
  Usage,
  TextCitation,
} from 'npm:@anthropic-ai/sdk@1.3.0/resources/messages';

/** Transportgrenze: Produktions-SDK und Deno-Simulation verwenden dieselben Request-/Streamtypen. */
export interface TutorModelProvider {
  stream(
    params: MessageCreateParamsStreaming,
    signal: AbortSignal,
    onText: (text: string) => void,
    onUsage: (usage: Usage) => void,
    onCitation?: (citation: TextCitation, blockIndex: number) => void,
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
      // SDK 1.x traces and propagates trace context unless told otherwise; the tutor sends neither.
      openTelemetry: { propagation: false, traces: false },
      maxRetries: 0,
      ...(transport ? { fetch: transport } : {}),
    });
  }
  async stream(
    params: MessageCreateParamsStreaming,
    signal: AbortSignal,
    onText: (text: string) => void,
    onUsage: (usage: Usage) => void,
    onCitation?: (citation: TextCitation, blockIndex: number) => void,
  ) {
    const stream = this.client.messages.stream(params, { signal });
    let usage: Usage | null = null;
    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_delta' && event.delta.type === 'citations_delta')
        onCitation?.(event.delta.citation, event.index);
      if (event.type === 'content_block_start' && event.content_block.type === 'text')
        for (const citation of event.content_block.citations ?? [])
          onCitation?.(citation, event.index);
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
export {
  measuredTutorUsage,
  addTutorUsage,
  tutorReservation,
  emptyTutorUsage,
} from './tutor-usage.ts';
