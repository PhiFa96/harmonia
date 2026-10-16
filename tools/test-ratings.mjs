// Actual local JWT/Engine/Postgres integration; all test accounts and model fixtures are cleaned up.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import {
  learningRatingEvidence,
  lessonEvent,
  lessonPlan,
  adaptiveLessonPlan,
  weaknessPlan,
  localLearningRatings,
  ratingPlacementBank,
  retainLearningEvent,
} from '../packages/content/src/index.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  ratePeriod,
  revealLessonHint,
  createPlacement,
  actPlacement,
  currentPlacementTask,
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
  'Local backend only',
);
const users = [];
let checks = 0,
  original = null,
  bucketIds = [];
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
async function request(path, { token, admin = false, method = 'GET', body } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
const rpc = (name, body) => request('/rest/v1/rpc/' + name, { admin: true, method: 'POST', body });
async function account() {
  const password = randomUUID() + 'Aa!42';
  const email = 'rating-' + randomUUID() + '@example.invalid';
  const made = await request('/auth/v1/admin/users', {
    admin: true,
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  check(made.status, 200, 'Create own local test user');
  users.push(made.data.id);
  const login = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(login.status, 200, 'Sign in locally');
  check(
    (
      await request('/rest/v1/entitlements', {
        admin: true,
        method: 'POST',
        body: {
          user_id: made.data.id,
          entitlement: 'premium',
          active: true,
          expires_at: '2099-01-01T00:00:00Z',
          store: 'manual',
        },
      })
    ).status,
    201,
    'Local quota fixture',
  );
  return { id: made.data.id, token: login.data.access_token };
}
function event(id, assisted = false) {
  let session = createLessonSession(firstLesson, id);
  for (const item of session.initial.items) {
    if (assisted) session = revealLessonHint(session);
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return lessonEvent(id, session, 1000, 2000);
}
const sync = (user, events = [], rowFormat = 2) =>
  request('/functions/v1/learning-sync', {
    token: user.token,
    method: 'POST',
    body: { rowFormat, rewardFormat: 2, since: 0, events },
  });
const skills = (user) => request('/rest/v1/skill_progress?order=skill_id', { token: user.token });
const snapshot = (actor) => rpc('rating_snapshot', { actor, bucket_ids: bucketIds });
const source = (user, id) =>
  request('/rest/v1/learning_events?user_id=eq.' + user.id + '&client_id=eq.' + id, {
    admin: true,
  });
try {
  const a = await account(),
    b = await account();
  const first = event('rating-api-first');
  const completePlan = (plan, id) => {
    let state = createLessonSession(plan, id);
    for (const item of state.initial.items)
      state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
    return lessonEvent(id, state, 1000, 2000, 'UTC');
  };
  const anchor = lessonPlan(catalogue, 'notation.l1.staff.anchor');
  const localRatings = localLearningRatings(catalogue, [
    completePlan(anchor, 'selection-prior'),
    completePlan(lessonPlan(catalogue, 'notation.l1.staff.positions'), 'positions-prior'),
  ]);
  const adaptive = completePlan(
    adaptiveLessonPlan(catalogue, 'notation.l1.staff.positions', localRatings, 2000),
    'adaptive-api-lesson',
  );
  const weak = completePlan(
    weaknessPlan(catalogue, localRatings, ['notation.l1.staff.anchor'], 2000),
    'adaptive-api-weakness',
  );
  const bank = ratingPlacementBank(catalogue);
  let diagnostic = createPlacement(bank, 'adaptive-api-placement');
  const actions = [];
  while (!diagnostic.ended) {
    const item = currentPlacementTask(diagnostic).session.items[0];
    for (const action of [{ type: 'answer', answer: expectedAnswer(item) }, { type: 'next' }]) {
      actions.push(action);
      diagnostic = actPlacement(bank, diagnostic, action);
    }
  }
  const placement = {
    kind: 'placement',
    id: 'adaptive-api-placement',
    bankKey: bank.key,
    seed: diagnostic.seed,
    startedAt: 1000,
    finishedAt: 2000,
    actions,
  };
  const adaptiveEvents = [adaptive, weak, placement];
  const evidence = learningRatingEvidence(catalogue, first);
  bucketIds = [
    ...new Set(
      [first, ...adaptiveEvents].flatMap((event) =>
        learningRatingEvidence(catalogue, event).observations.map((item) => item.bucketId),
      ),
    ),
  ];
  original = (await snapshot(a.id)).data;
  const before = original;
  check((await sync(a, [first])).status, 200, 'Verified lesson synchronizes');
  const received = (await source(a, first.id)).data[0];
  check(received.rating_outcome, 'rated', 'Sync updates ratings');
  const expected = ratePeriod(
    before,
    evidence.observations,
    Date.parse(received.received_at),
    before.tau,
  );
  const after = (await skills(a)).data;
  check(after.length, Object.keys(expected.skills).length, 'Correct authored skills');
  for (const row of after) {
    check(row.attempts, expected.skills[row.skill_id].attempts, 'Original question counts');
    assert.ok(Math.abs(row.rating - expected.skills[row.skill_id].rating) < 1e-8);
    checks++;
  }
  const stable = (await snapshot(a.id)).data;
  for (const response of await Promise.all(Array.from({ length: 6 }, () => sync(a, [first]))))
    check(response.status, 200, 'Concurrent retry is acknowledged');
  check((await skills(a)).data, after, 'Duplicate IDs cannot change ratings');
  check(
    (await snapshot(a.id)).data.revision,
    stable.revision,
    'Duplicate IDs do not advance rating revision',
  );
  check((await skills(b)).data, [], 'Second account cannot read first account ratings');
  check(
    (await request('/rest/v1/skill_progress?user_id=eq.' + a.id, { token: b.token })).data,
    [],
    'Explicit foreign owner filter cannot bypass RLS',
  );
  check(
    (
      await request('/rest/v1/rpc/rating_snapshot', {
        token: a.token,
        method: 'POST',
        body: { actor: b.id, bucket_ids: [] },
      })
    ).status,
    403,
    'Client cannot invoke snapshot service RPC',
  );
  check(
    (
      await request('/rest/v1/rpc/commit_rating_period', {
        token: a.token,
        method: 'POST',
        body: {
          actor: a.id,
          client_id: first.id,
          expected_hash: received.event_hash,
          expected_revision: stable.revision,
          updates: { skills: {}, buckets: {} },
          outcome: 'no_evidence',
        },
      })
    ).status,
    403,
    'Client cannot forge a projection',
  );
  const malformed = {
    ...first,
    id: 'rating-api-forged',
    initial: {
      ...first.initial,
      answers: first.initial.answers.map((answer, index) =>
        index ? answer : { ...answer, answer: 'not-a-valid-response' },
      ),
    },
  };
  check((await sync(a, [malformed])).status, 422, 'Invalid source remains rejected by Engine');
  check((await skills(a)).data, after, 'Invalid evidence cannot change ratings');
  const legacy = event('rating-api-legacy'),
    assisted = event('rating-api-assisted', true);
  const xpBefore = (await request('/rest/v1/xp_ledger?user_id=eq.' + a.id, { admin: true })).data;
  check(
    (await rpc('append_learning_events', { actor: a.id, events: [legacy, assisted] })).status,
    204,
    'Insert canonical historical fixture',
  );
  const runBackfill = () =>
    JSON.parse(
      execFileSync(
        process.execPath,
        ['tools/ratings-backfill.mjs', '--local', '--preview', '--actor', a.id],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      ),
    );
  const backfilled = runBackfill();
  check(backfilled.complete, true, 'Backfill completes');
  check(backfilled.rated, 1, 'Backfill rates the independent historical lesson');
  check(backfilled.excluded, 1, 'Backfill excludes assisted evidence');
  check(
    (await source(a, assisted.id)).data[0].rating_outcome,
    'no_evidence',
    'Assisted lesson has explicit exclusion receipt',
  );
  check(runBackfill().applied, 0, 'Repeated backfill does not rate twice');
  check(
    (await request('/rest/v1/xp_ledger?user_id=eq.' + a.id, { admin: true })).data,
    xpBefore,
    'Backfill never changes XP',
  );
  const retained = event('rating-api-retained');
  check(
    (await rpc('append_learning_events', { actor: a.id, events: [retained] })).status,
    204,
    'Create own retention fixture',
  );
  check(
    (
      await request(
        '/rest/v1/learning_events?user_id=eq.' + a.id + '&client_id=eq.' + retained.id,
        { admin: true, method: 'PATCH', body: { received_at: '2020-01-01T00:00:00Z' } },
      )
    ).status,
    204,
    'Age own fixture only',
  );
  const old = (await source(a, retained.id)).data[0];
  check(
    (
      await rpc('retain_learning_event', {
        actor: a.id,
        client_id: retained.id,
        expected_hash: old.event_hash,
        summary: { kind: 'retained', sourceKind: 'unavailable', id: retained.id, finishedAt: 2000 },
      })
    ).data,
    true,
    'Run actual retention',
  );
  const priorRatings = (await skills(a)).data;
  check(runBackfill().excluded, 1, 'Retained raw answers cannot be invented');
  check((await skills(a)).data, priorRatings, 'Retained evidence does not change skill estimates');
  const parallelBefore = (await snapshot(a.id)).data;
  const nextA = event('rating-api-parallel-a'),
    nextB = event('rating-api-parallel-b');
  for (const response of await Promise.all([sync(a, [nextA]), sync(b, [nextB])]))
    check(response.status, 200, 'Parallel owners synchronize');
  await sync(a);
  await sync(b); // also exercises projection recovery on an empty upload.
  check(
    (await source(a, nextA.id)).data[0].rating_version,
    1,
    'First concurrent owner is projected',
  );
  check(
    (await source(b, nextB.id)).data[0].rating_version,
    1,
    'Second concurrent owner is projected',
  );
  const parallelAfter = (await snapshot(a.id)).data;
  const count = (states) => Object.values(states).reduce((sum, state) => sum + state.attempts, 0);
  check(
    count(parallelAfter.buckets) - count(parallelBefore.buckets),
    learningRatingEvidence(catalogue, nextA).observations.length +
      learningRatingEvidence(catalogue, nextB).observations.length,
    'Shared difficulty loses and duplicates no concurrent observations',
  );
  const exported = await request('/functions/v1/privacy?view=export&section=skillRatings', {
    token: a.token,
  });
  check(exported.status, 200, 'Personal ratings are exportable');
  check(
    exported.data.rows.length,
    (await skills(a)).data.length,
    'Export contains all own ratings',
  );
  check(
    exported.data.rows.every((row) => row.user_id === a.id),
    true,
    'Export remains account-separated',
  );
  for (const event of adaptiveEvents) {
    check((await sync(a, [event])).status, 200, 'P3.02 canonical evidence synchronizes');
    check(
      (await source(a, event.id)).data[0].rating_outcome,
      'rated',
      'P3.02 source updates server ratings',
    );
  }
  const weakReceipt = (await source(a, weak.id)).data[0];
  check(
    weakReceipt.retained_summary.sourceKind,
    'practice',
    'Weak practice retention has no invented course progress',
  );
  const weakReward = (
    await request('/rest/v1/xp_ledger?user_id=eq.' + a.id + '&client_id=eq.' + weak.id, {
      admin: true,
    })
  ).data;
  check(weakReward.length, 1, 'Weak practice has one explicit zero-reward receipt');
  check(
    weakReward.every((row) => row.amount === 0 && !row.qualified && row.coins === 0),
    true,
    'Weak practice grants no XP, coins, or streak qualification',
  );
  const readRatings = (user) =>
    request('/rest/v1/rpc/learner_rating_snapshot', {
      token: user.token,
      method: 'POST',
      body: { bucket_ids: bucketIds },
    });
  const ownSnapshot = await readRatings(a);
  check(ownSnapshot.status, 200, 'Authenticated learner reads own selection snapshot');
  check(
    Object.keys(ownSnapshot.data.skills).length,
    (await skills(a)).data.length,
    'Snapshot contains exactly own skills',
  );
  check(
    Object.keys((await readRatings(b)).data.skills).length,
    (await skills(b)).data.length,
    'Snapshot stays isolated for another account',
  );
  const foreign = await request('/rest/v1/rpc/learner_rating_snapshot', {
    token: a.token,
    method: 'POST',
    body: { actor: b.id, bucket_ids: [] },
  });
  check(foreign.status, 404, 'Snapshot does not accept a caller-supplied actor');
  const beforeDuplicate = (await skills(a)).data;
  for (const event of adaptiveEvents)
    check((await sync(a, [event])).status, 200, 'P3.02 retry is acknowledged');
  check(
    (await skills(a)).data,
    beforeDuplicate,
    'Adaptive, weakness and placement retries do not rate twice',
  );
  check(
    (
      await request('/rest/v1/learning_events?user_id=eq.' + a.id + '&client_id=eq.' + weak.id, {
        admin: true,
        method: 'PATCH',
        body: { received_at: '2020-01-01T00:00:00Z' },
      })
    ).status,
    204,
    'Age only own weakness fixture',
  );
  check(
    (
      await rpc('retain_learning_event', {
        actor: a.id,
        client_id: weak.id,
        expected_hash: weakReceipt.event_hash,
        summary: retainLearningEvent(catalogue, weak),
      })
    ).data,
    true,
    'Weakness raw answers follow actual retention',
  );
  check(
    (await sync(a, [], 2)).status,
    426,
    'Older row format receives an explicit upgrade response for retained practice',
  );
  const upgraded = await sync(a, [], 3);
  check(upgraded.status, 200, 'Current row format reads retained practice');
  check(
    upgraded.data.rows.find((row) => row.event.id === weak.id).event.sourceKind,
    'practice',
    'Retained practice never becomes course progress',
  );
} finally {
  // Restore only model buckets touched by these fixtures. A revision guard prevents overwriting a concurrent learner.
  try {
    if (original && users.length) {
      const receipts = await request(
        '/rest/v1/learning_events?select=rating_version&rating_version=eq.1&user_id=in.(' +
          users.join(',') +
          ')',
        { admin: true },
      );
      const expectedRevision = BigInt(original.revision) + BigInt(receipts.data.length);
      const lit = (value) => "'" + value.replaceAll("'", "''") + "'";
      const restore = bucketIds
        .map((id) => {
          const state = original.buckets[id];
          if (!state) return 'delete from item_difficulty where bucket_id=' + lit(id) + ';';
          return (
            'update item_difficulty set rating=' +
            state.rating +
            ',rating_deviation=' +
            state.deviation +
            ',volatility=' +
            state.volatility +
            ',attempts=' +
            state.attempts +
            ',last_practiced_at=to_timestamp(' +
            state.updatedAt +
            '/1000.0) where bucket_id=' +
            lit(id) +
            ';'
          );
        })
        .join('\n');
      const sql = `begin; select 1 from rating_control where id for update; do $$ begin if (select revision from rating_control)<>${expectedRevision} then raise exception 'Concurrent rating write prevents fixture restoration';end if;end $$;\n${restore}\nupdate rating_control set revision=revision+1 where id;commit;`;
      execFileSync(
        'env',
        [
          '-u',
          'DOCKER_HOST',
          '-u',
          'DOCKER_CONTEXT',
          '-u',
          'DOCKER_TLS',
          '-u',
          'DOCKER_TLS_VERIFY',
          '-u',
          'DOCKER_CERT_PATH',
          'docker',
          '--host=unix:///var/run/docker.sock',
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
        ],
        { input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
      );
    }
  } finally {
    const deleted = await Promise.allSettled(
      users.map((id) => request('/auth/v1/admin/users/' + id, { admin: true, method: 'DELETE' })),
    );
    for (const result of deleted) {
      assert.ok(
        result.status === 'fulfilled' && [200, 404].includes(result.value.status),
        'Own local test account removed',
      );
      checks++;
    }
    if (users.length) {
      const remaining = await request(
        '/rest/v1/skill_progress?user_id=in.(' + users.join(',') + ')',
        { admin: true },
      );
      check(remaining.status, 200, 'Verify rating cascade');
      check(remaining.data, [], 'No personal fixture ratings remain');
    }
  }
}
console.log(`${checks} local rating API checks passed.`);
