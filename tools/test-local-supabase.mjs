// Integrationstest gegen die laufende lokale Auth-/REST-API; keine externen Konten.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

let status;
try {
  status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
} catch {
  throw new Error('Lokales Supabase zuerst mit pnpm db:start starten.');
}

const api = new URL(status.API_URL);
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Dieser Test darf ausschließlich die lokale Supabase-API verwenden.',
);
assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY, 'Lokale Testschlüssel fehlen.');

// Schlüssel und Sessions bleiben im Prozess; weder Ausgabe noch Dateien enthalten sie.
async function request(path, { token, admin = false, method = 'GET', body } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: `Bearer ${token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

const accounts = [];
try {
  for (const name of ['A', 'B']) {
    const signup = await request('/auth/v1/signup', {
      method: 'POST',
      body: {
        email: `harmonia-local-${randomUUID()}@example.com`,
        password: randomUUID() + randomUUID(),
        // Nutzermetadaten dürfen weder Rolle noch fremde Profil-ID bestimmen.
        data: { role: 'service_role', id: accounts[0]?.id, display_name: 'Forged' },
      },
    });
    assert.equal(signup.status, 200, `Signup ${name}`);
    if (signup.data.user?.id)
      accounts.push({ id: signup.data.user.id, token: signup.data.access_token });
    assert.ok(signup.data.access_token, `Lokale Session ${name}`);
  }

  const [a, b] = accounts;
  const own = await request('/rest/v1/profiles?select=*', { token: a.token });
  assert.equal(own.status, 200, 'Eigenes Profil lesen');
  assert.equal(own.data.length, 1, 'Genau ein eigenes Profil sichtbar');
  assert.equal(own.data[0].id, a.id, 'Profil-ID stammt aus Auth');
  assert.equal(own.data[0].display_name, null, 'Metadaten werden ignoriert');
  assert.equal(own.data[0].locale, 'de', 'Standardsprache');

  const changed = await request(`/rest/v1/profiles?id=eq.${a.id}`, {
    token: a.token,
    method: 'PATCH',
    body: { display_name: 'Local integration test', locale: 'en-GB' },
  });
  assert.equal(changed.status, 200, 'Eigenes Profil ändern');
  assert.equal(changed.data[0].locale, 'en-GB', 'Neue Sprache gespeichert');

  const foreignRead = await request(`/rest/v1/profiles?id=eq.${b.id}`, { token: a.token });
  assert.equal(foreignRead.status, 200, 'Fremdes Profil wird gefiltert');
  assert.deepEqual(foreignRead.data, [], 'Fremdes Profil bleibt unsichtbar');
  const foreignWrite = await request(`/rest/v1/profiles?id=eq.${b.id}`, {
    token: a.token,
    method: 'PATCH',
    body: { display_name: 'Hijacked' },
  });
  assert.equal(foreignWrite.status, 200, 'Fremdes Profil wird beim Schreiben gefiltert');
  assert.deepEqual(foreignWrite.data, [], 'Keine fremde Zeile geändert');
  const bProfile = await request('/rest/v1/profiles?select=id,display_name', { token: b.token });
  assert.equal(bProfile.status, 200, 'Zweites Konto kann sein Profil lesen');
  assert.deepEqual(
    bProfile.data,
    [{ id: b.id, display_name: null }],
    'Zweites Profil bleibt unverändert',
  );

  for (const body of [{ id: b.id }, { created_at: '2000-01-01' }, { updated_at: '2000-01-01' }]) {
    const denied = await request(`/rest/v1/profiles?id=eq.${a.id}`, {
      token: a.token,
      method: 'PATCH',
      body,
    });
    assert.equal(denied.status, 403, 'Serverfelder sind schreibgeschützt');
  }
  assert.equal((await request('/rest/v1/profiles')).status, 401, 'Ohne Session kein Profilzugriff');
  assert.equal(
    (await request(`/rest/v1/profiles?id=eq.${a.id}`, { token: a.token, method: 'DELETE' })).status,
    403,
    'Profil-Löschung ist dem Backend vorbehalten',
  );

  const removed = await request(`/auth/v1/admin/users/${a.id}`, { admin: true, method: 'DELETE' });
  assert.equal(removed.status, 200, 'Testkonto über die Admin-API löschen');
  const afterDelete = await request(`/rest/v1/profiles?id=eq.${a.id}`, { admin: true });
  assert.equal(afterDelete.status, 200, 'Kaskade über Backend prüfen');
  assert.deepEqual(afterDelete.data, [], 'Kontolöschung entfernt auch das Profil');
  accounts.shift();
  console.log('Auth/REST: Signup, eigene Profile, Zugriffsschutz und Löschkaskade erfolgreich.');
} finally {
  const cleanup = await Promise.allSettled(
    accounts.map(async ({ id }) => {
      const result = await request(`/auth/v1/admin/users/${id}`, { admin: true, method: 'DELETE' });
      assert.ok(
        [200, 404].includes(result.status),
        'Lokales Testkonto konnte nicht entfernt werden.',
      );
    }),
  );
  assert.ok(
    cleanup.every((result) => result.status === 'fulfilled'),
    'Bereinigung lokaler Testkonten fehlgeschlagen.',
  );
}
