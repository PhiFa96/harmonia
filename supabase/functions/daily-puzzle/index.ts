import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { z } from 'zod';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  addPuzzleDays,
  dailyPuzzleForDay,
  gradeRush,
  lessonDay,
  nextPuzzleReset,
  puzzleRequestSchema,
  puzzleViewSchema,
  rushPool,
  timeZoneSchema,
} from '../../../packages/content/src/index.ts';
import { billingBody } from '../_shared/billing.ts';
import { hash } from '../_shared/hash.ts';
import { socialRequestLimit } from '../_shared/social-request-limit.ts';

// Increment when a generator or scoring change affects newly frozen puzzle content.
const PUZZLE_ENGINE_VERSION = 1;
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, field]) => [key, canonical(field)]),
    );
  return value;
}
const banks = new WeakMap<
  typeof catalogue,
  Promise<{ pool: ReturnType<typeof rushPool>; bank: string }>
>();
function puzzleBank(source: typeof catalogue) {
  const cached = banks.get(source);
  if (cached) return cached;
  const task = (async () => {
    const pool = rushPool(source);
    const bank = await hash(
      JSON.stringify(canonical({ puzzleEngine: PUZZLE_ENGINE_VERSION, pool })),
    );
    return { pool, bank };
  })().catch((error: unknown) => {
    banks.delete(source);
    throw error;
  });
  banks.set(source, task);
  return task;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
const rawSchema = z.object({
  puzzle: z
    .object({
      day: z.iso.date(),
      bank: z.string(),
      spec: z.unknown(),
      seed: z.string(),
      difficulty: z.number().int(),
    })
    .nullable(),
  result: z.object({ answer: z.string(), correct: z.boolean() }).nullable(),
  streak: z.number().int().nonnegative(),
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
    let timeZone: string;
    let answer: z.infer<typeof puzzleRequestSchema> | null = null;
    if (request.method === 'POST') {
      let input: unknown;
      try {
        input = JSON.parse(await billingBody(request, 8192));
      } catch {
        return json(400, { error: 'schema' });
      }
      const parsed = puzzleRequestSchema.safeParse(input);
      if (!parsed.success) return json(400, { error: 'schema' });
      answer = parsed.data;
      timeZone = parsed.data.timeZone;
    } else {
      const parsed = timeZoneSchema.safeParse(new URL(request.url).searchParams.get('timeZone'));
      if (!parsed.success) return json(400, { error: 'schema' });
      timeZone = parsed.data;
      const retryAfter = await socialRequestLimit(client, actor, 'daily_puzzle_read');
      if (retryAfter !== null)
        return new Response(JSON.stringify({ error: 'rate', retryAfter }), {
          status: 429,
          headers: { ...headers, 'Retry-After': String(retryAfter) },
        });
    }
    const zone = await client.rpc('puzzle_request_zone', { actor, requested_zone: timeZone });
    if (zone.error || typeof zone.data !== 'boolean') throw new Error('Puzzle zone unavailable');
    if (!zone.data) return json(409, { error: 'zone' });
    const now = Date.now(),
      day = lessonDay(now, timeZone);
    if (answer && answer.day !== day) return json(409, { error: 'day' });
    const local =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
    const source = local
      ? (await import('../../../packages/content/src/authoring.ts')).catalogue
      : catalogue;
    const { pool, bank } = await puzzleBank(source);
    if (pool.length) {
      const last = addPuzzleDays(day, 41);
      const present = await client
        .from('daily_puzzles')
        .select('day')
        .gte('day', day)
        .lte('day', last);
      if (present.error) throw new Error('storage');
      const known = new Set(
        z
          .array(z.object({ day: z.string() }))
          .parse(present.data)
          .map((row) => row.day),
      );
      const planned = Array.from({ length: 42 }, (_, index) => {
        const date = addPuzzleDays(day, index);
        return known.has(date) ? null : dailyPuzzleForDay(pool, bank, date);
      });
      if (planned[0] === null && !known.has(day)) return json(409, { error: 'source' });
      const missing = planned.filter((entry) => entry !== null);
      if (missing.length) {
        const filled = await client.rpc('puzzle_fill', { entries: missing });
        if (filled.error) throw new Error('storage');
      }
    }
    const load = async () => {
      const result = await client.rpc('puzzle_status', { actor, requested_day: day });
      if (result.error) throw new Error('storage');
      return rawSchema.parse(result.data);
    };
    let raw = await load();
    if (answer) {
      if (!raw.puzzle) return json(409, { error: 'source' });
      if (raw.result && raw.result.answer !== answer.answer)
        return json(409, { error: 'conflict' });
      if (!raw.result) {
        const grade = gradeRush(
          {
            spec: raw.puzzle.spec as Parameters<typeof gradeRush>[0]['spec'],
            seed: raw.puzzle.seed,
            difficulty: raw.puzzle.difficulty,
          },
          answer.answer,
        );
        if (!grade.validAnswer) return json(400, { error: 'answer' });
        const saved = await client.rpc('puzzle_answer', {
          actor,
          requested_day: day,
          time_zone: timeZone,
          submitted_answer: answer.answer,
          is_correct: grade.correct,
        });
        if (saved.error) {
          const code = /puzzle_(day|conflict|source|answer|zone)/.exec(saved.error.message)?.[1];
          return json(code === 'answer' ? 400 : 409, { error: code ?? 'unavailable' });
        }
        raw = rawSchema.parse(saved.data);
      }
    }
    if (lessonDay(Date.now(), timeZone) !== day) return json(409, { error: 'day' });
    return json(
      200,
      puzzleViewSchema.parse({
        day,
        resetAt: nextPuzzleReset(now, timeZone),
        available: !!raw.puzzle,
        difficulty: raw.puzzle?.difficulty ?? null,
        streak: raw.streak,
        completed: !!raw.result,
        correct: raw.result?.correct ?? null,
        question:
          raw.puzzle && !raw.result ? { spec: raw.puzzle.spec, seed: raw.puzzle.seed } : null,
      }),
    );
  } catch {
    return json(503, { error: 'unavailable' });
  }
});
