// Ausschließlich lokale SDK-Transportprobe, kein Sprachmodell und keine echte Kostenmessung.
import type {
  MessageCreateParamsStreaming,
  MessageParam,
  Usage,
  TextCitation,
  UserMessageParam,
} from 'npm:@anthropic-ai/sdk@1.3.0/resources/messages';
export const LOCAL_TUTOR_URL =
  /^http:\/\/(?:127\.0\.0\.1|localhost|supabase_kong_harmonia|kong)(?::\d+)?$/;
export function localTutorFixtureEnabled(env: (key: string) => string | undefined) {
  return (
    env('HARMONIA_TUTOR_LOCAL_TEST') === 'true' && LOCAL_TUTOR_URL.test(env('SUPABASE_URL') ?? '')
  );
}
export const fixtureUsage: Usage = {
  input_tokens: 100,
  output_tokens: 20,
  cache_creation_input_tokens: 300,
  cache_read_input_tokens: 200,
  cache_creation: { ephemeral_5m_input_tokens: 300, ephemeral_1h_input_tokens: 0 },
  server_tool_use: null,
  service_tier: 'standard',
  inference_geo: null,
  output_tokens_details: null,
  speed: 'standard',
};
export const localTutorFetch: typeof fetch = (_url, options) => {
  const params = JSON.parse(
    typeof options?.body === 'string' ? options.body : '{}',
  ) as MessageCreateParamsStreaming;
  const first = params.messages
      .filter(
        (m: MessageParam): m is UserMessageParam =>
          m.role === 'user' &&
          (typeof m.content === 'string' || m.content.some((b) => b.type === 'text')),
      )
      .at(-1),
    question =
      typeof first?.content === 'string'
        ? first.content
        : (first?.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join(' ') ?? ''),
    last = params.messages.at(-1),
    result = Array.isArray(last?.content)
      ? last.content.find((b) => b.type === 'tool_result')
      : undefined;
  if (question.includes('fixture:error'))
    return Promise.resolve(
      new Response('{"type":"error","error":{"type":"overloaded_error","message":"test-only"}}', {
        status: 503,
      }),
    );
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const event = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      event('message_start', {
        type: 'message_start',
        message: {
          id: 'msg_fixture',
          type: 'message',
          role: 'assistant',
          content: [],
          model: params.model,
          stop_reason: null,
          stop_sequence: null,
          usage: { ...fixtureUsage, output_tokens: 0 },
        },
      });
      if (question.includes('fixture:timeout')) {
        options?.signal?.addEventListener(
          'abort',
          () => {
            controller.error(new Error('Fixture aborted'));
          },
          { once: true },
        );
        return;
      }
      let stop = 'end_turn';
      const tools = question.includes('fixture:satb')
        ? [{ name: 'check_voice_leading', input: {} }]
        : question.includes('fixture:showcase')
          ? [
              { name: 'get_exercise_context', input: {} },
              { name: 'analyze_interval', input: { from: 'C4', to: 'Fb4' } },
              {
                name: 'render_example',
                input: { source: 'treble | 4/4 | C4/4 Fb4/4 r/2', bpm: 120 },
              },
            ]
          : [
              { name: 'analyze_interval', input: { from: 'C4', to: 'Fb4' } },
              {
                name: 'build_scale',
                input: {
                  tonic: 'C5',
                  type: 'melodicMinor',
                  direction: 'descending',
                  includeOctave: true,
                },
              },
              { name: 'render_example', input: { source: 'treble | 4/4 | C4/1', bpm: 90 } },
              { name: 'get_exercise_context', input: {} },
            ];
      if (
        (!result || question.includes('fixture:loop')) &&
        (question.includes('fixture:tools') ||
          question.includes('fixture:showcase') ||
          question.includes('fixture:satb'))
      ) {
        stop = 'tool_use';
        tools.forEach((tool, index) => {
          event('content_block_start', {
            type: 'content_block_start',
            index,
            content_block: {
              type: 'tool_use',
              id: `tool_${String(params.messages.length)}_${String(index)}`,
              name: tool.name,
              input: {},
            },
          });
          event('content_block_delta', {
            type: 'content_block_delta',
            index,
            delta: { type: 'input_json_delta', partial_json: JSON.stringify(tool.input) },
          });
          event('content_block_stop', { type: 'content_block_stop', index });
        });
      } else {
        if (question.includes('fixture:refusal')) stop = 'refusal';
        const text =
            result && question.includes('fixture:showcase')
              ? 'C–Fes wird als verminderte Quarte geschrieben. Das geprüfte Beispiel lässt dich die Schreibweise und den Klang vergleichen. Dies ist eine lokale Testantwort.'
              : result
                ? 'Engine-geprüft: ' + JSON.stringify(last?.content)
                : 'Eine kurze Erklärung mit einem nächsten Übungsschritt.',
          pieces = question.includes('fixture:markup')
            ? ['Vorher [[no', 'tes:C4/1]] danach.']
            : [text];
        event('content_block_start', {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        });
        if (question.includes('fixture:slow')) {
          event('content_block_delta', {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Ein erster Denkanstoß. ' },
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (options?.signal?.aborted) {
            try {
              controller.close();
            } catch {
              /* Bereits geschlossener Teststream. */
            }
            return;
          }
        }
        for (const text of pieces)
          event('content_block_delta', {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text },
          });
        const document = Array.isArray(first?.content)
          ? first.content.find((block) => block.type === 'document')
          : undefined;
        if (question.includes('fixture:knowledge') && document?.source.type === 'text') {
          const quote = Array.from(document.source.data).slice(0, 80).join('');
          const citation: TextCitation = {
            type: 'char_location',
            document_index: question.includes('fixture:bad-index') ? 999 : 0,
            document_title: 'Untrusted model title',
            file_id: null,
            start_char_index: 0,
            end_char_index: Array.from(quote).length,
            cited_text: question.includes('fixture:bad-quote')
              ? 'Not in the supplied source'
              : quote,
          };
          event('content_block_delta', {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'citations_delta', citation },
          });
        }
        event('content_block_stop', { type: 'content_block_stop', index: 0 });
      }
      event('message_delta', {
        type: 'message_delta',
        delta: { stop_reason: stop, stop_sequence: null },
        usage: { output_tokens: 20 },
      });
      event('message_stop', { type: 'message_stop' });
      controller.close();
    },
  });
  return Promise.resolve(
    new Response(body, {
      headers: { 'Content-Type': 'text/event-stream', 'request-id': 'fixture' },
    }),
  );
};
