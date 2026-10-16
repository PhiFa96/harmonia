import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { z } from 'zod';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  duelRequestSchema,
  duelViewSchema,
  rateDuelPair,
  rushBankIdentity,
  rushPolicySchema,
  rushPool,
  rushPoolSchema,
  rushQuestion,
  gradeRush,
} from '../../../packages/content/src/index.ts';
import type { DuelRatingPlayer } from '../../../packages/content/src/index.ts';
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
const gameSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['live', 'friend', 'ghost']),
  bank: z.string(),
  seed: z.uuid().nullable(),
  pool: rushPoolSchema.nullable(),
  policy: rushPolicySchema,
  starts_at: z.string(),
  deadline: z.string(),
  state: z.enum(['active', 'finished']),
  winner_id: z.uuid().nullable(),
  ghost_score: z.number().int().nullable(),
});
const playerSchema = z.object({
  user_id: z.uuid(),
  ordinal: z.number().int(),
  correct: z.number().int(),
  mistakes: z.number().int(),
  score: z.number().int(),
  rating_before: z.number().nullable(),
  rating_after: z.number().nullable(),
  outcome: z.enum(['win', 'loss', 'draw']).nullable(),
});
const rawSchema = z.discriminatedUnion('phase', [
  z.object({ phase: z.literal('idle') }),
  z.object({ phase: z.literal('queue'), joinedAt: z.number() }),
  z.object({ phase: z.literal('invite'), token: z.uuid(), expiresAt: z.number() }),
  z.object({
    phase: z.literal('game'),
    game: gameSchema,
    player: playerSchema,
    rival: z.object({ index: z.number(), score: z.number() }),
  }),
]);
const snapshotSchema = z.object({
  game: gameSchema,
  players: z
    .array(
      z.object({
        userId: z.uuid(),
        score: z.number().int(),
        rating: z.number(),
        deviation: z.number(),
        volatility: z.number(),
        matches: z.number().int(),
      }),
    )
    .min(1)
    .max(2),
});
async function settleGame(client: SupabaseClient, id: string) {
  const result = await client.rpc('duel_settlement_snapshot', { game: id });
  if (result.error) throw new Error('storage');
  const snapshot = snapshotSchema.parse(result.data);
  if (snapshot.game.state === 'finished' || Date.now() < Date.parse(snapshot.game.deadline))
    return false;
  const updated =
    snapshot.game.kind === 'live' && snapshot.players.length === 2
      ? rateDuelPair(
          snapshot.players as [DuelRatingPlayer, DuelRatingPlayer],
          Date.parse(snapshot.game.deadline),
        )
      : [];
  const committed = await client.rpc('duel_settle', { game: id, updated });
  if (committed.error) throw new Error('storage');
  return committed.data === true;
}

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
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (service && (await hash(token)) === (await hash('Bearer ' + service))) {
      if (request.method !== 'POST') return json(405, { error: 'method' });
      let body: unknown;
      try {
        body = JSON.parse(await billingBody(request, 1024));
      } catch {
        return json(400, { error: 'schema' });
      }
      if (!body || typeof body !== 'object' || !('action' in body) || body.action !== 'sweep')
        return json(400, { error: 'schema' });
      const expired = await client.rpc('duel_expired', { batch_size: 100 });
      if (expired.error) throw new Error('storage');
      const ids = z.array(z.uuid()).max(100).parse(expired.data);
      let settled = 0;
      for (const id of ids) if (await settleGame(client, id)) settled++;
      return json(200, { settled, more: ids.length === 100 });
    }
    const auth = await client.auth.getUser(token.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const actor = auth.data.user.id;
    const rpc = async (name: string, body: object = {}) => {
      const result = await client.rpc(name, { actor, ...body });
      if (result.error) {
        const match = /duel_(source|active|conflict|fast|missing|retry|early|answer|rating)/.exec(
          result.error.message,
        );
        if (match?.[1]) throw new DuelError(match[1]);
        throw new Error('storage');
      }
      return result.data as unknown;
    };
    const status = async () => {
      let raw = rawSchema.parse(await rpc('duel_status'));
      if (
        raw.phase === 'game' &&
        raw.game.state === 'active' &&
        Date.now() >= Date.parse(raw.game.deadline)
      ) {
        await settleGame(client, raw.game.id);
        raw = rawSchema.parse(await rpc('duel_status'));
      }
      if (raw.phase !== 'game') return duelViewSchema.parse(raw);
      const g = raw.game,
        p = raw.player;
      const previous = p.ordinal
        ? await client
            .from('duel_steps')
            .select('ordinal,answer,correct')
            .eq('game_id', g.id)
            .eq('user_id', actor)
            .eq('ordinal', p.ordinal - 1)
            .maybeSingle()
        : null;
      if (previous?.error) throw new Error('storage');
      const last = previous?.data
        ? {
            index: previous.data.ordinal as number,
            answer: previous.data.answer as string,
            correct: previous.data.correct as boolean,
          }
        : null;
      const result = g.state === 'finished' ? p.outcome : null;
      return duelViewSchema.parse({
        phase: 'game',
        id: g.id,
        kind: g.kind,
        state: g.state,
        startsAt: Date.parse(g.starts_at),
        deadline: Date.parse(g.deadline),
        serverNow: Date.now(),
        own: { index: p.ordinal, correct: p.correct, mistakes: p.mistakes, score: p.score },
        rival: raw.rival,
        ghostScore: g.state === 'finished' ? g.ghost_score : null,
        outcome: result,
        ratingBefore: p.rating_before,
        ratingAfter: p.rating_after,
        question:
          g.state === 'active' && g.pool && g.seed
            ? rushQuestion(g.pool, g.seed, p.ordinal, g.policy.difficultyEvery)
            : null,
        last,
      });
    };
    if (request.method === 'GET') return json(200, await status());
    let parsed;
    try {
      parsed = duelRequestSchema.safeParse(JSON.parse(await billingBody(request, 16384)));
    } catch {
      return json(400, { error: 'schema' });
    }
    if (!parsed.success) return json(400, { error: 'schema' });
    const body = parsed.data;
    if (body.action === 'cancel') {
      await rpc('duel_cancel');
      return json(200, await status());
    }
    if (body.action === 'answer') {
      const row = await client.from('duel_games').select('*').eq('id', body.game).maybeSingle();
      if (row.error) throw new Error('storage');
      if (!row.data) return json(404, { error: 'missing' });
      const g = gameSchema.parse(row.data);
      const player = await client
        .from('duel_players')
        .select('ordinal')
        .eq('game_id', g.id)
        .eq('user_id', actor)
        .maybeSingle();
      if (player.error) throw new Error('storage');
      if (!player.data) return json(404, { error: 'missing' });
      if (
        player.data.ordinal !== body.index ||
        g.state !== 'active' ||
        Date.now() >= Date.parse(g.deadline)
      ) {
        const prior = await client
          .from('duel_steps')
          .select('answer')
          .eq('game_id', g.id)
          .eq('user_id', actor)
          .eq('ordinal', body.index)
          .maybeSingle();
        if (prior.error) throw new Error('storage');
        if (
          prior.data?.answer !== body.answer &&
          !(g.state === 'active' && Date.now() >= Date.parse(g.deadline))
        )
          return json(409, { error: 'conflict' });
        return json(200, await status());
      }
      if (!g.pool || !g.seed) return json(409, { error: 'source' });
      const question = rushQuestion(g.pool, g.seed, body.index, g.policy.difficultyEvery);
      const grade = gradeRush(question, body.answer);
      if (!grade.validAnswer) return json(400, { error: 'answer' });
      await rpc('duel_answer', {
        game: g.id,
        expected_index: body.index,
        submitted_answer: body.answer,
        is_correct: grade.correct,
        points: grade.correct ? question.difficulty * 10 : 0,
      });
      return json(200, await status());
    }
    const current = await status();
    if (current.phase === 'game' && current.state === 'active') return json(200, current);
    const local =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
    const source = local
      ? (await import('../../../packages/content/src/authoring.ts')).catalogue
      : catalogue;
    const pool = rushPool(source);
    if (!pool.length) return json(409, { error: 'source' });
    const policy = await client.from('rush_policy').select('policy').eq('id', true).single();
    if (policy.error) throw new Error('storage');
    const rules = rushPolicySchema.parse(policy.data.policy);
    const bank = await hash(rushBankIdentity(pool, rules));
    if (body.action === 'find')
      await rpc('duel_find', {
        bank_version: bank,
        task_pool: pool,
        rules,
        server_seed: crypto.randomUUID(),
        new_game: crypto.randomUUID(),
      });
    else if (body.action === 'invite')
      await rpc('duel_invite_create', { bank_version: bank, token: body.token });
    else
      await rpc('duel_invite_accept', {
        token: body.token,
        bank_version: bank,
        task_pool: pool,
        rules,
        server_seed: crypto.randomUUID(),
        new_game: crypto.randomUUID(),
      });
    return json(200, await status());
  } catch (error) {
    if (error instanceof DuelError)
      return json(error.code === 'fast' ? 429 : error.code === 'missing' ? 404 : 409, {
        error: error.code,
      });
    return json(503, { error: 'unavailable' });
  }
});
class DuelError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
