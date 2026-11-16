import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdentityVerifier } from './auth.mjs';
import { createSessions } from './sessions.mjs';
import { keys, epoch, subject, issuer } from './auth-fixture.mjs';
for (const algorithm of ['ES256', 'RS256'])
  test(`${algorithm}: checks signatures, issuer, audience, subject and exact expiry`, () => {
    const fixture = keys(algorithm),
      verify = createIdentityVerifier({ issuer, jwks: { keys: [fixture.jwk] }, now: () => epoch });
    assert.deepEqual(verify(fixture.token()), {
      subject,
      sessionId: subject,
      expiresAt: epoch + 60000,
    });
    for (const claims of [
      { iss: 'https://other.invalid' },
      { aud: 'other' },
      { sub: 'not-a-user' },
      { session_id: undefined },
      { session_id: 'not-a-session' },
      { role: 'service_role' },
      { role: 'harmonia_school_grader' },
      { exp: epoch / 1000 },
      { exp: '9999999999' },
      { nbf: epoch / 1000 + 1 },
      { iat: epoch / 1000 + 1 },
    ])
      assert.throws(
        () => verify(fixture.token(claims)),
        (error) => error.code === 'forbidden' && error.status === 401,
      );
    for (const header of [
      { alg: 'none' },
      { alg: 'HS256' },
      { kid: 'other' },
      { crit: ['custom'] },
    ])
      assert.throws(
        () => verify(fixture.token({}, header)),
        (error) => error.status === 401,
      );
    const raw = fixture.token().split('.');
    raw[1] = Buffer.from(
      JSON.stringify({ sub: subject, iss: issuer, aud: 'authenticated', exp: epoch / 1000 + 600 }),
    ).toString('base64url');
    assert.throws(
      () => verify(raw.join('.')),
      (error) => error.status === 401,
    );
    for (const value of [undefined, 'a.b.c', 'x'.repeat(9000), fixture.token() + '.extra'])
      assert.throws(
        () => verify(value),
        (error) => error.status === 401,
      );
  });
test('sessions reclaim expired capacity and enforce idle, absolute and token lifetimes', () => {
  let now = 0;
  const sessions = createSessions({ now: () => now, idleMs: 10, maxMs: 30, capacity: 2 });
  const a = { id: 'a' },
    b = { id: 'b' };
  const first = sessions.create(a),
    second = sessions.create(b, 25);
  assert.equal(sessions.create(a), null);
  now = 9;
  assert.equal(sessions.get(first.token).actor, a);
  now = 10;
  assert.equal(sessions.get(second.token), undefined);
  assert.ok(sessions.create(b));
  for (const time of [18, 27]) {
    now = time;
    assert.ok(sessions.get(first.token));
  }
  now = 30;
  assert.equal(sessions.get(first.token), undefined);
  const tokenBound = sessions.create(a, 35);
  now = 35;
  assert.equal(sessions.get(tokenBound.token), undefined);
  now = 40;
  const other = sessions.create(b);
  sessions.removeActor('b');
  assert.equal(sessions.active(other.session), false);
  sessions.close();
});
test('an expired stream session cannot be revived by polling its active flag', () => {
  let now = 0;
  const sessions = createSessions({ now: () => now, idleMs: 10, maxMs: 20 });
  const saved = sessions.create({ id: 'a' });
  for (now = 1; now < 10; now++) assert.equal(sessions.active(saved.session), true);
  assert.equal(sessions.active(saved.session), false);
});
