// Own disposable local accounts only. No remote deployment or push provider.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue } from '../packages/content/src/authoring.ts';
import { lessonEvent, lessonPlan, leagueSnapshotSchema } from '../packages/content/src/index.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '../packages/exercises/src/index.ts';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
assert.ok(api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname));
const users = [],
  cohorts = new Set();
let checks = 0;
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
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}
const rpc = (name, body = {}, token) =>
  request('/rest/v1/rpc/' + name, { token, method: 'POST', body });
async function account() {
  const email = 'leagues-' + randomUUID() + '@example.invalid',
    password = randomUUID() + 'Aa!42';
  const result = await request('/auth/v1/admin/users', {
    admin: true,
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  check(result.status, 200, 'Create own local account');
  users.push(result.data.id);
  const login = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(login.status, 200, 'Sign in locally');
  return { id: result.data.id, token: login.data.access_token };
}
const snapshot = async (user) => {
  const result = await rpc('learner_league', {}, user.token);
  check(result.status, 200, 'Own league snapshot available');
  return leagueSnapshotSchema.parse(result.data);
};
const sync = (user, events = []) =>
  request('/functions/v1/learning-sync', {
    token: user.token,
    method: 'POST',
    body: { rowFormat: 4, rewardFormat: 2, since: 0, events },
  });
async function earn(user, id, time = Date.now()) {
  const plan = lessonPlan(catalogue, 'notation.l1.staff.anchor');
  let s = createLessonSession(plan, id);
  for (const item of s.initial.items) s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
  const event = lessonEvent(id, s, time - 1000, time, 'UTC');
  const grant = await request('/functions/v1/access', {
    token: user.token,
    method: 'POST',
    body: {
      id,
      source: {
        kind: 'lesson',
        lessonId: event.lessonId,
        contentVersion: event.contentVersion,
        seed: event.seed,
        planKey: event.planKey,
      },
    },
  });
  check(grant.status, 200, 'Canonical lesson access reserved');
  const saved = await sync(user, [event]);
  check(saved.status, 200, 'Canonical answers accepted');
  return event;
}
try {
  const a = await account(),
    b = await account(),
    c = await account(),
    d = await account();
  check((await rpc('learner_league')).status, 401, 'Guest cannot read a league');
  const empty = await snapshot(a);
  check(empty.cohort, null, 'Reading does not assign an inactive learner');
  check(empty.pushConsent, false, 'Result pushes default off');
  check(
    (
      await rpc(
        'credit_league',
        { actor: a.id, points: 3000, at_time: new Date().toISOString() },
        a.token,
      )
    ).status,
    403,
    'Client cannot grant XP',
  );
  check(
    (await rpc('close_league_weeks', {}, a.token)).status,
    403,
    'Client cannot run scheduled closure',
  );
  check(
    (
      await request('/rest/v1/league_members', {
        token: a.token,
        method: 'POST',
        body: { user_id: a.id, week_start: empty.weekStart, xp: 99999 },
      })
    ).status,
    403,
    'Direct score forgery denied',
  );
  const event = await earn(a, 'league-first');
  await earn(b, 'league-second');
  const first = await snapshot(a),
    other = await snapshot(b);
  check(first.cohort.entries.filter((e) => e.isYou).length, 1, 'Exactly one own row');
  check(
    first.cohort.entries.every((e) => Object.keys(e).sort().join(',') === 'isYou,rank,slot,xp'),
    true,
    'Other member identities absent',
  );
  check(first.cohort.entries.length, other.cohort.entries.length, 'Members see same cohort size');
  check(
    first.cohort.entries.some((e) => !e.isYou),
    true,
    'A real other learner is present',
  );
  const ledger = await request('/rest/v1/xp_ledger', { token: a.token });
  check(
    first.cohort.entries.find((e) => e.isYou).xp,
    ledger.data.reduce((sum, r) => sum + r.amount, 0),
    'League uses actual canonical rewards',
  );
  const membership = await request('/rest/v1/league_members', { token: a.token });
  membership.data.forEach((m) => cohorts.add(m.cohort_id));
  check(
    (await request('/rest/v1/league_members?user_id=eq.' + a.id, { token: b.token })).data,
    [],
    'RLS blocks another account membership',
  );
  for (const result of await Promise.all(Array.from({ length: 6 }, () => sync(a, [event]))))
    check(result.status, 200, 'Concurrent replay is accepted idempotently');
  check(await snapshot(a), first, 'Retries cannot duplicate XP or enrollment');
  await earn(a, 'league-offline', Date.now() - 400 * 86400000);
  const afterOffline = await snapshot(a);
  check(
    afterOffline.weekStart,
    first.weekStart,
    'Old offline proof enters server confirmation week',
  );
  check(
    afterOffline.cohort.entries.find((e) => e.isYou).xp >
      first.cohort.entries.find((e) => e.isYou).xp,
    true,
    'Confirmed offline XP added once',
  );
  // A card known from the lesson can be reviewed; it must never create XP.
  const ownCards = await rpc('learner_review_snapshot', {}, a.token);
  const cardKey = Object.keys(ownCards.data.cards)[0];
  assert.ok(cardKey, 'The completed lesson must enroll a knowledge card');
  const [cardId, version] = cardKey.split('@');
  check(
    (
      await sync(a, [
        {
          kind: 'card-review',
          id: 'league-no-card-xp',
          cardId,
          contentVersion: Number(version),
          rating: 3,
          startedAt: Date.now() - 1000,
          finishedAt: Date.now(),
          timeZone: 'UTC',
        },
      ])
    ).status,
    200,
    'Card recall accepted',
  );
  check(await snapshot(a), afterOffline, 'Self-assessment cannot change league XP');
  check(
    (await rpc('set_league_result_consent', { enabled: true }, a.token)).data,
    true,
    'Own result category can be enabled',
  );
  check((await snapshot(b)).pushConsent, false, 'Result preference does not affect other account');
  check((await snapshot(a)).pushConsent, true, 'Own preference restored');
  check(
    (await rpc('set_league_result_consent', { enabled: false }, a.token)).data,
    false,
    'Own result category can be disabled',
  );
  // Dedicated past fixture cohort: contains only these two disposable accounts.
  const past = new Date(Date.parse(first.weekStart) - 7 * 86400000).toISOString().slice(0, 10);
  const cohortId = randomUUID();
  cohorts.add(cohortId);
  check(
    (
      await request('/rest/v1/league_cohorts', {
        admin: true,
        method: 'POST',
        body: { id: cohortId, week_start: past, tier: 3, capacity: 30, movement: 5 },
      })
    ).status,
    201,
    'Own past-week fixture',
  );
  check(
    (
      await request('/rest/v1/league_accounts', {
        admin: true,
        method: 'POST',
        body: [
          { user_id: c.id, tier: 3 },
          { user_id: d.id, tier: 3 },
        ],
      })
    ).status,
    201,
    'Own fixture tiers',
  );
  check(
    (
      await request('/rest/v1/league_members', {
        admin: true,
        method: 'POST',
        body: [c, d].map((u, i) => ({
          user_id: u.id,
          week_start: past,
          cohort_id: cohortId,
          slot: i + 1,
          xp: 100 - i * 10,
          joined_at: past + 'T12:00:00Z',
        })),
      })
    ).status,
    201,
    'Own unclosed historical cohort',
  );
  const result = await snapshot(c);
  check(result.result.outcome, 'promoted', 'Delayed own snapshot finalizes promotion');
  check(result.tier, 4, 'Promotion persisted');
  check(result.cohort, null, 'Inactive current week still unassigned');
  const resultD = await snapshot(d);
  check(resultD.result.outcome, 'relegated', 'Small cohort relegation has a separate place');
  check(resultD.tier, 2, 'Relegation persisted');
  check(
    (await rpc('ack_league_result', { week: past }, c.token)).status,
    204,
    'Own result acknowledged',
  );
  check((await snapshot(c)).result.seen, true, 'Read marker survives refresh');
  check((await snapshot(d)).result.seen, false, 'Other result stays unread');
  const exported = await request('/functions/v1/privacy?view=export&section=leagueMemberships', {
    token: c.token,
  });
  check(exported.status, 200, 'League result included in personal export');
  check(exported.data.rows.length, 1, 'Export contains only own membership');
  check(exported.data.rows[0].user_id, c.id, 'Export belongs to requesting account');
  check(
    (await request('/functions/v1/privacy?view=export&section=leagueAccount', { token: c.token }))
      .status,
    200,
    'Tier and result preference included in export',
  );
} finally {
  for (const id of users)
    check(
      (await request('/auth/v1/admin/users/' + id, { admin: true, method: 'DELETE' })).status,
      200,
      'Disposable account erased',
    );
  if (users.length)
    check(
      (
        await request('/rest/v1/league_members?user_id=in.(' + users.join(',') + ')', {
          admin: true,
        })
      ).data,
      [],
      'Erasure cascades to memberships',
    );
  for (const id of cohorts) {
    const remaining = await request('/rest/v1/league_members?cohort_id=eq.' + id, { admin: true });
    if (remaining.data.length === 0)
      check(
        (await request('/rest/v1/league_cohorts?id=eq.' + id, { admin: true, method: 'DELETE' }))
          .status,
        200,
        'Empty own fixture cohort removed',
      );
  }
}
console.log(`${checks} local league API checks passed.`);
