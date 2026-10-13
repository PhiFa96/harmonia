// Lokale Integration mit zwei echten Konten; keine Remote-Projekte oder Nutzerdaten.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue } from '../packages/content/src/authoring.ts';
import { lessonPlan, placementBank, resolveReportSource } from '../packages/content/src/index.ts';
import {
  createPlacement,
  currentPlacementTask,
  expectedAnswer,
  PRACTICE_SETS,
} from '../packages/exercises/src/index.ts';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Nur lokale API',
);
const users = [],
  published = process.argv.includes('--published');
async function request(path, { token, admin = false, method = 'POST', body } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: `Bearer ${token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
const submit = (token, reports) =>
  request('/functions/v1/content-reports', { token, body: { reports } });
const report = (source) => ({
  id: randomUUID(),
  createdAt: Date.now(),
  locale: 'de',
  category: 'feedback',
  message: 'Eigene lokale Testmeldung',
  source,
  answer: expectedAnswer(resolveReportSource(catalogue, source).item),
  hintLevel: 2,
  checked: true,
});
try {
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try {
      if ((await request('/functions/v1/content-reports', { method: 'OPTIONS' })).status === 204) {
        ready = true;
        break;
      }
    } catch {
      /* Worker startet. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Lokale Funktionen zuerst starten');
  for (let n = 0; n < 2; n++) {
    const email = `report-${randomUUID()}@example.invalid`,
      password = randomUUID() + randomUUID();
    const created = await request('/auth/v1/admin/users', {
      admin: true,
      body: { email, password, email_confirm: true },
    });
    assert.equal(created.status, 200);
    users.push({ id: created.data.id });
    const signed = await request('/auth/v1/token?grant_type=password', {
      body: { email, password },
    });
    assert.equal(signed.status, 200);
    users.at(-1).token = signed.data.access_token;
  }
  const [a, b] = users;
  assert.equal((await submit('invalid', [])).status, 401);
  assert.equal((await submit(status.ANON_KEY, [])).status, 401);
  assert.equal(
    (await request('/functions/v1/content-reports', { token: a.token, method: 'GET' })).status,
    405,
  );
  const free = PRACTICE_SETS.map((set) =>
    report({ kind: 'practice', set, seed: 'real-report', index: 0, contentVersion: 1 }),
  );
  assert.deepEqual((await submit(a.token, free)).data, {
    accepted: free.map((r) => r.id),
    unavailable: [],
  });
  assert.equal((await submit(a.token, [free[0], free[0]])).status, 400);
  assert.equal((await submit(a.token, [{ ...free[0], user_id: b.id }])).status, 400);
  assert.equal((await submit(a.token, [{ ...free[0], status: 'resolved' }])).status, 400);
  assert.equal((await submit(a.token, [{ ...free[0], message: 'x'.repeat(2001) }])).status, 400);
  const retries = await Promise.all(Array.from({ length: 3 }, () => submit(a.token, [free[0]])));
  assert.ok(retries.every((r) => r.status === 200));
  let own = await request('/rest/v1/content_reports?select=*', { token: a.token, method: 'GET' });
  assert.equal(own.status, 200);
  assert.equal(own.data.length, free.length);
  assert.ok(
    own.data.every((r) => r.user_id === a.id && r.status === 'new' && r.context.evaluation.correct),
  );
  assert.deepEqual(
    (await request('/rest/v1/content_reports?select=*', { token: b.token, method: 'GET' })).data,
    [],
  );
  assert.deepEqual((await submit(b.token, [free[0]])).data.accepted, [free[0].id]);
  assert.equal(
    (await request('/rest/v1/content_reports?select=*', { token: b.token, method: 'GET' })).data
      .length,
    1,
  );
  const fresh = { ...free[0], id: randomUUID() };
  assert.equal(
    (await submit(a.token, [fresh, { ...free[0], message: 'Conflicting ID' }])).status,
    409,
  );
  assert.equal(
    (await request('/rest/v1/content_reports?select=id', { token: a.token, method: 'GET' })).data
      .length,
    free.length,
  );
  const plan = lessonPlan(catalogue, 'notation.l1.staff.positions');
  assert.ok(plan);
  const lessons = ['initial', 'review'].map((round) =>
    report({
      kind: 'lesson',
      lessonId: plan.id,
      contentVersion: plan.contentVersion,
      planKey: plan.planKey,
      seed: 'report-review',
      index: 0,
      round,
    }),
  );
  const bank = placementBank(catalogue),
    placement = createPlacement(bank, 'report-placement');
  assert.ok(currentPlacementTask(placement));
  lessons.push(report({ kind: 'placement', bankKey: bank.key, seed: placement.seed, actions: [] }));
  const mixed = await submit(a.token, [...lessons, fresh]);
  assert.equal(mixed.status, 200);
  assert.deepEqual(
    mixed.data,
    published
      ? { accepted: [fresh.id], unavailable: lessons.map((r) => r.id) }
      : { accepted: [...lessons, fresh].map((r) => r.id), unavailable: [] },
  );
  const unavailable = {
    ...free[0],
    id: randomUUID(),
    source: { ...lessons[0].source, contentVersion: 99999 },
  };
  assert.deepEqual((await submit(a.token, [unavailable])).data, {
    accepted: [],
    unavailable: [unavailable.id],
  });
  assert.equal(
    (await request('/rest/v1/content_reports', { token: a.token, body: { user_id: a.id } })).status,
    403,
  );
  assert.equal(
    (
      await request(`/rest/v1/content_reports?client_id=eq.${free[0].id}`, {
        token: a.token,
        method: 'PATCH',
        body: { status: 'resolved' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request('/rest/v1/rpc/append_content_reports', {
        token: a.token,
        body: { actor: a.id, entries: [] },
      })
    ).status,
    403,
  );
  own = await request('/rest/v1/xp_ledger?select=*', { token: a.token, method: 'GET' });
  assert.equal(own.data.length, 0, 'Meldungen erzeugen keine XP');
  console.log(
    `Inhaltsmeldungen: ${published ? 'öffentlicher' : 'lokaler Vorschau'}-Modus, sieben freie Quellen, Lektion/Wiederholung/Einstufung, Idempotenz, Konflikte, RLS und zwei Konten geprüft.`,
  );
} finally {
  for (const user of users) {
    const removed = await request(`/auth/v1/admin/users/${user.id}`, {
      admin: true,
      method: 'DELETE',
    });
    assert.equal(removed.status, 200, 'Eigenes Testkonto entfernen');
  }
}
