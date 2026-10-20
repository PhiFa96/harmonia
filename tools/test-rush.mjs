// Own disposable local accounts. No production deployment or provider calls.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRng, generateExercise, expectedAnswer } from '../packages/exercises/src/index.ts';
import {
  rushViewSchema,
  rushStatusSchema,
  rushLeaderboardSchema,
} from '../packages/content/src/rush.ts';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const url = new URL(status.API_URL);
assert.ok(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname));
const users = [],
  cohorts = new Set();
let checks = 0;
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
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
      '-Atq',
    ],
    { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim();
const lit = (value) => "'" + String(value).replaceAll("'", "''") + "'";
async function request(path, { token, admin = false, method = 'GET', body } = {}) {
  const response = await fetch(new URL(path, url), {
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
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}
const call = (user, body, query = '') =>
  request('/functions/v1/rush' + query, {
    ...(user ? { token: user.token } : {}),
    ...(body ? { method: 'POST', body } : {}),
  });
async function account() {
  const email = 'rush-' + randomUUID() + '@example.invalid',
    password = randomUUID() + 'Aa!42';
  const a = await request('/auth/v1/admin/users', {
    admin: true,
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  check(a.status, 200, 'Create local account');
  users.push(a.data.id);
  const login = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(login.status, 200, 'Real local authentication');
  return { id: a.data.id, token: login.data.access_token };
}
const ready = (r) =>
  sql(
    `update public.rush_runs set last_at=clock_timestamp()-interval '1 second' where id=${lit(r.id)};`,
  );
async function answer(user, r, correct = true) {
  ready(r);
  const item = generateExercise(r.question.spec, createRng(r.question.seed)),
    right = expectedAnswer(item);
  const value = correct ? right : item.choices.find((c) => c !== right);
  assert.ok(value);
  const result = await call(user, { action: 'answer', id: r.id, index: r.index, answer: value });
  check(result.status, 200, 'Engine answer accepted');
  return { run: rushViewSchema.parse(result.data), value };
}
async function start(user, mode) {
  const result = await call(user, { action: 'start', id: randomUUID(), mode });
  check(result.status, 200, 'Server starts ' + mode);
  return rushViewSchema.parse(result.data);
}
try {
  const a = await account(),
    b = await account(),
    c = await account();
  check((await call(null)).status, 401, 'No guest leaderboard or run API');
  const s = await call(a);
  check(s.status, 200, 'Own status available');
  check(rushStatusSchema.parse(s.data).remaining, 1, 'One free daily start');
  for (const table of ['rush_policy', 'rush_runs', 'rush_steps', 'rush_daily_usage'])
    check(
      (await request('/rest/v1/' + table, { token: a.token })).status,
      403,
      'Direct reads denied: ' + table,
    );
  check(
    (
      await request('/rest/v1/rpc/start_rush', {
        token: a.token,
        method: 'POST',
        body: {
          actor: a.id,
          run: randomUUID(),
          selected_mode: 'three',
          bank_version: 'a'.repeat(64),
          task_pool: [],
          server_seed: randomUUID(),
        },
      })
    ).status,
    403,
    'Client cannot mint seed or trusted bank',
  );
  const id = randomUUID();
  const starts = await Promise.all([
    call(a, { action: 'start', id, mode: 'three' }),
    call(a, { action: 'start', id, mode: 'three' }),
  ]);
  starts.forEach((r) => check(r.status, 200, 'Concurrent identical starts succeed'));
  let r = rushViewSchema.parse(starts[0].data);
  check(r.id, starts[1].data.id, 'Start receipt idempotent');
  check(r.deadline - r.startedAt, 180000, 'Three-minute server deadline');
  check(
    (await call(a, { action: 'start', id, mode: 'five' })).status,
    409,
    'Same ID different mode rejected',
  );
  check(
    (await call(a, { action: 'start', id: randomUUID(), mode: 'three' })).status,
    409,
    'Only one active run',
  );
  check(
    (await call(a, { action: 'answer', id: r.id, index: 0, answer: 'C', correct: true })).status,
    400,
    'Forged correctness rejected',
  );
  check(
    (await call(a, { action: 'answer', id: r.id, index: 0, answer: 'C', seed: 'fake' })).status,
    400,
    'Forged seed rejected',
  );
  check((await call(b, { action: 'finish', id: r.id })).status, 404, 'Foreign run hidden');
  check(
    (await call(a, { action: 'answer', id: r.id, index: 99, answer: 'C' })).status,
    409,
    'Skipping ordinals rejected',
  );
  check(
    (await call(a, { action: 'finish', id: r.id })).data.state,
    'active',
    'Early finish cannot release score or XP',
  );
  sql(
    `update public.rush_runs set last_at=clock_timestamp()+interval '1 second' where id=${lit(r.id)};`,
  );
  const right = expectedAnswer(generateExercise(r.question.spec, createRng(r.question.seed)));
  check(
    (await call(a, { action: 'answer', id: r.id, index: 0, answer: right })).status,
    429,
    'Server response-time bound',
  );
  const first = await answer(a, r);
  r = first.run;
  check(r.correct, 1, 'Server grades correct');
  const duplicate = await call(a, { action: 'answer', id: r.id, index: 0, answer: first.value });
  check(duplicate.status, 200, 'Lost answer receipt can be retried');
  check(duplicate.data.index, 1, 'No duplicate progress');
  check(
    (await call(a, { action: 'answer', id: r.id, index: 0, answer: 'changed' })).status,
    409,
    'Conflicting replay rejected',
  );
  for (let i = 0; i < 3; i++) r = (await answer(a, r, false)).run;
  check(r.state, 'finished', 'Three mistakes end the run');
  check(r.xp, 1, 'Only canonical correct answers award XP');
  check(r.question, null, 'No question after finish');
  const finished = await call(a, { action: 'finish', id: r.id });
  check(finished.data.xp, 1, 'Completion retry stable');
  const ledger = await request('/rest/v1/xp_ledger?user_id=eq.' + a.id, { token: a.token });
  check(ledger.data.length, 1, 'Exactly one canonical XP receipt');
  check(ledger.data[0].source_kind, 'rush', 'No fake lesson proof');
  check(ledger.data[0].qualified, false, 'Rush does not forge streak days');
  check(ledger.data[0].coins, 0, 'No Rush coins');
  const league = await request('/rest/v1/rpc/learner_league', {
    token: a.token,
    method: 'POST',
    body: {},
  });
  check(league.data.cohort.entries.find((e) => e.isYou).xp, 1, 'Verified Rush XP enters league');
  const motivation = await request('/rest/v1/rpc/motivation_history', {
    admin: true,
    method: 'POST',
    body: { actor: a.id },
  });
  check(
    motivation.data.activities.find((x) => x.id === 'rush:' + r.id).amount,
    1,
    'Rush included in existing motivation history',
  );
  const device = { deviceId: randomUUID(), deviceKey: randomUUID(), deviceRevision: 1 };
  const motivationApi = await request('/functions/v1/motivation', {
    token: a.token,
    method: 'POST',
    body: { ...device, rushFormat: 1 },
  });
  check(motivationApi.status, 200, 'New client can cache confirmed Rush aggregates');
  check(
    motivationApi.data.rushActivities.find((x) => x.id === 'rush:' + r.id).amount,
    1,
    'Canonical Rush aggregate in actual client response',
  );
  const legacyMotivation = await request('/functions/v1/motivation', {
    token: a.token,
    method: 'POST',
    body: device,
  });
  check(legacyMotivation.status, 200, 'Old client motivation request still accepted');
  check(
    'rushActivities' in legacyMotivation.data,
    false,
    'No unknown field for strict old clients',
  );
  check(
    (await call(a, { action: 'start', id: randomUUID(), mode: 'five' })).status,
    403,
    'Free quota applies after completion',
  );
  for (const scope of ['day', 'week', 'all', 'friends']) {
    const result = await call(a, null, '?board=' + scope + '&mode=three');
    check(result.status, 200, 'Board ' + scope);
    const board = rushLeaderboardSchema.parse(result.data);
    check(board.available, true, 'All scopes supported without fabricated friendships');
    check(
      board.entries.some((e) => e.isYou && e.score === r.score),
      true,
      'Own confirmed best visible',
    );
    check(JSON.stringify(result.data).includes(a.id), false, 'No UUID on leaderboard');
  }
  for (const section of ['rushRuns', 'rushSteps', 'rushUsage']) {
    const result = await request('/functions/v1/privacy?view=export&section=' + section, {
      token: a.token,
    });
    check(result.status, 200, 'Own privacy export: ' + section);
    check(
      result.data.rows.every((row) => row.user_id === a.id),
      true,
      'Export remains owner-scoped',
    );
  }
  let five = await start(b, 'five');
  check(five.deadline - five.startedAt, 300000, 'Five-minute server deadline');
  five = (await answer(b, five)).run;
  sql(
    `update public.rush_runs set started_at=clock_timestamp()-interval '6 minutes',deadline=clock_timestamp()-interval '1 minute',last_at=clock_timestamp()-interval '2 minutes' where id=${lit(five.id)};`,
  );
  const expired = await call(b, {
    action: 'answer',
    id: five.id,
    index: five.index,
    answer: expectedAnswer(generateExercise(five.question.spec, createRng(five.question.seed))),
  });
  check(expired.status, 200, 'Expired run settles');
  check(expired.data.state, 'finished', 'Deadline cannot be extended by client');
  check(expired.data.index, five.index, 'Late answer excluded');
  let survival = await start(c, 'survival');
  check(survival.deadline, null, 'Survival has no game timer');
  survival = (await answer(c, survival)).run;
  const abandoned = await call(c, { action: 'abandon', id: survival.id });
  check(abandoned.data.state, 'abandoned', 'Explicit abandon');
  check(abandoned.data.xp, 0, 'No XP from abandoned farming');
  check((await call(c)).data.remaining, 0, 'Abandon does not refund quota');
  check(
    (await request('/rest/v1/xp_ledger?user_id=eq.' + c.id, { token: c.token })).data.length,
    0,
    'Abandon has no ledger reward',
  );
  check(
    (await request('/rest/v1/friendships', { token: a.token })).status,
    403,
    'Friendship graph cannot be enumerated',
  );
  sql(
    `insert into public.entitlements(user_id,entitlement,active,expires_at,store) values(${lit(b.id)},'premium',true,now()+interval '1 day','manual');`,
  );
  check((await call(b)).data.limit, 100, 'Paid allowance is bounded and server-derived');
  let peer = await start(b, 'three');
  for (let i = 0; i < 2; i++) peer = (await answer(b, peer)).run;
  for (let i = 0; i < 3; i++) peer = (await answer(b, peer, false)).run;
  sql(
    `insert into public.friendships(user_id,friend_id,status) values(${lit(a.id)},${lit(b.id)},'accepted');`,
  );
  check(
    (await call(a, null, '?board=friends&mode=three')).data.entries.length,
    1,
    'One-sided acceptance is not a friendship',
  );
  sql(
    `insert into public.friendships(user_id,friend_id,status) values(${lit(b.id)},${lit(a.id)},'accepted');`,
  );
  const friendBoard = await call(a, null, '?board=friends&mode=three');
  check(friendBoard.data.entries.length, 2, 'Reciprocal friends included');
  check(
    friendBoard.data.entries.some((e) => !e.isYou && e.score === peer.score),
    true,
    'Actual peer best score',
  );
  check(
    JSON.stringify(friendBoard.data).includes(b.id),
    false,
    'Friend identifiers never exposed in board',
  );
  sql(
    `update public.friendships set status='blocked' where user_id=${lit(b.id)} and friend_id=${lit(a.id)};`,
  );
  check(
    (await call(a, null, '?board=friends&mode=three')).data.entries.length,
    1,
    'A block in either direction hides peer',
  );
  sql(`delete from public.friendships where user_id=${lit(b.id)} and friend_id=${lit(a.id)};`);
  check(
    (await call(a, null, '?board=friends&mode=three')).data.entries.length,
    1,
    'Removed friendship disappears immediately',
  );
  // A new UTC quota bucket, then truly concurrent distinct starts.
  sql(`update public.rush_daily_usage set day=day-1 where user_id=${lit(c.id)};`);
  check((await call(c)).data.remaining, 1, 'Previous UTC day does not consume today');
  const competing = await Promise.all([
    call(c, { action: 'start', id: randomUUID(), mode: 'three' }),
    call(c, { action: 'start', id: randomUUID(), mode: 'five' }),
  ]);
  check(
    competing.map((x) => x.status).sort(),
    [200, 409],
    'Distinct concurrent starts cannot bypass quota',
  );
  const expiredId = competing.find((x) => x.status === 200).data.id;
  sql(
    `update public.rush_runs set deadline=clock_timestamp()-interval '1 second' where id=${lit(expiredId)};`,
  );
  check(
    (
      await request('/rest/v1/rpc/close_expired_rush', {
        admin: true,
        method: 'POST',
        body: { batch_size: 100 },
      })
    ).status,
    200,
    'Scheduler closes disconnected timed run',
  );
  check((await call(c)).data.run.state, 'finished', 'Closed run recovered after disconnection');
  const oldSurvival = (await answer(b, await start(b, 'survival'))).run;
  sql(
    `update public.rush_runs set started_at=now()-interval '13 months',last_at=clock_timestamp() where id=${lit(oldSurvival.id)};`,
  );
  // Retention operates only on our old fixture. Aggregate receipt survives.
  sql(
    `update public.rush_runs set started_at=now()-interval '14 months',last_at=now()-interval '13 months',finished_at=now()-interval '13 months',deadline=now()-interval '13 months' where id=${lit(r.id)};`,
  );
  const retained = await request('/rest/v1/rpc/retain_rush', {
    admin: true,
    method: 'POST',
    body: {},
  });
  check(retained.status, 200, 'Bounded raw-answer retention');
  check(
    sql(`select state from public.rush_runs where id=${lit(oldSurvival.id)};`),
    'abandoned',
    'Continued activity cannot extend the twelve-month raw-data limit',
  );
  check(
    sql(`select count(*) from public.rush_steps where run_id=${lit(oldSurvival.id)};`),
    '0',
    'Even an active old survival run loses raw answers',
  );
  check(
    sql(`select count(*) from public.rush_steps where run_id=${lit(r.id)};`),
    '0',
    'Raw answers deleted',
  );
  check(
    sql(
      `select (pool is null and seed is null and retained_at is not null)::text from public.rush_runs where id=${lit(r.id)};`,
    ),
    'true',
    'Source details removed',
  );
  check(
    (await request('/rest/v1/xp_ledger?user_id=eq.' + a.id, { token: a.token })).data.length,
    1,
    'Canonical receipt retained',
  );
  console.log('Theory Rush local API: ' + checks + ' checks passed.');
} finally {
  for (const actor of users) {
    for (const line of sql(
      `select cohort_id from public.league_members where user_id=${lit(actor)};`,
    )
      .split('\n')
      .filter(Boolean))
      cohorts.add(line);
    await request('/auth/v1/admin/users/' + actor, { admin: true, method: 'DELETE' });
    check(
      sql(`select count(*) from public.rush_runs where user_id=${lit(actor)};`),
      '0',
      'Account deletion cascades Rush',
    );
  }
  for (const id of cohorts)
    sql(
      `delete from public.league_cohorts where id=${lit(id)} and not exists(select 1 from public.league_members where cohort_id=${lit(id)});`,
    );
}
