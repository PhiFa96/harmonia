// Real local Auth/Postgres/Functions. Only own disposable accounts; no provider calls.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue } from '../packages/content/src/authoring.ts';
import {
  lessonEvent,
  lessonPlan,
  applyReviewEvent,
  emptyReviewState,
  reviewCardKey,
  reviewSkillPlan,
  retainLearningEvent,
} from '../packages/content/src/index.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  revealLessonHint,
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
const sync = (user, events = [], rowFormat = 4) =>
  request('/functions/v1/learning-sync', {
    token: user.token,
    method: 'POST',
    body: { rowFormat, rewardFormat: 2, since: 0, events },
  });
const own = (user) =>
  request('/rest/v1/rpc/learner_review_snapshot', { token: user.token, method: 'POST', body: {} });
const finish = (plan, id, time) => {
  let s = createLessonSession(plan, id);
  for (const item of s.initial.items) {
    s = revealLessonHint(s);
    s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
  }
  return lessonEvent(id, s, time - 1000, time, 'Europe/Berlin');
};
try {
  const a = await account(),
    b = await account();
  const plan = lessonPlan(catalogue, 'notation.l1.staff.anchor');
  const first = finish(plan, 'review-first', Date.now() - 400 * 86400000);
  check((await sync(a, [first])).status, 200, 'Assisted lesson accepted');
  const initial = (await own(a)).data;
  check(Object.keys(initial.skills).length > 0, true, 'Skills scheduled from assisted proof');
  check(
    { skills: initial.skills, cards: initial.cards },
    applyReviewEvent(catalogue, emptyReviewState(), first),
    'Server matches exact shared FSRS algorithm',
  );
  check(
    (
      await request('/rest/v1/rpc/learner_rating_snapshot', {
        token: a.token,
        method: 'POST',
        body: { bucket_ids: [] },
      })
    ).data.skills,
    {},
    'Assisted evidence does not invent skill ratings',
  );
  const card = catalogue.knowledgeCards.find(
    (c) => reviewCardKey(c.id, c.contentVersion) in initial.cards,
  );
  const event = {
    kind: 'card-review',
    id: 'review-card',
    cardId: card.id,
    contentVersion: card.contentVersion,
    startedAt: Date.now() - 1000,
    finishedAt: Date.now(),
    timeZone: 'Europe/Berlin',
    rating: 4,
  };
  check((await sync(a, [event])).status, 200, 'Card self-rating stored canonically');
  const reviewed = (await own(a)).data;
  check(
    { skills: reviewed.skills, cards: reviewed.cards },
    applyReviewEvent(catalogue, initial, event),
    'Self rating updates card only',
  );
  const revision = (await rpc('review_snapshot', { actor: a.id })).data.revision;
  for (const result of await Promise.all(Array.from({ length: 5 }, () => sync(a, [event]))))
    check(result.status, 200, 'Concurrent retries accepted');
  check((await own(a)).data, reviewed, 'Retries do not change cards or cursor');
  check(
    (await rpc('review_snapshot', { actor: a.id })).data.revision,
    revision,
    'Retries do not advance account revision',
  );
  check(
    (await own(b)).data,
    { skills: {}, cards: {}, throughSequence: 0, throughPosition: 0 },
    'Foreign account has no schedules',
  );
  check(
    (await request('/rest/v1/card_review_progress?user_id=eq.' + a.id, { token: b.token })).data,
    [],
    'Explicit foreign filter denied by RLS',
  );
  check(
    (
      await request('/rest/v1/rpc/review_snapshot', {
        token: a.token,
        method: 'POST',
        body: { actor: b.id },
      })
    ).status,
    403,
    'Internal snapshot not callable by client',
  );
  check(
    (
      await request('/rest/v1/card_review_progress', {
        token: a.token,
        method: 'POST',
        body: { user_id: a.id, card_key: 'forged@1', fsrs: {} },
      })
    ).status,
    403,
    'Client cannot forge memory',
  );
  check(
    (await sync(a, [{ ...event, id: 'changed', contentVersion: 999 }])).status,
    422,
    'Old card version rejected',
  );
  check(
    (await sync(a, [{ ...event, id: 'future', finishedAt: Date.now() + 3600000 }])).status,
    422,
    'Future completion rejected',
  );
  check(
    (await sync(a, [{ ...event, id: 'manual', rating: 0 }])).status,
    400,
    'Manual grade excluded',
  );
  check(
    (await sync(a, [], 3)).status,
    426,
    'Older clients must upgrade before reading raw card reviews',
  );
  const skillPlan = reviewSkillPlan(catalogue, Object.keys(initial.skills), [plan.id]);
  const due = finish(skillPlan, 'review-due-skill', Date.now());
  // Skill questions still use the canonical energy/access reservation.
  const grant = await request('/functions/v1/access', {
    token: a.token,
    method: 'POST',
    body: {
      id: due.id,
      source: {
        kind: 'lesson',
        lessonId: due.lessonId,
        contentVersion: due.contentVersion,
        seed: due.seed,
        planKey: due.planKey,
      },
    },
  });
  check(grant.status, 200, 'Due skill access reserved');
  check((await sync(a, [due])).status, 200, 'Due skill replay accepted');
  check(
    (
      await request('/functions/v1/learning-sync', {
        token: a.token,
        method: 'POST',
        body: { since: reviewed.throughSequence, events: [], rowFormat: 3 },
      })
    ).status,
    426,
    'Older client must upgrade for a raw due-skill plan, without a card on the page',
  );
  const refreshed = (await own(a)).data;
  check(
    { skills: refreshed.skills, cards: refreshed.cards },
    applyReviewEvent(catalogue, reviewed, due),
    'Skill review advances FSRS once',
  );
  const rewards = await request('/rest/v1/xp_ledger?client_id=eq.' + due.id, { token: a.token });
  check(
    rewards.data.every((r) => r.amount === 0 && r.qualified === false),
    true,
    'Review gives no course XP or qualification',
  );
  const source = (
    await request('/rest/v1/learning_events?client_id=eq.' + first.id, { token: a.token })
  ).data[0];
  check(
    (
      await request('/rest/v1/learning_events?user_id=eq.' + a.id + '&client_id=eq.' + first.id, {
        admin: true,
        method: 'PATCH',
        body: { received_at: new Date(Date.now() - 400 * 86400000).toISOString() },
      })
    ).status,
    204,
    'Only own fixture aged',
  );
  check(
    (
      await rpc('retain_learning_event', {
        actor: a.id,
        client_id: first.id,
        expected_hash: source.event_hash,
        summary: retainLearningEvent(catalogue, first),
      })
    ).data,
    true,
    'Projected raw evidence compacted',
  );
  check((await own(a)).data, refreshed, 'Memory survives detail retention');
  check((await sync(a, [first])).status, 200, 'Original retry remains idempotent after retention');
  check((await own(a)).data, refreshed, 'Retained retry cannot replay answers');
} finally {
  for (const id of users)
    check(
      (await request('/auth/v1/admin/users/' + id, { admin: true, method: 'DELETE' })).status,
      200,
      'Own test account removed',
    );
  if (users.length)
    check(
      (
        await request('/rest/v1/card_review_progress?user_id=in.(' + users.join(',') + ')', {
          admin: true,
        })
      ).data,
      [],
      'Account deletion removes personal schedules',
    );
}
console.log(`${checks} local FSRS API checks passed.`);
