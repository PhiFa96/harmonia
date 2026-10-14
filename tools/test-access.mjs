// Local real JWT/Postgres/Edge only. No purchases or external messages.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import { accessSourceDetails, lessonEvent } from '../packages/content/src/index.ts';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
} from '../packages/exercises/src/index.ts';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
assert.ok(api.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(api.hostname));
const users = [],
  receipts = [];
let checks = 0;
const check = (a, b, label) => {
  assert.deepEqual(a, b, label);
  checks++;
};
const sql = (text) =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_harmonia',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
async function call(path, { method = 'GET', body, token, admin = false } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
async function user() {
  const email = 'energy-' + randomUUID() + '@example.invalid',
    password = randomUUID() + 'A!';
  const created = await call('/auth/v1/admin/users', {
    method: 'POST',
    admin: true,
    body: { email, password, email_confirm: true },
  });
  check(created.status, 200, 'Create local user');
  users.push(created.data.id);
  const signed = await call('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(signed.status, 200, 'Real JWT');
  return { id: created.data.id, token: signed.data.access_token };
}
try {
  const a = await user(),
    b = await user(),
    source = { kind: 'practice', set: 'reading', contentVersion: 1, seed: 'energy-test' },
    cost = accessSourceDetails(catalogue, source).cost;
  const reserve = (user, id, bodySource = source) =>
    call('/functions/v1/access', {
      method: 'POST',
      token: user.token,
      body: { id, source: bodySource },
    });
  const own = (user) => call('/functions/v1/access', { token: user.token });
  const publicPolicy = await call('/functions/v1/access?public=true');
  check(publicPolicy.status, 200, 'Public energy policy');
  check(publicPolicy.data.policy.model, 'energy', 'Chosen model');
  check(publicPolicy.data.policy.checkoutEnabled, false, 'Checkout closed by default');
  check(publicPolicy.data.policy.adsEnabled, false, 'No ads SDK');
  check((await own(a)).data.remaining, 30, 'Initial full energy');
  check((await call('/functions/v1/access')).status, 401, 'Guest cannot reserve server energy');
  const one = await Promise.all([reserve(a, 'a'), reserve(a, 'a')]);
  check(
    one.map((r) => r.status),
    [200, 200],
    'Concurrent same ID',
  );
  check((await own(a)).data.remaining, 30 - cost, 'Charged exactly once');
  check((await reserve(a, 'a', { ...source, seed: 'changed' })).status, 409, 'Cannot reuse source');
  check(
    (
      await call('/functions/v1/access', {
        method: 'POST',
        token: a.token,
        body: { id: 'forged', source, cost: 0, user_id: b.id },
      })
    ).status,
    400,
    'Client cost and owner rejected',
  );
  check((await own(b)).data.remaining, 30, 'Other account isolated');
  while ((await own(a)).data.remaining >= cost)
    check((await reserve(a, randomUUID())).status, 200, 'Canonical session funded');
  check((await reserve(a, 'blocked')).data.reason, 'limit', 'Whole session denied');
  sql(
    "update access_energy set balance=0,refilled_at=now()-interval '599 seconds' where user_id='" +
      a.id +
      "';",
  );
  check((await own(a)).data.remaining, 0, 'No early refill');
  sql(
    "update access_energy set refilled_at=now()-interval '1201 seconds' where user_id='" +
      a.id +
      "';",
  );
  check((await own(a)).data.remaining, 2, 'Two elapsed ticks');
  check((await own(a)).data.remaining, 2, 'Reading status never grants another tick');
  sql(
    'update access_energy set balance=' + cost + ",refilled_at=now() where user_id='" + a.id + "';",
  );
  const racing = await Promise.all([reserve(a, 'race-a'), reserve(a, 'race-b')]);
  check(
    racing.map((r) => r.status).sort(),
    [200, 403],
    'Concurrent different sessions cannot overspend',
  );
  check((await own(a)).data.remaining, 0, 'No negative balance');
  check((await reserve(a, 'a')).status, 200, 'Previously reserved run continues after exhaustion');
  check(
    (await call('/rest/v1/access_energy?select=*', { token: a.token })).status,
    403,
    'No direct balance reads',
  );
  check(
    (
      await call('/rest/v1/rpc/reserve_access', {
        method: 'POST',
        token: a.token,
        body: { actor: a.id, client_id: 'rpc-forged', source, cost: 1, level: 0 },
      })
    ).status,
    403,
    'Client cannot call trusted cost RPC',
  );
  const higher = {
    kind: 'lesson',
    lessonId: firstLesson.id,
    contentVersion: firstLesson.contentVersion,
    seed: 'higher',
  };
  // Synthetic higher level only in the trusted RPC, never in client request.
  const boundary = await call('/rest/v1/rpc/reserve_access', {
    admin: true,
    method: 'POST',
    body: { actor: b.id, client_id: 'higher', source: higher, cost: 10, level: 3 },
  });
  check(boundary.data.reason, 'premium', 'Level gate without spending');
  check((await own(b)).data.remaining, 30, 'Level denial is free');
  check(
    (
      await call('/rest/v1/entitlements', {
        admin: true,
        method: 'POST',
        body: {
          user_id: a.id,
          entitlement: 'premium',
          active: true,
          expires_at: '2099-01-01T00:00:00Z',
          store: 'manual',
        },
      })
    ).status,
    201,
    'Local manual entitlement',
  );
  check((await reserve(a, 'paid')).status, 200, 'Premium has no energy denial');
  check((await own(a)).data.remaining, null, 'Premium unlimited display');
  sql("update entitlements set expires_at=now()-interval '1 second' where user_id='" + a.id + "';");
  check((await own(a)).data.tier, 'free', 'Expiry applies immediately');
  check((await reserve(a, 'after-expiry')).status, 403, 'New free run blocked after expiry');
  let session = createLessonSession(firstLesson, 'legacy-energy');
  while (session.phase === 'initial') {
    const item = currentItem(activeLessonSession(session));
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  const event = lessonEvent('legacy-energy', session, 1000, 2000);
  const upload = () =>
    call('/functions/v1/learning-sync', {
      method: 'POST',
      token: b.token,
      body: { events: [event], since: 0 },
    });
  if (process.argv.includes('--published')) {
    check((await upload()).status, 422, 'Published backend rejects draft evidence');
    check((await reserve(b, 'draft', higher)).status, 409, 'Published access rejects draft lesson');
  } else {
    check((await upload()).status, 200, 'Legacy import charged despite old timestamp');
    check(
      (await own(b)).data.remaining,
      30 - firstLesson.exercises.length,
      'Canonical legacy cost',
    );
    check((await upload()).status, 200, 'Import replay idempotent');
    check(
      (await own(b)).data.remaining,
      30 - firstLesson.exercises.length,
      'No repeated import charge',
    );
  }
  const body = {
      name: 'Local Fixture',
      email: 'cancellation-' + randomUUID() + '@example.invalid',
      contract: 'fixture',
      tier: 'premium',
      kind: 'ordinary',
      reason: '',
      date: 'earliest',
      locale: 'de',
    },
    id = randomUUID();
  receipts.push(id);
  const cancel = (data) => call('/functions/v1/cancellation', { method: 'POST', body: data });
  const declaration = await cancel({ id, body });
  check(declaration.status, 200, 'Cancellation without login');
  check(declaration.data.status, 'received', 'Receipt never claims provider cancellation');
  check((await cancel({ id, body })).data, declaration.data, 'Stable cancellation receipt');
  check(
    (await cancel({ id, body: { ...body, name: 'Changed' } })).status,
    409,
    'Receipt body cannot mutate',
  );
  check(
    (await cancel({ id: randomUUID(), body: { ...body, kind: 'extraordinary' } })).status,
    400,
    'Extraordinary reason required',
  );
  check(
    (await call('/rest/v1/cancellation_requests?select=*', { token: a.token })).status,
    403,
    'No public PII reads',
  );
  for (let i = 0; i < 4; i++) {
    const next = randomUUID();
    receipts.push(next);
    check((await cancel({ id: next, body })).status, 200, 'Bounded declarations');
  }
  check((await cancel({ id: randomUUID(), body })).status, 429, 'Submission rate guarded');
  console.log(
    'Access/cancellation: ' + checks + ' real local API checks passed. No payment or email sent.',
  );
} finally {
  for (const id of receipts) sql("delete from cancellation_requests where id='" + id + "';");
  for (const id of users)
    check(
      (await call('/auth/v1/admin/users/' + id, { method: 'DELETE', admin: true })).status,
      200,
      'Local fixture cleanup',
    );
}
