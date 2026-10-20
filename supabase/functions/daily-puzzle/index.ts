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
    }
    const now = Date.now(),
      day = lessonDay(now, timeZone);
    if (answer && answer.day !== day) return json(409, { error: 'day' });
    const local =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
    const source = local
      ? (await import('../../../packages/content/src/authoring.ts')).catalogue
      : catalogue;
    const pool = rushPool(source);
    if (pool.length) {
      const bank = await hash(JSON.stringify({ puzzleEngine: 1, pool }));
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
          const code = /puzzle_(day|conflict|source|answer)/.exec(saved.error.message)?.[1];
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
