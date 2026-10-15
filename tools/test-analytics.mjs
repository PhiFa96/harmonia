// Own local fixtures only. Consent/policy changes are restored in finally. No external provider.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { renderDashboard } from './analytics-dashboard.mjs';
import { firstLesson } from '../packages/content/src/authoring.ts';
import { lessonEvent } from '../packages/content/src/index.ts';
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
assert.ok(api.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(api.hostname));
let checks = 0;
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
const users = [];
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
      '-Atq',
    ],
    { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim();
const lit = (value) => "'" + String(value).replaceAll("'", "''") + "'";
async function call(path, { method = 'GET', body, token, admin = false } = {}) {
  const res = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}
async function user() {
  const email = 'privacy-' + randomUUID() + '@example.invalid',
    password = randomUUID() + 'A!';
  const created = await call('/auth/v1/admin/users', {
    method: 'POST',
    admin: true,
    body: { email, password, email_confirm: true },
  });
  check(created.status, 200, 'Local account');
  users.push(created.data.id);
  const auth = await call('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(auth.status, 200, 'Real authentication');
  return { id: created.data.id, email, token: auth.data.access_token };
}
function evidence(id) {
  let session = createLessonSession(firstLesson, 'privacy-api');
  while (session.phase === 'initial') {
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (!item) throw new Error('Missing item');
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return lessonEvent(id, session, Date.now() - 20000, Date.now() - 10000, 'Europe/Berlin');
}
const privacy = (user, view, options = {}) =>
  call('/functions/v1/privacy?view=' + view, { ...options, token: user?.token });
const grant = (user, granted, id = randomUUID(), version = 'analytics-supabase-v1') =>
  privacy(user, 'consent', {
    method: 'POST',
    body: { id, purpose: 'analytics', granted, version, locale: 'de' },
  });
const send = (user, consentId, event = { name: 'app_active' }, extra = {}) =>
  call('/functions/v1/analytics', {
    method: 'POST',
    token: user?.token,
    body: {
      id: randomUUID(),
      version: 1,
      consentId,
      platform: 'web',
      locale: 'de',
      event,
      ...extra,
    },
  });
const count = (actor) =>
  Number(sql(`select count(*) from analytics_events where user_id=${lit(actor)};`));
const savedPolicy = sql('select policy::text from privacy_policy where id;');
const billingIds = [];
try {
  const a = await user(),
    b = await user(),
    consent = randomUUID();
  check((await send(null, consent)).status, 401, 'JWT required');
  check((await send(a, consent)).status, 403, 'Default off');
  check(count(a.id), 0, 'Nothing retained before consent');
  check((await grant(a, true)).status, 422, 'Legal and feature gate closed');
  sql(
    `update privacy_policy set policy=policy||'{"analyticsEnabled":true,"legalPublished":true}' where id;`,
  );
  check(
    (await grant(a, true, randomUUID(), 'privacy-v1')).status,
    422,
    'Legacy consent cannot enable new purpose',
  );
  check((await grant(a, true, consent)).status, 200, 'Informed explicit consent');
  check((await grant(a, true, consent)).status, 200, 'Idempotent consent retry');
  check((await privacy(a, 'status')).data.analyticsConsentId, consent, 'Own grant epoch');
  check((await send(a, consent)).status, 200, 'Consented active day');
  check((await send(a, consent)).status, 200, 'Repeated active day');
  check(count(a.id), 1, 'One activity per UTC day');
  check((await send(b, consent)).status, 403, 'Cannot borrow A consent');
  check((await send(a, randomUUID())).status, 403, 'Stale/wrong consent');
  check(
    (await send(a, consent, { name: 'purchase_completed' })).status,
    400,
    'No client purchase authority',
  );
  for (const key of ['userId', 'email', 'answer', 'prompt', 'url', 'deviceId', 'occurredAt']) {
    check(
      (await send(a, consent, { name: 'app_active' }, { [key]: 'private' })).status,
      400,
      'Envelope rejects ' + key,
    );
    check(
      (await send(a, consent, { name: 'app_active', [key]: 'private' })).status,
      400,
      'Event rejects ' + key,
    );
  }
  check(
    (
      await send(a, consent, {
        name: 'lesson_started',
        lessonId: 'unknown.lesson',
        contentVersion: 1,
        attemptId: randomUUID(),
      })
    ).status,
    422,
    'Unknown source rejected',
  );
  const event = evidence(randomUUID());
  // Evidence was completed before this fixture consent; make a new canonical timestamp now.
  event.startedAt = Date.now() - 5;
  event.finishedAt = Date.now();
  const start = {
    name: 'lesson_started',
    lessonId: event.lessonId,
    contentVersion: event.contentVersion,
    attemptId: event.id,
  };
  check((await send(a, consent, start)).status, 200, 'Observed lesson start');
  check((await send(a, consent, start)).status, 200, 'Repeated/resumed start');
  const sync = () =>
    call('/functions/v1/learning-sync', {
      method: 'POST',
      token: a.token,
      body: { events: [event], since: 0, rewardFormat: 2, rowFormat: 2 },
    });
  check((await sync()).status, 200, 'Engine verified finish');
  check((await sync()).status, 200, 'Verified finish replay');
  check(
    sql(
      `select count(*) from analytics_events where user_id=${lit(a.id)} and name='lesson_completed';`,
    ),
    '1',
    'Server completion exactly once',
  );
  check(
    sql(
      `select properties->>'passed' from analytics_events where user_id=${lit(a.id)} and name='lesson_completed';`,
    ),
    'true',
    'Canonical pass',
  );
  const exported = await privacy(a, 'export&section=analyticsEvents');
  check(exported.status, 200, 'Own export');
  check(exported.data.rows.length, 3, 'Activity, start and verified completion');
  check(
    (await privacy(b, 'export&section=analyticsEvents')).data.rows.length,
    0,
    'Foreign export empty',
  );
  check(
    (await call('/rest/v1/analytics_events?select=*', { token: b.token })).data.length,
    0,
    'Foreign RLS empty',
  );
  check(
    (
      await call('/rest/v1/analytics_events', {
        method: 'POST',
        token: a.token,
        body: { user_id: a.id, name: 'app_active', dedupe_key: 'forged', properties: {} },
      })
    ).status,
    403,
    'Client writes denied',
  );
  check(
    (
      await call('/rest/v1/rpc/analytics_dashboard', {
        method: 'POST',
        token: a.token,
        body: { first_day: '2001-01-01', last_day: '2001-02-01' },
      })
    ).status,
    403,
    'Private operator dashboard',
  );
  const conversation = randomUUID(),
    request = randomUUID();
  sql(
    `insert into tutor_conversations(id,user_id,context,context_hash) values(${lit(conversation)},${lit(a.id)},'{}',repeat('a',64)); insert into tutor_requests(id,user_id,conversation_id,request_hash,user_text,reserved_cost,policy) values(${lit(request)},${lit(a.id)},${lit(conversation)},repeat('b',64),'private tutor text',100,'{}'); update tutor_requests set state='cancelled',cost=50,usage='{"estimated":true}' where id=${lit(request)};`,
  );
  check(
    sql(
      `select count(*) from analytics_events where user_id=${lit(a.id)} and name='tutor_question_asked';`,
    ),
    '1',
    'Accepted server tutor request',
  );
  check(
    sql(
      `select properties->>'costNanoUsd' from analytics_events where user_id=${lit(a.id)} and name='tutor_request_finished';`,
    ),
    '50',
    'Cancelled consumption still costs',
  );
  check(
    sql(
      `select count(*) from analytics_events where user_id=${lit(a.id)} and properties::text like '%private%';`,
    ),
    '0',
    'Tutor text never copied',
  );
  sql(
    `insert into entitlements(user_id,entitlement,active,expires_at,store) values(${lit(a.id)},'premium',true,now()+interval '1 month','web');`,
  );
  function purchase(environment, period, type = 'INITIAL_PURCHASE', conversion = false) {
    const id = 'analytics-fixture-' + randomUUID();
    billingIds.push(id);
    const payload = {
      api_version: '1.0',
      event: {
        id,
        type,
        app_user_id: a.id,
        environment,
        period_type: period,
        is_trial_conversion: conversion,
        event_timestamp_ms: Date.now(),
      },
    };
    sql(
      `select billing_receive(${lit(JSON.stringify(payload))}::jsonb); update billing_events set processed_at=now(),outcome='processed' where event_id=${lit(id)};`,
    );
  }
  purchase('SANDBOX', 'NORMAL');
  purchase('PRODUCTION', 'TRIAL');
  purchase('PRODUCTION', 'NORMAL', 'RENEWAL');
  check(
    sql(
      `select count(*) from analytics_events where user_id=${lit(a.id)} and name='purchase_completed';`,
    ),
    '0',
    'No sandbox, trial start or ordinary renewal conversion',
  );
  purchase('PRODUCTION', 'NORMAL');
  check(
    sql(
      `select count(*) from analytics_events where user_id=${lit(a.id)} and name='purchase_completed';`,
    ),
    '1',
    'Verified production paid purchase',
  );
  sql(
    "alter table analytics_events add constraint analytics_fixture_failure check(name<>'tutor_question_asked') not valid;",
  );
  try {
    const failedAnalytics = randomUUID();
    sql(
      `insert into tutor_requests(id,user_id,request_hash,user_text,reserved_cost,policy) values(${lit(failedAnalytics)},${lit(a.id)},repeat('c',64),'local fixture',0,'{}');`,
    );
    check(
      sql(`select count(*) from tutor_requests where id=${lit(failedAnalytics)};`),
      '1',
      'Optional analytics failure cannot block tutor',
    );
  } finally {
    sql('alter table analytics_events drop constraint if exists analytics_fixture_failure;');
  }
  // Deterministic historic sample, all synthetic and removed below. Two mature consenting accounts.
  const bConsent = randomUUID();
  check((await grant(b, true, bConsent)).status, 200, 'Second independent participant');
  sql(
    `update analytics_participants set enrolled_at='2001-01-01T12:00:00Z' where user_id in (${lit(a.id)},${lit(b.id)});update analytics_events set occurred_at='2001-01-02T12:00:00Z' where user_id=${lit(a.id)};insert into analytics_events(user_id,dedupe_key,name,properties,occurred_at) values(${lit(a.id)},'fixture-day7','app_active','{}','2001-01-08T12:00:00Z'),(${lit(b.id)},'fixture-open-start','lesson_started',${lit(JSON.stringify({ ...start, attemptId: randomUUID() }))}::jsonb-'name','2001-01-03T12:00:00Z');`,
  );
  const dashboard = (asOf) =>
    JSON.parse(sql(`select analytics_dashboard('2001-01-01','2001-02-01',${lit(asOf)})::text;`));
  const mature = dashboard('2001-02-02');
  check(mature.participants, 2, 'Cohort size');
  check(
    mature.activation,
    { eligible: 2, converted: 1 },
    'Seven day activation numerator and denominator',
  );
  check(
    mature.retention,
    [
      { n: 1, eligible: 2, returned: 1 },
      { n: 7, eligible: 2, returned: 1 },
      { n: 30, eligible: 2, returned: 0 },
    ],
    'Exact UTC day retention with mature denominator',
  );
  check(mature.premiumConversion, { eligible: 2, converted: 1 }, 'Paid thirty day conversion');
  check(
    mature.lessons.map((row) => [row.started, row.completed, row.passed]),
    [[2, 1, 1]],
    'Open attempt remains in completion denominator',
  );
  check(Number(mature.aiCosts.nano_usd), 50, 'Integer nano USD');
  check(mature.aiCosts.estimated, 1, 'Estimated cost visibly counted');
  check(dashboard('2001-01-08').retention[1].eligible, 0, 'Day seven still open excluded');
  check(dashboard('2001-01-08').premiumConversion.eligible, 0, 'Immature payment cohort excluded');
  for (const id of users)
    check(JSON.stringify(mature).includes(id), false, 'Aggregates have no account IDs');
  const html = renderDashboard(mature, { fixture: true });
  check(html.includes('50.0 %'), true, 'Dashboard displays meaningful ratios');
  check(html.includes('private tutor text'), false, 'No private text in report');
  if (process.env.HARMONIA_ANALYTICS_FIXTURE_REPORT)
    writeFileSync(process.env.HARMONIA_ANALYTICS_FIXTURE_REPORT, html, { mode: 0o600 });
  const empty = renderDashboard({ ...mature, activation: { eligible: 0, converted: 0 } });
  check(empty.includes('NaN'), false, 'Empty denominator not NaN');
  check(
    renderDashboard({
      ...mature,
      lessons: [{ ...mature.lessons[0], lesson: '<script>alert(1)</script>' }],
    }).includes('<script>'),
    false,
    'Output escapes labels',
  );
  // Concurrent withdrawal removes any request that won the race; later ingestion fails.
  await Promise.all([
    send(a, consent, { name: 'paywall_viewed', reason: 'settings' }),
    grant(a, false),
  ]);
  check(count(a.id), 0, 'Withdrawal purges all own analytics');
  check((await send(a, consent)).status, 403, 'Late old request rejected');
  const again = randomUUID();
  check((await grant(a, true, again)).status, 200, 'Fresh separate grant');
  check((await send(a, consent)).status, 403, 'Old epoch cannot replay after reconsent');
  check((await send(a, again)).status, 200, 'Fresh grant works');
  sql(
    `update analytics_participants set enrolled_at=now()-interval '13 months' where user_id=${lit(a.id)};`,
  );
  check((await send(a, again)).status, 403, 'Expired observation stops without cron');
  sql('select analytics_retention();');
  check(count(a.id), 0, 'Twelve month cohort retention cascades');
  check(
    sql(`select count(*) from analytics_participants where user_id=${lit(a.id)};`),
    '0',
    'No persistent tracking identity after expiry',
  );
  await call('/auth/v1/admin/users/' + b.id, { method: 'DELETE', admin: true });
  check(count(b.id), 0, 'Own account deletion cascades');
  console.log(
    `Analytics: ${checks} checks passed; own JWT fixtures, canonical completion, synthetic server costs/purchase, exact cohorts, withdrawal, retention and erasure. No outside collection.`,
  );
} finally {
  for (const id of users)
    await call('/auth/v1/admin/users/' + id, { method: 'DELETE', admin: true });
  for (const id of billingIds) sql(`delete from billing_events where event_id=${lit(id)};`);
  sql(`update privacy_policy set policy=${lit(savedPolicy)}::jsonb where id;`);
}
