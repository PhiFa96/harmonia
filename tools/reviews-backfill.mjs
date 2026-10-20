// Replays existing canonical events. Never creates answer tables or changes XP/progress.
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { processPendingReviews } from '../supabase/functions/_shared/reviews.ts';
import { catalogue as published } from '../packages/content/src/published.ts';

const parsed = parseArgs({
  options: {
    local: { type: 'boolean' },
    remote: { type: 'boolean' },
    preview: { type: 'boolean' },
    check: { type: 'boolean' },
    actor: { type: 'string' },
  },
});
const args = new Set(
  Object.entries(parsed.values)
    .filter(([, value]) => value === true)
    .map(([key]) => '--' + key),
);
const actor = parsed.values.actor ?? null;
if (actor !== null && !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(actor))
  throw Error('Invalid review account selector');
if (args.has('--local') === args.has('--remote')) throw Error('Choose --local or --remote');
if (args.has('--remote') && args.has('--preview')) throw Error('Preview is local only');
const local = args.has('--local');
const status = local
  ? JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    )
  : null;
const origin = new URL(local ? status.API_URL : process.env.SUPABASE_URL);
const key = local ? status.SERVICE_ROLE_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY;
if (
  !key ||
  origin.username ||
  origin.password ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash
)
  throw Error('Invalid review backend binding');
if (
  local
    ? origin.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
    : origin.protocol !== 'https:'
)
  throw Error('Invalid review backend origin');
const client = {
  async rpc(name, body) {
    const response = await fetch(new URL('/rest/v1/rpc/' + name, origin), {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return { data: null, error: { status: response.status } };
    return { data: await response.json(), error: null };
  },
};
if (args.has('--check')) {
  const page = await client.rpc('review_pending', { actor, limit_count: 1 });
  if (page.error || !Array.isArray(page.data)) throw Error('Review queue unavailable');
  console.log(JSON.stringify({ pending: page.data.length > 0, mode: local ? 'local' : 'remote' }));
  process.exitCode = page.data.length ? 1 : 0;
} else {
  const catalogue = args.has('--preview')
    ? (await import('../packages/content/src/authoring.ts')).catalogue
    : published;
  const totals = { applied: 0, rated: 0, excluded: 0, already: 0, missing: 0 };
  let complete = false;
  // Bound this invocation; rerunning continues from durable per-event receipts.
  for (let page = 0; page < 200; page++) {
    const result = await processPendingReviews(client, catalogue, actor);
    for (const field of Object.keys(totals)) totals[field] += result[field];
    if (result.deferred) break;
    if (!result.scanned) {
      complete = true;
      break;
    }
  }
  if (!complete) {
    const remaining = await client.rpc('review_pending', { actor, limit_count: 1 });
    if (remaining.error || !Array.isArray(remaining.data)) throw Error('Review queue unavailable');
    complete = remaining.data.length === 0;
  }
  console.log(
    JSON.stringify({
      ...totals,
      complete,
      mode: local ? 'local' : 'remote',
      preview: args.has('--preview'),
    }),
  );
  if (!complete) process.exitCode = 1;
}
