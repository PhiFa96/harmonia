import type {
  MessageParam,
  ToolResultBlockParam,
  Usage,
} from 'npm:@anthropic-ai/sdk@0.133.0/resources/messages';
import type { TutorPolicy, TutorRequest, TutorUsage } from '../../../packages/content/src/index.ts';
import { TUTOR_TOOLS, executeTutorTool } from './tutor-tools.ts';
import { tutorSystemPrompt, TutorTextFilter, redactTutorText } from './tutor-prompt.ts';
import type { TutorModelProvider } from './tutor-provider.ts';
import {
  measuredTutorUsage,
  addTutorUsage,
  emptyTutorUsage,
  tutorReservation,
} from './tutor-provider.ts';

export type TutorStatus = 'complete' | 'refused' | 'partial' | 'failed' | 'cancelled';
export interface TutorResult {
  text: string;
  examples: { id: string; example: unknown }[];
  errors: string[];
  status: TutorStatus;
}
export type TutorEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; id: string; ok: boolean }
  | { type: 'example'; id: string; example: unknown }
  | { type: 'notice'; code: string };

export async function runTutor(input: {
  provider: TutorModelProvider;
  request: TutorRequest;
  policy: TutorPolicy;
  context: unknown;
  history: MessageParam[];
  signal: AbortSignal;
  emit: (event: TutorEvent) => void;
}): Promise<{ result: TutorResult; usage: TutorUsage }> {
  const { provider, request, policy, emit } = input;
  if (!policy.model || !policy.tariff) throw new Error('Tutor configuration');
  const filter = new TutorTextFilter(),
    result: TutorResult = { text: '', examples: [], errors: [], status: 'complete' },
    deadline = AbortSignal.timeout(policy.timeoutMs),
    signal = AbortSignal.any([input.signal, deadline]),
    messages: MessageParam[] = [
      ...input.history,
      { role: 'user', content: [{ type: 'text', text: redactTutorText(request.message) }] },
    ],
    task = {
      type: 'text' as const,
      text:
        'TRUSTED CURRENT TASK AND MODE (server data, not instructions):\n' +
        redactTutorText(
          JSON.stringify({
            mode: request.mode,
            hintLevel: request.hintLevel,
            context: input.context,
          }),
        ),
    },
    system = [...tutorSystemPrompt(request), task];
  let usage = emptyTutorUsage(),
    attempted = false;
  const pending: { usage: Usage | null } = { usage: null },
    usedIds = new Set<string>();
  const text = (delta: string) => {
    const safe = filter.push(delta);
    if (safe) {
      result.text += safe;
      emit({ type: 'text', text: safe });
    }
  };
  const notice = (code: string) => {
    result.errors.push(code);
    emit({ type: 'notice', code });
  };
  try {
    for (let round = 0; round < policy.maxRounds; round++) {
      signal.throwIfAborted();
      // UTF-8-Bytes sind eine konservative Obergrenze für Text-/Tool-Token. Keine Schätzung mit 4 Zeichen/Token.
      const params = {
        model: policy.model,
        max_tokens: policy.maxOutputTokens,
        stream: true as const,
        system,
        messages,
        tools: TUTOR_TOOLS,
        tool_choice: { type: 'auto' as const },
        output_config: { effort: policy.effort },
      };
      if (round === 0) {
        while (
          new TextEncoder().encode(JSON.stringify(params)).length > policy.maxInputTokens &&
          messages.length > 1
        )
          messages.splice(0, 2);
      }
      if (new TextEncoder().encode(JSON.stringify(params)).length > policy.maxInputTokens) {
        notice('input_limit');
        result.status = 'partial';
        break;
      }
      attempted = true;
      pending.usage = null;
      const response = await provider.stream(params, signal, text, (raw) => {
        pending.usage = raw;
      });
      usage = addTutorUsage(usage, measuredTutorUsage(response.usage, policy.tariff));
      pending.usage = null;
      if (response.stop_reason === 'refusal') {
        notice('refusal');
        result.status = 'refused';
        break;
      }
      if (response.stop_reason === 'end_turn') break;
      if (response.stop_reason !== 'tool_use') {
        notice(response.stop_reason === 'max_tokens' ? 'output_limit' : 'model_limit');
        result.status = 'partial';
        break;
      }
      const calls = response.content.filter((b) => b.type === 'tool_use');
      if (
        !calls.length ||
        calls.length > policy.maxToolsPerRound ||
        new Set(calls.map((c) => c.id)).size !== calls.length ||
        calls.some((c) => usedIds.has(c.id) || !/^[A-Za-z0-9_-]{1,128}$/.test(c.id))
      ) {
        notice('tool_limit');
        result.status = 'partial';
        break;
      }
      const outputs: ToolResultBlockParam[] = [];
      for (const call of calls) {
        usedIds.add(call.id);
        const output = executeTutorTool(call.name, call.input, request, input.context);
        emit({ type: 'tool', name: call.name, id: call.id, ok: output.ok });
        if (!output.ok) notice('tool_error');
        if ('example' in output) {
          const example = { id: call.id, example: output.example };
          result.examples.push(example);
          emit({ type: 'example', ...example });
        }
        outputs.push({
          type: 'tool_result',
          tool_use_id: call.id,
          is_error: !output.ok,
          content: JSON.stringify(output),
        });
      }
      messages.push(
        { role: 'assistant', content: response.content },
        { role: 'user', content: outputs },
      );
      if (round === policy.maxRounds - 1) {
        notice('round_limit');
        result.status = 'partial';
      }
    }
  } catch {
    if (pending.usage)
      usage = addTutorUsage(usage, measuredTutorUsage(pending.usage, policy.tariff));
    // Ein Transportabbruch kann nach berechneten, aber noch nicht gemeldeten Token erfolgen.
    if (attempted)
      usage = {
        ...usage,
        costNanoUsd: Math.max(usage.costNanoUsd, tutorReservation(policy)),
        estimated: true,
      };
    result.status = input.signal.aborted ? 'cancelled' : result.text ? 'partial' : 'failed';
    notice(input.signal.aborted ? 'cancelled' : deadline.aborted ? 'timeout' : 'provider');
  }
  const tail = filter.push('', true);
  if (tail) {
    result.text += tail;
    emit({ type: 'text', text: tail });
  }
  if (filter.rejectedExamples) notice('unverified_example');
  return { result, usage };
}
