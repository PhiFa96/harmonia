import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const origin = new URL(status.API_URL);
assert.ok(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname));
const users = [];
async function request(path, { token, admin = false, method = 'GET', body } = {}) {
  const response = await fetch(new URL(path, origin), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: response.status === 204 ? null : await response.json() };
}
async function account() {
  const email = 'profile-' + randomUUID() + '@example.test',
    password = randomUUID() + 'Aa!42';
  const created = await request('/auth/v1/admin/users', {
    admin: true,
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  assert.equal(created.status, 200);
  users.push(created.data.id);
  const signed = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  assert.equal(signed.status, 200);
  return { id: created.data.id, token: signed.data.access_token };
}
try {
  const a = await account(),
    b = await account();
  const read = (actor) => request('/rest/v1/profiles?id=eq.' + actor.id, { token: actor.token });
  const save = (actor, patch, initialize = false) =>
    request('/rest/v1/rpc/save_profile_settings', {
      token: actor.token,
      method: 'POST',
      body: { patch, initialize },
    });
  assert.deepEqual((await read(a)).data[0].settings, {});
  const first = await save(
    a,
    { noteNaming: 'intl', referenceHz: 443, sound: true, displayName: 'Own fixture alias' },
    true,
  );
  assert.equal(first.status, 200);
  assert.equal(first.data.settings_revision, 1);
  assert.equal(first.data.display_name, 'Own fixture alias');
  assert.ok(!('displayName' in first.data.settings));
  const concurrent = await Promise.all([save(a, { sound: false }), save(a, { referenceHz: 442 })]);
  assert.ok(concurrent.every((row) => row.status === 200));
  const final = (await read(a)).data[0];
  assert.equal(final.settings.sound, false);
  assert.equal(final.settings.referenceHz, 442);
  assert.equal(final.settings.noteNaming, 'intl');
  assert.equal(final.settings_revision, 3);
  const retriedInit = await save(a, { sound: true, referenceHz: 440 }, true);
  assert.equal(retriedInit.data.settings_revision, 3);
  assert.equal(retriedInit.data.settings.sound, false);
  for (const patch of [
    { xp: 9000 },
    { user_id: b.id },
    { referenceHz: 467 },
    { referenceHz: 415.5 },
    { sound: 'yes' },
    { noteNaming: 'other' },
    { displayName: '  ' },
    { harmonySystem: null },
  ])
    assert.equal((await save(a, patch)).status, 400, 'Malformed patch rejected');
  assert.equal((await read(a)).data[0].settings_revision, 3);
  assert.equal(
    (await request('/rest/v1/profiles?id=eq.' + b.id, { token: a.token })).data.length,
    0,
  );
  assert.equal(
    (
      await request('/rest/v1/profiles?id=eq.' + a.id, {
        token: a.token,
        method: 'PATCH',
        body: { settings: { sound: true } },
      })
    ).status,
    403,
  );
  assert.ok(
    [401, 403].includes(
      (
        await request('/rest/v1/rpc/save_profile_settings', {
          method: 'POST',
          body: { patch: { sound: false } },
        })
      ).status,
    ),
  );
  assert.deepEqual((await read(b)).data[0].settings, {});
  assert.equal((await save(a, { displayName: null, locale: 'en-GB' })).status, 200);
  assert.equal((await read(a)).data[0].display_name, null);
  assert.equal((await read(a)).data[0].locale, 'en-GB');
  assert.equal(
    (await request('/auth/v1/admin/users/' + a.id, { admin: true, method: 'DELETE' })).status,
    200,
  );
  const erased = await request('/rest/v1/profiles?id=eq.' + a.id, { admin: true });
  assert.equal(erased.data.length, 0);
  assert.equal((await read(b)).data.length, 1);
  console.log(
    'Profile settings: local Auth/RLS, initialization race, concurrent field patches, invalid input, independent accounts and deletion passed. No external accounts or messages.',
  );
} finally {
  for (const id of users)
    await request('/auth/v1/admin/users/' + id, { admin: true, method: 'DELETE' });
}
