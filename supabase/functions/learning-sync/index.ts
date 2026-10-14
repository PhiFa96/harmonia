import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  learningSyncRequestSchema,
  validateLearningEvent,
  lessonReward,
  lessonProgress,
  rewardRuleSchema,
  rewardRuleAt,
  lessonDay,
  learningRowSchema,
  accessSourceSchema,
  accessSourceDetails,
  retainLearningEvent,
} from '../../../packages/content/src/index.ts';
import type { ContentCatalogue } from '../../../packages/content/src/index.ts';
const learningRewardPageSchema = learningRowSchema
  .extend({
    reward: learningRowSchema.shape.reward.unwrap().nullable(),
  })
  .array()
  .max(201);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
async function content(): Promise<ContentCatalogue> {
  // Entwürfe ausschließlich in der ausdrücklich aktivierten lokalen Integration, nie auf einem entfernten Projekt.
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  if (
    Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
    /^http:\/\/(?:127\.0\.0\.1|localhost|supabase_kong_harmonia|kong)(?::\d+)?$/.test(url)
  )
    return (await import('../../../packages/content/src/authoring.ts')).catalogue;
  return catalogue;
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method' });
  try {
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 8192)
      return json(401, { error: 'auth' });
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client.auth.getUser(authorization.slice(7));
    if (error) return json(401, { error: 'auth' });
    const body = await request.text();
    if (body.length > 262144) return json(413, { error: 'size' });
    const parsed = learningSyncRequestSchema.safeParse(JSON.parse(body) as unknown);
    if (!parsed.success) return json(400, { error: 'schema' });
    const current = await content();
    const rules = await client.from('reward_rules').select('rule').order('effective_at');
    if (rules.error) return json(503, { error: 'rules' });
    const rewardRules = rules.data.map((r) => rewardRuleSchema.parse(r.rule));
    const rewards: {
      id: string;
      newAmount: number;
      repeatAmount: number;
      date: string;
      ruleVersion: number;
      qualified: boolean;
    }[] = [];
    const summaries: unknown[] = [];
    const proofs: { id: string; source: unknown; cost: number; level: number }[] = [];
    try {
      for (const event of parsed.data.events) {
        const proof = validateLearningEvent(current, event);
        summaries.push(retainLearningEvent(current, event));
        if (event.kind === 'lesson') {
          const source = accessSourceSchema.parse({
            kind: 'lesson',
            lessonId: event.lessonId,
            contentVersion: event.contentVersion,
            seed: event.seed,
            ...(event.planKey ? { planKey: event.planKey } : {}),
          });
          proofs.push({ id: event.id, source, ...accessSourceDetails(current, source) });
        }
        if (event.kind === 'lesson' && event.timeZone && 'session' in proof) {
          if (event.finishedAt > Date.now() + 300000) throw new Error('Future completion');
          const rule = rewardRuleAt(rewardRules, event.finishedAt);
          rewards.push({
            ruleVersion: rule.version,
            qualified: lessonProgress(proof.session).passed,
            id: event.id,
            newAmount: lessonReward(proof.session, false, rule),
            repeatAmount: lessonReward(proof.session, true, rule),
            date: lessonDay(event.finishedAt, event.timeZone),
          });
        }
      }
    } catch {
      return json(422, { error: 'evidence' });
    }
    const result = await client.rpc('append_privacy_learning_results', {
      actor: data.user.id,
      events: parsed.data.events,
      rewards,
      proofs,
      summaries,
    });
    if (result.error)
      return json(result.error.message.startsWith('Access ') ? 403 : 409, {
        error: result.error.message.startsWith('Access ') ? 'access' : 'conflict',
      });
    const rows = await client.rpc('learning_reward_page', {
      actor: data.user.id,
      after_sequence: parsed.data.since,
    });
    if (rows.error) return json(503, { error: 'storage' });
    const parsedRows = learningRewardPageSchema.safeParse(rows.data);
    if (!parsedRows.success) return json(503, { error: 'storage' });
    const page = parsedRows.data.slice(0, 200);
    if (parsed.data.rowFormat !== 2 && page.some((row) => row.event.kind === 'retained'))
      return json(426, { error: 'upgrade_required' });
    return json(200, {
      accepted: parsed.data.events.map((e) => e.id),
      rows: page.map((row) => {
        return {
          sequence: row.sequence,
          event: row.event,
          ...(row.reward
            ? {
                reward:
                  parsed.data.rewardFormat === 2
                    ? row.reward
                    : { amount: row.reward.amount, date: row.reward.date },
              }
            : {}),
        };
      }),
      cursor: page.at(-1)?.sequence ?? parsed.data.since,
      more: parsedRows.data.length > 200,
    });
  } catch {
    return json(400, { error: 'request' });
  }
});
