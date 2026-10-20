import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { z } from 'zod';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  rushPool,
  rushBankIdentity,
  rushPoolSchema,
  rushPolicySchema,
  rushQuestion,
  gradeRush,
  rushRequestSchema,
  rushViewSchema,
  rushStatusSchema,
  rushLeaderboardSchema,
  rushModeSchema,
  RUSH_SCOPES,
} from '../../../packages/content/src/rush.ts';
import { billingBody } from '../_shared/billing.ts';
import { hash } from '../_shared/hash.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
const rowSchema = z.object({
  id: z.uuid(),
  mode: rushModeSchema,
  bank: z.string(),
  seed: z.uuid().nullable(),
  pool: rushPoolSchema.nullable(),
  policy: rushPolicySchema,
  state: z.enum(['active', 'finished', 'abandoned']),
  started_at: z.string(),
  deadline: z.string().nullable(),
  last_at: z.string(),
  revision: z.number().int(),
  correct: z.number().int(),
  mistakes: z.number().int(),
  score: z.number().int(),
  xp: z.number().int(),
});
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'method' });
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const client = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
      },
    });
    const token = request.headers.get('Authorization') ?? '';
    if (!token.startsWith('Bearer ') || token.length > 8192) return json(401, { error: 'auth' });
    const auth = await client.auth.getUser(token.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const actor = auth.data.user.id;
    const rpc = async (name: string, body: object) => {
      const result = await client.rpc(name, { actor, ...body });
      if (result.error) {
        const code = ['limit', 'active', 'conflict', 'fast', 'source'].find((c) =>
          result.error.message.includes('rush_' + c),
        );
        if (code) throw new RushError(code);
        throw new Error('Storage');
      }
      return result.data as unknown;
    };
    const view = async (input: unknown) => {
      const r = rowSchema.parse(input);
      const last = r.revision
        ? await client
            .from('rush_steps')
            .select('ordinal,answer,correct')
            .eq('user_id', actor)
            .eq('run_id', r.id)
            .eq('ordinal', r.revision - 1)
            .maybeSingle()
        : null;
      if (last?.error) throw new Error('Storage');
      const previous = z
        .object({ ordinal: z.number().int(), answer: z.string(), correct: z.boolean() })
        .nullable()
        .parse(last?.data ?? null);
      return rushViewSchema.parse({
        id: r.id,
        mode: r.mode,
        bank: r.bank,
        state: r.state,
        startedAt: Date.parse(r.started_at),
        deadline: r.deadline ? Date.parse(r.deadline) : null,
        serverNow: Date.now(),
        index: r.revision,
        correct: r.correct,
        mistakes: r.mistakes,
        score: r.score,
        xp: r.xp,
        question:
          r.state === 'active' && r.pool && r.seed
            ? rushQuestion(r.pool, r.seed, r.revision, r.policy.difficultyEvery)
            : null,
        last: previous
          ? { index: previous.ordinal, answer: previous.answer, correct: previous.correct }
          : null,
      });
    };
    const params = new URL(request.url).searchParams;
    if (request.method === 'GET' && !params.has('board')) {
      const s = z
        .object({
          remaining: z.number().int(),
          limit: z.number().int(),
          resetAt: z.number(),
          run: z.unknown().nullable(),
        })
        .parse(await rpc('rush_status', {}));
      return json(200, rushStatusSchema.parse({ ...s, run: s.run ? await view(s.run) : null }));
    }
    const local =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
    const current = local
      ? (await import('../../../packages/content/src/authoring.ts')).catalogue
      : catalogue;
    const pool = rushPool(current);
    const policy = await client.from('rush_policy').select('policy').eq('id', true).single();
    if (policy.error) throw new Error('Policy');
    const config = rushPolicySchema.parse(policy.data.policy);
    const bank = await hash(rushBankIdentity(pool, config));
    if (request.method === 'GET') {
      const mode = rushModeSchema.safeParse(params.get('mode')),
        scope = z.enum(RUSH_SCOPES).safeParse(params.get('board'));
      if (!mode.success || !scope.success) return json(400, { error: 'schema' });
      // The active competition always uses the current reviewed bank and policy.
      return json(
        200,
        rushLeaderboardSchema.parse(
          await rpc('rush_leaderboard', {
            selected_mode: mode.data,
            selected_scope: scope.data,
            bank_version: bank,
          }),
        ),
      );
    }
    let body;
    try {
      body = rushRequestSchema.safeParse(JSON.parse(await billingBody(request, 16384)));
    } catch {
      return json(400, { error: 'schema' });
    }
    if (!body.success) return json(400, { error: 'schema' });
    const b = body.data;
    if (b.action === 'start') {
      if (!pool.length) return json(409, { error: 'source' });
      return json(
        200,
        await view(
          await rpc('start_rush', {
            run: b.id,
            selected_mode: b.mode,
            bank_version: bank,
            task_pool: pool,
            server_seed: crypto.randomUUID(),
          }),
        ),
      );
    }
    const saved = await client
      .from('rush_runs')
      .select('*')
      .eq('user_id', actor)
      .eq('id', b.id)
      .maybeSingle();
    if (saved.error) throw new Error('Storage');
    if (!saved.data) return json(404, { error: 'missing' });
    const r = rowSchema.parse(saved.data);
    if (b.action === 'finish' || b.action === 'abandon')
      return json(
        200,
        await view(await rpc('finish_rush', { run: b.id, abandon: b.action === 'abandon' })),
      );
    if (r.state !== 'active' || !r.pool || !r.seed || b.index !== r.revision) {
      // Only an identical stored answer can be retried; no client-supplied result is accepted.
      const previous = await client
        .from('rush_steps')
        .select('answer')
        .eq('user_id', actor)
        .eq('run_id', b.id)
        .eq('ordinal', b.index)
        .maybeSingle();
      if (previous.error) throw new Error('Storage');
      if (previous.data?.answer !== b.answer) return json(409, { error: 'conflict' });
      return json(200, await view(await rpc('finish_rush', { run: b.id })));
    }
    const question = rushQuestion(r.pool, r.seed, b.index, r.policy.difficultyEvery),
      grade = gradeRush(question, b.answer);
    if (!grade.validAnswer) return json(400, { error: 'answer' });
    return json(
      200,
      await view(
        await rpc('apply_rush_answer', {
          run: b.id,
          expected_index: b.index,
          submitted_answer: b.answer,
          is_correct: grade.correct,
          points: grade.correct ? question.difficulty * 10 : 0,
        }),
      ),
    );
  } catch (error) {
    if (error instanceof RushError)
      return json(error.code === 'limit' ? 403 : error.code === 'fast' ? 429 : 409, {
        error: error.code,
      });
    return json(503, { error: 'unavailable' });
  }
});
class RushError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
