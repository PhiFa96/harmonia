import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { duelViewSchema } from '../packages/content/src/duel.ts';
import { createRng, expectedAnswer, generateExercise } from '../packages/exercises/src/index.ts';

const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const origin = new URL(status.API_URL);
assert.ok(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname));
const users = [];
let gameId;

async function request(
  path,
  { key = status.ANON_KEY, token = key, body, method = body ? 'POST' : 'GET' } = {},
) {
  return fetch(new URL(path, origin), {
    method,
    headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
}

async function account() {
  const credentials = {
    email: 'duel-' + randomUUID() + '@example.invalid',
    password: randomUUID() + 'Aa!42',
  };
  const created = await request('/auth/v1/admin/users', {
    key: status.SERVICE_ROLE_KEY,
    body: { ...credentials, email_confirm: true },
  });
  assert.equal(created.status, 200, 'Create a local account');
  users.push((await created.json()).id);
  const login = await request('/auth/v1/token?grant_type=password', { body: credentials });
  assert.equal(login.status, 200, 'Authenticate the fixture');
  return (await login.json()).access_token;
}

async function duel(token, body) {
  const response = await request('/functions/v1/duel', { token, body });
  const data = await response.json();
  assert.equal(
    response.status,
    200,
    'Duel request ' + (body?.action ?? 'status') + ': ' + JSON.stringify(data),
  );
  return duelViewSchema.parse(data);
}

try {
  const first = await account();
  const second = await account();
  const invite = await duel(first, { action: 'invite', token: randomUUID() });
  assert.equal(invite.phase, 'invite');
  const paired = await duel(second, { action: 'accept', token: invite.token });
  assert.equal(paired.phase, 'game');
  gameId = paired.id;
  const game = await duel(first);
  assert.equal(game.phase, 'game');
  assert.equal(game.id, paired.id);
  assert.ok(game.question);
  await setTimeout(Math.max(0, game.startsAt - Date.now()) + 500);
  const answer = expectedAnswer(
    generateExercise(game.question.spec, createRng(game.question.seed)),
  );
  const body = { action: 'answer', game: game.id, index: game.own.index, answer };
  const [left, right] = await Promise.all([duel(first, body), duel(first, body)]);
  for (const view of [left, right, await duel(first)]) {
    assert.equal(view.phase, 'game');
    assert.equal(view.own.index, game.own.index + 1, 'Parallel duplicate advances once');
    assert.equal(view.own.correct, game.own.correct + 1);
    assert.equal(view.own.score, game.own.score + game.question.difficulty * 10);
  }
  console.log('Duel local API: concurrent answer recorded exactly once.');
} finally {
  if (gameId) {
    const deleted = await request('/rest/v1/duel_games?id=eq.' + gameId, {
      key: status.SERVICE_ROLE_KEY,
      method: 'DELETE',
    });
    assert.ok(deleted.ok, 'Remove disposable game');
  }
  for (const id of users) {
    const deleted = await request('/auth/v1/admin/users/' + id, {
      key: status.SERVICE_ROLE_KEY,
      method: 'DELETE',
    });
    assert.ok(deleted.ok, 'Remove disposable account');
  }
}
