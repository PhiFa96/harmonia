import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue } from '../packages/content/src/authoring.ts';
import {
  resolveLesson,
  lessonEvent,
  lessonDay,
  DEFAULT_REWARD_RULE,
} from '../packages/content/src/index.ts';
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
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Nur lokale API',
);
const users = [];
let ruleVersion;
async function request(path, { token, admin = false, method = 'POST', body } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: `Bearer ${token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
function proof(id, lessonId, finishedAt) {
  const content = resolveLesson(catalogue, lessonId);
  assert.ok(content);
  let session = createLessonSession(content, id);
  for (let guard = 0; session.phase === 'initial' && guard < 30; guard++) {
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    assert.ok(item);
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return lessonEvent(id, session, finishedAt - 60000, finishedAt, 'UTC');
}
const device = () => ({ deviceId: randomUUID(), deviceKey: randomUUID(), deviceRevision: 1 });
const preferences = {
  dailyGoal: 20,
  reminderConsent: false,
  reminderTime: '18:00',
  locale: 'de',
  timeZone: 'UTC',
};
const sync = (token, events) =>
  request('/functions/v1/learning-sync', { token, body: { since: 0, events, rewardFormat: 2 } });
const motivation = (token, d, extra = {}) =>
  request('/functions/v1/motivation', { token, body: { ...d, ...extra } });
try {
  for (let n = 0; n < 2; n++) {
    const email = `motivation-${randomUUID()}@example.invalid`,
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
  const [a, b] = users,
    install = device(),
    now = Date.now(),
    lessonId = catalogue.lessons[0].id;
  const events = Array.from({ length: 8 }, (_, n) =>
    proof(randomUUID(), lessonId, now - (7 - n) * 86400000 - 10000),
  );
  const uploaded = await sync(a.token, events);
  assert.equal(uploaded.status, 200);
  assert.equal(uploaded.data.rows[0].reward.coins, 3);
  assert.ok(uploaded.data.rows.slice(1).every((r) => r.reward.coins === 1));
  const one = await motivation(a.token, install, { preferences });
  assert.equal(one.status, 200);
  assert.equal(one.data.summary.coins, 10);
  assert.equal(one.data.summary.streak.current, 8);
  assert.equal(one.data.summary.streak.freezesAvailable, 1);
  const purchase = { id: randomUUID(), at: now, price: 10, ruleVersion: 1, timeZone: 'UTC' };
  const bought = await motivation(a.token, install, { purchases: [purchase] });
  assert.equal(bought.status, 200);
  assert.equal(bought.data.summary.coins, 0);
  assert.equal(bought.data.summary.streak.freezesAvailable, 2);
  assert.equal(
    (await motivation(a.token, install, { purchases: [purchase] })).status,
    200,
    'Kauf-Retry ist idempotent',
  );
  const concurrent = await Promise.all(
    Array.from({ length: 3 }, () => motivation(a.token, install, { purchases: [purchase] })),
  );
  assert.ok(concurrent.every((r) => r.status === 200));
  assert.equal(
    (await motivation(a.token, install, { purchases: [{ ...purchase, id: randomUUID() }] })).status,
    422,
    'Guthaben und Vorrat sind begrenzt',
  );
  assert.equal(
    (await motivation(a.token, install, { purchases: [{ ...purchase, price: 1 }] })).status,
    409,
    'Geänderte ID wird zurückgewiesen',
  );
  assert.equal(
    (await motivation(b.token, device(), { preferences })).data.summary.coins,
    0,
    'Kontotrennung',
  );
  assert.equal(
    (await motivation(status.ANON_KEY, device())).status,
    401,
    'Gast schreibt kein Konto',
  );
  assert.equal(
    (await motivation(a.token, install, { coins: 10000 })).status,
    400,
    'Client mintet keine Münzen',
  );
  const publicRules = await request('/rest/v1/reward_rules?select=rule', { method: 'GET' });
  assert.equal(publicRules.status, 200);
  assert.equal(
    (await request('/rest/v1/xp_ledger', { token: a.token, body: { coins: 1000 } })).status,
    403,
  );
  assert.equal(
    (await request('/rest/v1/freeze_purchases', { token: a.token, body: { user_id: a.id } }))
      .status,
    403,
  );
  assert.equal(
    (
      await request('/rest/v1/rpc/append_freeze_purchase', {
        token: a.token,
        body: { actor: a.id, entry: purchase, expected_revision: '0:0' },
      })
    ).status,
    403,
  );
  assert.equal(
    (await request('/rest/v1/freeze_purchases?select=*', { token: b.token, method: 'GET' })).data
      .length,
    0,
  );
  assert.equal(
    (await request('/functions/v1/reminder-dispatch', { token: a.token, body: {} })).status,
    401,
    'Nutzer können keinen Push-Job starten',
  );
  assert.equal(
    (await request('/functions/v1/reminder-dispatch', { admin: true, body: {} })).status,
    503,
    'Versand bleibt ohne bewusste Aktivierung aus',
  );
  const changedInstall = { ...install, deviceRevision: 2 };
  assert.equal((await motivation(b.token, changedInstall, { preferences })).status, 200);
  assert.equal(
    (await motivation(a.token, install)).status,
    409,
    'Verspätetes altes Geräteregister wird verweigert',
  );
  assert.equal(
    (
      await request('/functions/v1/motivation', {
        method: 'DELETE',
        body: { ...changedInstall, deviceRevision: 3 },
      })
    ).status,
    200,
    'Eigene Abschaltung funktioniert auch nach Logout',
  );
  const practiced = await motivation(
    b.token,
    { ...changedInstall, deviceRevision: 4 },
    { practicedAt: Date.now() },
  );
  assert.equal(
    practiced.data.summary.practiced,
    true,
    'Freies Üben unterdrückt Erinnerungen ohne XP',
  );
  assert.equal(practiced.data.summary.totalXP, 0);
  // Eine eigene zukünftige Regel prüft die Auswahl ohne andere lokale Nutzer rückwirkend zu ändern.
  ruleVersion = 1000000 + Math.floor(Math.random() * 1000000);
  const changed = {
    ...DEFAULT_REWARD_RULE,
    version: ruleVersion,
    effectiveAt: Date.now() + 240000,
    lesson: 20,
    repeat: 10,
    newCoins: 5,
    repeatCoins: 2,
    freezePrice: 15,
  };
  assert.equal(
    (
      await request('/rest/v1/reward_rules', {
        admin: true,
        body: { version: ruleVersion, effective_at: changed.effectiveAt, rule: changed },
      })
    ).status,
    201,
  );
  const event = proof(randomUUID(), lessonId, changed.effectiveAt + 1000),
    newRule = await sync(b.token, [event]);
  assert.equal(newRule.status, 200);
  assert.equal(newRule.data.rows[0].reward.amount, 28);
  assert.equal(newRule.data.rows[0].reward.coins, 5);
  assert.equal(newRule.data.rows[0].reward.ruleVersion, ruleVersion);
  assert.equal(
    (await request('/rest/v1/reward_rules', { token: a.token, body: { version: 99 } })).status,
    403,
  );
  assert.equal(
    (await sync(a.token, [events[0]])).data.rows[0].reward.ruleVersion,
    1,
    'Alte Buchungen bleiben unverändert',
  );
  const goalDevice = device();
  const configuredGoal = await motivation(a.token, goalDevice, {
    preferences: { ...preferences, dailyGoal: 50 },
  });
  assert.equal(configuredGoal.data.preferences.dailyGoal, 50);
  const nextDevice = await motivation(a.token, device(), {
    preferences,
    initializePreferences: true,
  });
  assert.equal(
    nextDevice.data.preferences.dailyGoal,
    50,
    'Ein neues Gerät übernimmt das Kontoziel',
  );
  assert.equal(
    (await motivation(a.token, goalDevice, { preferences })).data.preferences.dailyGoal,
    20,
    'Eine ausdrückliche Änderung bleibt möglich',
  );
  assert.equal(lessonDay(now, 'UTC'), one.data.summary.today);
  console.log(
    'Motivation: acht echte Nachweise, 10 Münzen, kostenloser/gekaufter Schutz, parallele Retries, dynamische Regeln, Konto-/Gerätewechsel, Gast-Abschaltung und Push-Zugriffsschutz geprüft.',
  );
} finally {
  for (const user of users)
    assert.equal(
      (await request(`/auth/v1/admin/users/${user.id}`, { admin: true, method: 'DELETE' })).status,
      200,
    );
  if (ruleVersion)
    execFileSync(
      'docker',
      [
        '--host=unix:///var/run/docker.sock',
        'exec',
        'supabase_db_harmonia',
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `DELETE FROM public.reward_rules WHERE version=${ruleVersion}`,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DOCKER_CONTEXT: '' } },
    );
}
