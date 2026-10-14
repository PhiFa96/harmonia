import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  tutorPolicySchema,
  tutorRequestSchema,
  TUTOR_PROMPT_VERSION,
  TUTOR_TOOL_VERSION,
} from '../../../packages/content/src/index.ts';
import type {
  ContentCatalogue,
  TutorRequest,
  TutorUsage,
} from '../../../packages/content/src/index.ts';
import { headers, json, hash } from '../_shared/motivation.ts';
import {
  AnthropicTutorProvider,
  tutorReservation,
  emptyTutorUsage,
} from '../_shared/tutor-provider.ts';
import { exerciseContext } from '../_shared/tutor-tools.ts';
import { runTutor } from '../_shared/tutor-runtime.ts';
import type { TutorResult, TutorStatus } from '../_shared/tutor-runtime.ts';
import { redactTutorText } from '../_shared/tutor-prompt.ts';
import {
  localTutorFixtureEnabled,
  LOCAL_TUTOR_URL,
  localTutorFetch,
} from '../_shared/tutor-local-fixture.ts';
import type { TutorModelMessage } from '../_shared/tutor-provider.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const codes: Record<string, number> = {
  subscription: 403,
  quota: 429,
  rate: 429,
  budget: 429,
  busy: 409,
  conflict: 409,
  context: 409,
  deleted: 410,
  policy_changed: 409,
  unavailable: 503,
};
async function boundedBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let length = 0,
    text = '';
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) return text + decoder.decode();
      length += part.value.byteLength;
      if (length > 131072) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(part.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}
async function content(): Promise<ContentCatalogue> {
  if (
    Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
    LOCAL_TUTOR_URL.test(Deno.env.get('SUPABASE_URL') ?? '')
  )
    return (await import('../../../packages/content/src/authoring.ts')).catalogue;
  return catalogue;
}
function scope(request: TutorRequest) {
  return {
    locale: request.locale,
    noteNaming: request.noteNaming,
    mode: request.mode,
    hintLevel: request.hintLevel,
    context: request.context
      ? {
          ...request.context,
          answer: request.context.answer === null ? null : redactTutorText(request.context.answer),
        }
      : null,
  };
}
async function conversationHistory(
  client: SupabaseClient,
  actor: string,
  conversation: string,
): Promise<TutorModelMessage[]> {
  const owned = await client
    .from('tutor_conversations')
    .select('id')
    .eq('id', conversation)
    .eq('user_id', actor)
    .maybeSingle();
  if (owned.error) throw new Error('History');
  if (!owned.data) return [];
  const rows = await client
    .from('tutor_messages')
    .select('role,content')
    .eq('conversation_id', conversation)
    .order('id', { ascending: false })
    .limit(20)
    .overrideTypes<
      { role: 'user' | 'assistant'; content: { text: string; status?: string } }[],
      { merge: false }
    >();
  if (rows.error) throw new Error('History');
  // Nur abgeschlossene Antworten als Gesprächskontext; keine Fehler-/Abbruchtexte als Muster.
  const messages = rows.data.reverse();
  return messages.flatMap((m, index) => {
    const pair = m.role === 'user' ? messages[index + 1] : m;
    if (pair?.content.status !== 'complete') return [];
    return [{ role: m.role, content: redactTutorText(m.content.text) }];
  });
}
function replay(input: TutorRequest, result: TutorResult, usage: TutorUsage) {
  const encoder = new TextEncoder();
  return new Response(
    encoder.encode(
      `event: replay\ndata: ${JSON.stringify({ type: 'replay', id: input.id, conversationId: input.conversationId, result, usage })}\n\nevent: done\ndata: ${JSON.stringify({ type: 'done', status: result.status, replay: true })}\n\n`,
    ),
    { headers: { ...headers, 'Content-Type': 'text/event-stream' } },
  );
}
async function read(client: SupabaseClient, actor: string, url: URL) {
  if (
    url.searchParams.get('view') === 'status' &&
    Array.from(url.searchParams.keys()).length === 1
  ) {
    const row = await client.from('tutor_policy').select('policy').eq('id', true).single();
    const parsed = tutorPolicySchema.safeParse(row.data?.policy);
    if (row.error || !parsed.success) return json(503, { error: 'configuration' });
    const status = await client.rpc('tutor_account_status', { actor });
    if (status.error) return json(503, { error: 'storage' });
    const own = status.data as {
        day: string;
        resetAt: string;
        tier: 'free' | 'premium' | 'max';
        requestsUsed: number;
        requestsLastMinute: number;
        pending: number;
        cost: number;
        heldCost: number;
        globalCost: number;
        globalHeldCost: number;
      },
      policy = parsed.data,
      allowance = policy[own.tier],
      reserve = tutorReservation(policy),
      enabled =
        policy.enabled &&
        (!!Deno.env.get('ANTHROPIC_API_KEY') ||
          localTutorFixtureEnabled((key) => Deno.env.get(key))),
      availability = !enabled
        ? 'unavailable'
        : !allowance.requests
          ? 'subscription'
          : own.requestsUsed >= allowance.requests
            ? 'quota'
            : own.pending
              ? 'busy'
              : own.requestsLastMinute >= policy.requestsPerMinute
                ? 'rate'
                : own.cost + own.heldCost + reserve > allowance.costNanoUsd ||
                    own.globalCost + own.globalHeldCost + reserve > policy.globalDailyCostNanoUsd
                  ? 'budget'
                  : 'available';
    return json(200, {
      day: own.day,
      resetAt: own.resetAt,
      tier: own.tier,
      requestsUsed: own.requestsUsed,
      requestsLimit: allowance.requests,
      requestsRemaining: Math.max(0, allowance.requests - own.requestsUsed),
      availability,
    });
  }
  const id = url.searchParams.get('conversationId');
  if (
    Array.from(url.searchParams.keys()).some(
      (k) => !['conversationId', 'before', 'after'].includes(k),
    )
  )
    return json(400, { error: 'schema' });
  if (id) {
    if (!uuid.test(id) || url.searchParams.has('before')) return json(400, { error: 'schema' });
    const owned = await client
      .from('tutor_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', actor)
      .maybeSingle()
      .overrideTypes<
        { id: string; context: unknown; created_at: string; updated_at: string },
        { merge: false }
      >();
    if (owned.error) return json(503, { error: 'storage' });
    if (!owned.data) return json(404, { error: 'missing' });
    const after = Number(url.searchParams.get('after') ?? 0);
    if (!Number.isSafeInteger(after) || after < 0) return json(400, { error: 'schema' });
    const page = await client
      .from('tutor_messages')
      .select('id,role,content,created_at')
      .eq('conversation_id', id)
      .gt('id', after)
      .order('id')
      .limit(101)
      .overrideTypes<
        { id: number; role: string; content: unknown; created_at: string }[],
        { merge: false }
      >();
    if (page.error) return json(503, { error: 'storage' });
    const messages = page.data.slice(0, 100);
    return json(200, {
      conversation: owned.data,
      messages,
      next: page.data.length > 100 ? messages.at(-1)?.id : null,
    });
  }
  if (url.searchParams.has('after')) return json(400, { error: 'schema' });
  let query = client
    .from('tutor_conversations')
    .select('id,context,created_at,updated_at')
    .eq('user_id', actor)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(21);
  const before = url.searchParams.get('before');
  if (before) {
    if (!uuid.test(before)) return json(400, { error: 'schema' });
    const cursor = await client
      .from('tutor_conversations')
      .select('id,created_at')
      .eq('id', before)
      .eq('user_id', actor)
      .maybeSingle()
      .overrideTypes<{ id: string; created_at: string }, { merge: false }>();
    if (cursor.error || !cursor.data) return json(404, { error: 'missing' });
    query = query.or(
      `created_at.lt.${cursor.data.created_at},and(created_at.eq.${cursor.data.created_at},id.lt.${before})`,
    );
  }
  const page = await query.overrideTypes<
    { id: string; context: unknown; created_at: string; updated_at: string }[],
    { merge: false }
  >();
  if (page.error) return json(503, { error: 'storage' });
  const conversations = page.data.slice(0, 20);
  return json(200, {
    conversations,
    next: page.data.length > 20 ? conversations.at(-1)?.id : null,
  });
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['POST', 'GET', 'DELETE'].includes(request.method)) return json(405, { error: 'method' });
  let reserved: { client: SupabaseClient; actor: string; id: string; lease: string } | null = null;
  try {
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 8192)
      return json(401, { error: 'auth' });
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (url, init) =>
            fetch(url, {
              ...init,
              signal: AbortSignal.any([
                ...(init?.signal ? [init.signal] : []),
                AbortSignal.timeout(15000),
              ]),
            }),
        },
      },
    );
    const auth = await client.auth.getUser(authorization.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const actor = auth.data.user.id,
      url = new URL(request.url);
    if (request.method === 'GET') {
      const response = await read(client, actor, url);
      response.headers.set(
        'X-Harmonia-Tutor-Simulation',
        String(localTutorFixtureEnabled((key) => Deno.env.get(key))),
      );
      return response;
    }
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('conversationId');
      if (
        !id ||
        !uuid.test(id) ||
        Array.from(url.searchParams.keys()).some((k) => k !== 'conversationId')
      )
        return json(400, { error: 'schema' });
      const removed = await client.rpc('delete_tutor_conversation', { actor, conversation: id });
      return removed.error
        ? json(503, { error: 'storage' })
        : removed.data
          ? new Response(null, { status: 204, headers })
          : json(404, { error: 'missing' });
    }
    if (url.search) return json(400, { error: 'schema' });
    const body = await boundedBody(request);
    if (body === null) return json(413, { error: 'size' });
    let value: unknown;
    try {
      value = JSON.parse(body) as unknown;
    } catch {
      return json(400, { error: 'request' });
    }
    const parsed = tutorRequestSchema.safeParse(value);
    if (!parsed.success) return json(400, { error: 'schema' });
    const input = parsed.data,
      fingerprint = await hash(JSON.stringify(input)),
      scoped = scope(input);
    // Idempotente Antworten bleiben ohne Modellzugriff lesbar, auch bei späterem Ausfall/Aboablauf.
    const prior = await client
      .from('tutor_requests')
      .select('request_hash,state,result,usage,lease_until,lease,reserved_cost')
      .eq('id', input.id)
      .eq('user_id', actor)
      .maybeSingle()
      .overrideTypes<
        {
          request_hash: string;
          state: TutorStatus | 'reserved';
          result: TutorResult | null;
          usage: TutorUsage | null;
          lease_until: string;
          lease: string;
          reserved_cost: number;
        },
        { merge: false }
      >();
    if (prior.error) return json(503, { error: 'storage' });
    if (prior.data) {
      if (prior.data.request_hash !== fingerprint) return json(409, { error: 'conflict' });
      if (prior.data.state === 'reserved') {
        if (new Date(prior.data.lease_until).getTime() > Date.now())
          return json(409, { error: 'busy' });
        const recovered = await client.rpc('finish_tutor_request', {
          actor,
          request_id: input.id,
          lease_id: prior.data.lease,
          final_state: 'failed',
          final_usage: {
            ...emptyTutorUsage(),
            costNanoUsd: prior.data.reserved_cost,
            estimated: true,
          },
          final_result: { text: '', examples: [], errors: ['lease_expired'], status: 'failed' },
        });
        if (recovered.error || !recovered.data) return json(503, { error: 'storage' });
        return json(409, { error: 'recovered', retryId: input.id });
      }
      if (!prior.data.result || !prior.data.usage) return json(410, { error: 'deleted' });
      return replay(input, prior.data.result, prior.data.usage);
    }
    const policyRow = await client
      .from('tutor_policy')
      .select('revision,policy')
      .eq('id', true)
      .single()
      .overrideTypes<{ revision: number; policy: unknown }, { merge: false }>();
    if (policyRow.error) return json(503, { error: 'configuration' });
    const checkedPolicy = tutorPolicySchema.safeParse(policyRow.data.policy);
    if (!checkedPolicy.success) return json(503, { error: 'configuration' });
    const policy = checkedPolicy.data,
      test = localTutorFixtureEnabled((key) => Deno.env.get(key)),
      key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!policy.enabled || (!key && !test)) return json(503, { error: 'unavailable' });
    let context: unknown;
    try {
      context = JSON.parse(
        redactTutorText(JSON.stringify(exerciseContext(await content(), input))),
      ) as unknown;
    } catch {
      return json(422, { error: 'content' });
    }
    const claimed = await client.rpc('reserve_tutor_request', {
      actor,
      request_id: input.id,
      conversation: input.conversationId,
      fingerprint,
      scope_hash: await hash(JSON.stringify(scoped)),
      scope: scoped,
      user_message: redactTutorText(input.message),
      policy_revision: policyRow.data.revision,
      worst_cost: tutorReservation(policy),
    });
    if (claimed.error) return json(503, { error: 'storage' });
    const claim = claimed.data as {
      error?: string;
      lease?: string;
      replay?: boolean;
      result?: TutorResult;
      usage?: TutorUsage;
    };
    if (claim.replay && claim.result && claim.usage)
      return replay(input, claim.result, claim.usage);
    if (claim.error)
      return new Response(JSON.stringify({ error: claim.error }), {
        status: codes[claim.error] ?? 503,
        headers: {
          ...headers,
          ...(codes[claim.error] === 429
            ? { 'Retry-After': claim.error === 'rate' ? '60' : '86400' }
            : {}),
        },
      });
    if (!claim.lease) return json(409, { error: 'busy' });
    reserved = { client, actor, id: input.id, lease: claim.lease };
    const history = await conversationHistory(client, actor, input.conversationId),
      provider = new AnthropicTutorProvider(
        test ? 'local-fixture-no-secret' : (key ?? ''),
        test ? localTutorFetch : undefined,
      ),
      abort = new AbortController(),
      encoder = new TextEncoder();
    const held = reserved;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const writer = { writable: true };
        const send = (event: { type: string; [key: string]: unknown }) => {
          if (!writer.writable) return;
          try {
            controller.enqueue(
              encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
            );
          } catch {
            writer.writable = false;
            abort.abort();
          }
        };
        const keepalive = setInterval(() => {
          if (writer.writable)
            try {
              controller.enqueue(encoder.encode(': keepalive\n\n'));
            } catch {
              writer.writable = false;
              abort.abort();
            }
        }, 10000);
        try {
          send({
            type: 'meta',
            id: input.id,
            conversationId: input.conversationId,
            promptVersion: TUTOR_PROMPT_VERSION,
            toolVersion: TUTOR_TOOL_VERSION,
            simulation: test,
          });
          const outcome = await runTutor({
            provider,
            request: input,
            policy,
            context,
            history,
            signal: AbortSignal.any([abort.signal, request.signal]),
            emit: send,
          });
          const finished = await client.rpc('finish_tutor_request', {
            actor,
            request_id: input.id,
            lease_id: held.lease,
            final_state: outcome.result.status,
            final_usage: outcome.usage,
            final_result: outcome.result,
          });
          if (finished.error || !finished.data)
            send({ type: 'error', code: 'storage', retryId: input.id });
          else {
            send({
              type: 'usage',
              usage: outcome.usage,
              model: policy.model,
              tariffVersion: policy.tariff?.version,
              simulation: test,
            });
            send({ type: 'done', status: outcome.result.status, replay: false });
          }
        } catch {
          send({ type: 'error', code: 'server', retryId: input.id });
        } finally {
          clearInterval(keepalive);
          if (writer.writable) controller.close();
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, {
      headers: { ...headers, 'Content-Type': 'text/event-stream', 'X-Accel-Buffering': 'no' },
    });
  } catch {
    // Vor dem Modell gestartete Reservierungen können vollständig freigegeben werden.
    if (reserved)
      await reserved.client.rpc('finish_tutor_request', {
        actor: reserved.actor,
        request_id: reserved.id,
        lease_id: reserved.lease,
        final_state: 'failed',
        final_usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWrite5mTokens: 0,
          cacheWrite1hTokens: 0,
          unknownCacheWriteTokens: 0,
          costNanoUsd: 0,
          estimated: false,
        },
        final_result: { text: '', examples: [], errors: ['server'], status: 'failed' },
      });
    return json(503, { error: 'server' });
  }
});
