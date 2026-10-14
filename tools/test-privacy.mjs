// Explicitly local real JWT/Postgres tests. Own temporary fixtures; no outside requests.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import {
  lessonEvent,
  validateLearningEvent,
  PRIVACY_EXPORT_SECTIONS,
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
assert.ok(api.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(api.hostname));
let checks = 0;
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
const users = [],
  auditIds = [],
  receipts = [];
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
  call('/functions/v1/privacy?view=' + view, {
    ...options,
    ...(user ? { token: user.token } : {}),
  });
const sync = (user, events = [], format = 2) =>
  call('/functions/v1/learning-sync', {
    method: 'POST',
    token: user.token,
    body: { events, since: 0, rewardFormat: 2, ...(format ? { rowFormat: format } : {}) },
  });
const consent = (user, purpose, granted, id = randomUUID()) =>
  privacy(user, 'consent', {
    method: 'POST',
    body: { id, purpose, granted, version: 'privacy-v1', locale: 'de' },
  });
try {
  const a = await user(),
    b = await user();
  check((await privacy(null, 'status')).status, 401, 'Own JWT required');
  check((await privacy(null, 'public')).data.policy.learningMonths, 12, 'Twelve months');
  check(
    (await privacy(a, 'status')).data.choices,
    { analytics: false, push: false, marketing: false },
    'No optional purpose by default',
  );
  check((await privacy(a, 'status')).data.recentSignIn, true, 'Recent own ceremony');
  check(
    (await consent(a, 'analytics', true)).status,
    422,
    'Inactive analytics rejects advance consent',
  );
  check(
    (await consent(a, 'marketing', true)).status,
    422,
    'Inactive marketing rejects advance consent',
  );
  const consentId = randomUUID();
  check((await consent(a, 'push', true, consentId)).status, 200, 'Purpose opt in');
  check((await consent(a, 'push', true, consentId)).status, 200, 'Consent retry is idempotent');
  check(
    (await consent(a, 'push', false, consentId)).status,
    409,
    'Reusing consent ID with opposite choice fails',
  );
  check(
    (await privacy(b, 'status')).data.choices.push,
    false,
    'Other account has no choice inherited',
  );
  // Seed only our own reminder registration. Withdrawal must remove all own tokens atomically.
  const deviceId = randomUUID();
  sql(
    `insert into reminder_devices(user_id,device_id,revoke_hash,push_token,revision,time_zone,locale) values(${lit(a.id)},${lit(deviceId)},repeat('a',64),'ExpoPushToken[private-test]',1,'Europe/Berlin','de');`,
  );
  check((await consent(a, 'push', false)).status, 200, 'Withdrawal');
  check(
    sql(
      `select count(*) from reminder_devices where user_id=${lit(a.id)} and push_token is not null;`,
    ),
    '0',
    'Tokens stopped on withdrawal',
  );
  // Real canonical lesson, then age our own server evidence by thirteen months.
  const raw = evidence(randomUUID());
  check((await sync(a, [raw])).status, 200, 'Raw source engine verified');
  check((await sync(b, [evidence(randomUUID())])).status, 200, 'Other account source');
  const reward = sql(
    `select amount from xp_ledger where user_id=${lit(a.id)} and client_id=${lit(raw.id)};`,
  );
  const held = randomUUID(),
    expired = randomUUID();
  receipts.push(held, expired);
  sql(`update learning_events set received_at=now()-interval '13 months' where user_id=${lit(a.id)}; update access_grants set created_at=now()-interval '13 months' where user_id=${lit(a.id)};
 insert into cancellation_requests(id,payload,received_at,hold_until,hold_reason) values(${lit(held)},jsonb_build_object('email',${lit(a.email)}),now()-interval '13 months',now()+interval '1 day','own test preservation'),(${lit(expired)},jsonb_build_object('email',${lit(a.email)}),now()-interval '13 months',null,null);`);
  check(
    (await call('/functions/v1/privacy-retention', { method: 'POST' })).status,
    401,
    'Retention requires service authentication',
  );
  const job = await call('/functions/v1/privacy-retention', {
    method: 'POST',
    admin: true,
    body: {},
  });
  check(job.status, 200, 'Service retention job');
  const compact = (await sync(a)).data.rows[0];
  check(compact.event.kind, 'retained', 'Server compacts raw evidence');
  check(
    validateLearningEvent(catalogue, compact.event).lesson.passed,
    true,
    'Verified unlocking retained',
  );
  for (const key of ['seed', 'initial', 'review', 'actions'])
    check(key in compact.event, false, 'Raw detail absent: ' + key);
  check(
    sql(`select amount from xp_ledger where user_id=${lit(a.id)} and client_id=${lit(raw.id)};`),
    reward,
    'XP ledger unchanged',
  );
  check((await sync(a, [raw])).status, 200, 'Original raw retry remains idempotent');
  check((await sync(a)).data.rows[0].event.kind, 'retained', 'Retry cannot restore answers');
  check(
    (await sync(a, [], null)).status,
    426,
    'Old client must upgrade before reading retained rows',
  );
  check((await sync(a, [compact.event])).status, 400, 'Client cannot upload claimed compact proof');
  check((await sync(b)).data.rows[0].event.kind, 'lesson', 'Recent other account unchanged');
  check(
    sql(`select count(*) from access_grants where user_id=${lit(a.id)} and source is not null;`),
    '0',
    'Access seeds removed',
  );
  check(
    sql(`select count(*) from cancellation_requests where id=${lit(held)};`),
    '1',
    'Specific hold preserved',
  );
  check(
    sql(`select count(*) from cancellation_requests where id=${lit(expired)};`),
    '0',
    'Expired request removed',
  );
  // Two bounded billing batches must advance rather than compact the same first hundred forever.
  const oldAudits = Array.from({ length: 101 }, () => 'privacy-old-' + randomUUID());
  auditIds.push(...oldAudits);
  sql(
    'insert into billing_events(event_id,payload,received_at,payload_hash) values ' +
      oldAudits
        .map(
          (id) =>
            '(' +
            lit(id) +
            ",jsonb_build_object('event',jsonb_build_object('id'," +
            lit(id) +
            ",'type','TEST','app_user_id'," +
            lit(a.id) +
            ")),now()-interval '13 months',repeat('c',64))",
        )
        .join(',') +
      ';',
  );
  for (let batch = 0; batch < 2; batch++)
    check(
      (await call('/functions/v1/privacy-retention', { method: 'POST', admin: true })).status,
      200,
      'Bounded audit batch',
    );
  check(
    sql(
      'select count(*) from billing_events where event_id in(' +
        oldAudits.map(lit).join(',') +
        ") and payload->>'retained'='true';",
    ),
    '101',
    'All audit batches advanced',
  );
  const oldConversation = randomUUID(),
    recentConversation = randomUUID(),
    oldRequest = randomUUID();
  sql(`insert into tutor_conversations(id,user_id,context,context_hash,created_at,updated_at) values(${lit(oldConversation)},${lit(a.id)},'{"locale":"de","noteNaming":"de","mode":"chat","hintLevel":null,"context":null}',repeat('d',64),now()-interval '13 months',now()-interval '13 months'),(${lit(recentConversation)},${lit(a.id)},'{"locale":"de","noteNaming":"de","mode":"explain","hintLevel":null,"context":{"answer":"old secret answer","source":{"seed":"old secret seed"}}}',repeat('e',64),now()-interval '13 months',now());
  insert into tutor_messages(conversation_id,role,content,created_at) values(${lit(recentConversation)},'user','{"text":"old text"}',now()-interval '13 months'),(${lit(recentConversation)},'user','{"text":"recent text"}',now());
  insert into tutor_requests(id,user_id,conversation_id,request_hash,user_text,reserved_cost,policy,lease_until,created_at) values(${lit(oldRequest)},${lit(a.id)},${lit(oldConversation)},repeat('f',64),'old pending secret',0,'{}',now()-interval '13 months',now()-interval '13 months');`);
  check(
    (await call('/functions/v1/privacy-retention', { method: 'POST', admin: true })).status,
    200,
    'Old tutor details cleaned',
  );
  check(
    sql(`select count(*) from tutor_conversations where id=${lit(oldConversation)};`),
    '0',
    'Inactive old dialog removed',
  );
  check(
    sql(`select count(*) from tutor_messages where conversation_id=${lit(recentConversation)};`),
    '1',
    'Recent message in continued old dialog retained',
  );
  check(
    sql(
      `select context->>'context' is null from tutor_conversations where id=${lit(recentConversation)};`,
    ),
    't',
    'Old task answer and seed removed',
  );
  check(
    sql(`select user_text from tutor_requests where id=${lit(oldRequest)};`),
    '',
    'Expired pending request text removed',
  );
  // Mixed transfer audit must export no foreign actors or subscriber attributes.
  const auditId = 'privacy-' + randomUUID(),
    payload = {
      event: {
        id: auditId,
        type: 'TRANSFER',
        app_user_id: a.id,
        aliases: [a.id, b.id],
        transferred_from: [b.id],
        subscriber_attributes: { $email: { value: b.email } },
      },
    };
  auditIds.push(auditId);
  check(
    (
      await call('/rest/v1/rpc/billing_receive', {
        method: 'POST',
        admin: true,
        body: { receipt: payload },
      })
    ).status,
    200,
    'Local billing receipt',
  );
  sql(
    `insert into privacy_consents(user_id,client_id,purpose,granted,version,locale) select ${lit(a.id)},gen_random_uuid(),'push',false,'privacy-v1','de' from generate_series(1,101);`,
  );
  const exported = {};
  for (const section of PRIVACY_EXPORT_SECTIONS) {
    exported[section] = [];
    let after = null;
    do {
      const page = await privacy(
        a,
        'export&section=' + section + (after ? '&after=' + encodeURIComponent(after) : ''),
      );
      check(page.status, 200, 'Export ' + section);
      exported[section].push(...page.data.rows);
      after = page.data.next;
    } while (after !== null);
  }
  check(exported.consents.length, 103, 'Paginated export includes all consent receipts');
  check(JSON.stringify(exported).includes(b.id), false, 'No other account ID in export');
  check(
    JSON.stringify(exported).includes(b.email),
    false,
    'No transfer recipient attributes exported',
  );
  for (const secret of [a.token, status.SERVICE_ROLE_KEY, 'ExpoPushToken[private-test]'])
    check(JSON.stringify(exported).includes(secret), false, 'No auth/provider tokens in export');
  check((await privacy(a, 'export&section=unknown')).status, 400, 'Section allowlist');
  const delId = randomUUID();
  receipts.push(delId);
  check(
    (await privacy(a, 'account', { method: 'DELETE', body: { id: delId, confirm: true } })).status,
    400,
    'Subscription acknowledgment required',
  );
  // Force only this fixture to have an old login; signed JWT remains otherwise valid.
  sql(`update auth.users set last_sign_in_at=now()-interval '1 hour' where id=${lit(a.id)};`);
  check(
    (
      await privacy(a, 'account', {
        method: 'DELETE',
        body: { id: delId, confirm: true, subscriptionsAcknowledged: true },
      })
    ).status,
    403,
    'Recent authentication required',
  );
  sql(`update auth.users set last_sign_in_at=now() where id=${lit(a.id)};`);
  const deleted = await privacy(a, 'account', {
    method: 'DELETE',
    body: { id: delId, confirm: true, subscriptionsAcknowledged: true },
  });
  check(deleted.status, 200, 'Own account erased');
  check(deleted.data.state, 'deleted', 'Supabase completion');
  check(deleted.data.externalPending, true, 'Unbound provider work is pending');
  check((await privacy(a, 'status')).status, 401, 'Deleted JWT no longer gives access');
  check(sql(`select count(*) from auth.users where id=${lit(a.id)};`), '0', 'Auth account deleted');
  for (const table of [
    'profiles',
    'learning_events',
    'xp_ledger',
    'access_energy',
    'access_grants',
    'privacy_consents',
    'reminder_devices',
  ])
    check(
      sql(
        `select count(*) from ${table} where ${table === 'profiles' ? 'id' : 'user_id'}=${lit(a.id)};`,
      ),
      '0',
      'Cascade ' + table,
    );
  check((await privacy(b, 'status')).status, 200, 'Other real account survives');
  const receipt = await privacy(null, 'receipt&id=' + delId);
  check(receipt.status, 200, 'Public unguessable receipt recovers response');
  check(JSON.stringify(receipt.data).includes(a.id), false, 'Receipt contains no actor');
  check(JSON.stringify(receipt.data).includes(a.email), false, 'Receipt contains no email');
  check(
    sql(
      `select payload::text like '%'||${lit(a.id)}||'%' from billing_events where event_id=${lit(auditId)};`,
    ),
    'f',
    'Deleted actor redacted from billing',
  );
  check(
    (
      await call('/rest/v1/rpc/billing_receive', {
        method: 'POST',
        admin: true,
        body: { receipt: payload },
      })
    ).status,
    200,
    'Original billing retry after erasure',
  );
  check(
    sql(
      `select payload::text like '%'||${lit(a.id)}||'%' from billing_events where event_id=${lit(auditId)};`,
    ),
    'f',
    'Retry cannot reintroduce actor',
  );
  const external = await call('/rest/v1/privacy_external_erasure?receipt_id=eq.' + delId, {
    admin: true,
  });
  check(external.data.length, 2, 'RevenueCat work explicitly queued');
  check(
    (
      await call('/rest/v1/rpc/complete_privacy_external_erasure', {
        method: 'POST',
        token: b.token,
        body: { job_id: external.data[0].id, final_state: 'completed', evidence: 'own-test-only' },
      })
    ).status,
    403,
    'Provider completion service only',
  );
  check(
    (
      await call('/rest/v1/rpc/complete_privacy_external_erasure', {
        method: 'POST',
        admin: true,
        body: { job_id: external.data[0].id, final_state: 'completed', evidence: '' },
      })
    ).status,
    400,
    'Completion requires evidence',
  );
  check(
    (
      await call('/rest/v1/rpc/complete_privacy_external_erasure', {
        method: 'POST',
        admin: true,
        body: {
          job_id: external.data[0].id,
          final_state: 'not_found',
          evidence: 'local-fixture-only-no-provider-call',
        },
      })
    ).status,
    200,
    'Simulated operator proof',
  );
  for (const item of external.data.slice(1))
    check(
      (
        await call('/rest/v1/rpc/complete_privacy_external_erasure', {
          method: 'POST',
          admin: true,
          body: {
            job_id: item.id,
            final_state: 'not_found',
            evidence: 'local-fixture-only-no-provider-call',
          },
        })
      ).status,
      200,
      'Second simulated provider proof',
    );
  check(
    (await privacy(null, 'receipt&id=' + delId)).data.externalPending,
    false,
    'Only proved provider completion clears pending',
  );
  check(
    sql(
      `select count(*) from privacy_external_erasure where receipt_id=${lit(delId)} and subject_reference is not null;`,
    ),
    '0',
    'Provider subject reference cleared',
  );
  sql(
    `update privacy_erasure_receipts set deleted_at=now()-interval '31 days' where id=${lit(delId)};`,
  );
  check(
    (await call('/functions/v1/privacy-retention', { method: 'POST', admin: true })).status,
    200,
    'Expired completed receipt cleanup',
  );
  check((await privacy(null, 'receipt&id=' + delId)).status, 404, 'Completed receipt expires');
  console.log('Privacy API: ' + checks + ' real local checks passed; no outside provider actions.');
} finally {
  for (const id of users)
    await call('/auth/v1/admin/users/' + id, { method: 'DELETE', admin: true });
  if (auditIds.length)
    sql('delete from billing_events where event_id in(' + auditIds.map(lit).join(',') + ');');
  if (receipts.length)
    sql(
      'delete from privacy_external_erasure where receipt_id in(' +
        receipts.map(lit).join(',') +
        ');delete from privacy_erasure_receipts where id in(' +
        receipts.map(lit).join(',') +
        ');delete from cancellation_requests where id in(' +
        receipts.map(lit).join(',') +
        ');',
    );
  if (users.length)
    sql(
      'delete from privacy_deleted_actors where actor_hash in(' +
        users.map((id) => 'encode(extensions.digest(' + lit(id) + ",'sha256'),'hex')").join(',') +
        ');',
    );
}
