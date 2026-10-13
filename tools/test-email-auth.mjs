// Echte E-Mail-Code-Anmeldung ausschließlich gegen lokale Auth und lokales Mailpit.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const { createClient } = createRequire(new URL('../apps/mobile/package.json', import.meta.url))(
  '@supabase/supabase-js',
);
let status;
try {
  status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
} catch {
  throw new Error('Zuerst pnpm db:start ausführen.');
}
const api = new URL(status.API_URL),
  mail = new URL(status.INBUCKET_URL ?? 'http://127.0.0.1:54324');
for (const url of [api, mail])
  assert.ok(
    url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Ausschließlich lokale Dienste erlaubt.',
  );
assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY, 'Lokale Auth-Schlüssel fehlen.');
const admin = createClient(api.href, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ids = [],
  messages = [],
  clients = [];
async function codeFor(email) {
  for (let i = 0; i < 50; i++) {
    const response = await fetch(new URL('/api/v1/messages', mail));
    assert.ok(response.ok, 'Mailpit ist erreichbar');
    const list = await response.json();
    const message = list.messages.find((m) => m.To.some((to) => to.Address === email));
    if (message) {
      messages.push(message.ID);
      const detail = await (await fetch(new URL('/api/v1/message/' + message.ID, mail))).json();
      const token = /<h2>(\d{6})<\/h2>/.exec(detail.HTML)?.[1];
      assert.ok(token, 'Die Vorlage enthält einen sechsstelligen Code.');
      return { token, html: detail.HTML };
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Lokale Code-E-Mail wurde nicht zugestellt.');
}
try {
  for (const [existing, locale] of [
    [false, 'de'],
    [true, 'en-GB'],
  ]) {
    const email = `harmonia-email-${randomUUID()}@example.invalid`,
      values = new Map(),
      storage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value);
        },
        removeItem: (key) => {
          values.delete(key);
        },
      };
    if (existing) {
      const result = await admin.auth.admin.createUser({ email, email_confirm: true });
      assert.equal(result.error, null);
      ids.push(result.data.user.id);
    }
    const client = createClient(api.href, status.ANON_KEY, {
      auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
    });
    clients.push(client);
    const sent = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { locale, age_confirmed: true, role: 'service_role' },
      },
    });
    assert.equal(sent.error, null, 'Code-Versand');
    assert.equal(sent.data.session, null, 'Versand ist noch keine Anmeldung');
    if (!existing) {
      const users = await admin.auth.admin.listUsers();
      const own = users.data.users.find((u) => u.email === email);
      assert.ok(own);
      ids.push(own.id);
    }
    const message = await codeFor(email);
    assert.ok(
      message.html.includes('Dein Code') && message.html.includes('Your email sign-in code'),
    );
    const wrong = await client.auth.verifyOtp({
      email,
      token: message.token === '000000' ? '111111' : '000000',
      type: 'email',
    });
    assert.ok(wrong.error);
    assert.equal(wrong.data.session, null, 'Falscher Code erzeugt keine Sitzung');
    const verified = await client.auth.verifyOtp({ email, token: message.token, type: 'email' });
    assert.equal(verified.error, null);
    assert.ok(verified.data.session);
    assert.ok(verified.data.user.email_confirmed_at);
    assert.equal(verified.data.user.role, 'authenticated');
    const replay = await client.auth.verifyOtp({ email, token: message.token, type: 'email' });
    assert.ok(replay.error, 'Ein benutzter Code ist ungültig');
    const restored = createClient(api.href, status.ANON_KEY, {
      auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
    });
    clients.push(restored);
    const user = await restored.auth.getUser();
    assert.equal(user.error, null);
    assert.equal(user.data.user.id, verified.data.user.id, 'Sitzung nach Client-Neustart');
    const refreshed = await restored.auth.refreshSession();
    assert.equal(refreshed.error, null);
    assert.ok(refreshed.data.session, 'Refresh funktioniert');
    const profile = await restored.from('profiles').select('id,locale');
    assert.equal(profile.error, null);
    assert.equal(profile.data.length, 1);
    assert.equal(profile.data[0].id, user.data.user.id);
    const logout = await restored.auth.signOut({ scope: 'local' });
    assert.equal(logout.error, null);
    assert.equal((await restored.auth.getSession()).data.session, null);
    console.log(
      `${existing ? 'Bestehendes Konto' : 'Neues Konto'}: lokaler Code, Sprache, falscher/verbrauchter Code, bestätigte Sitzung, Neustart, Refresh, eigenes Profil und Abmeldung bestanden.`,
    );
  }
} finally {
  for (const client of clients) await client.auth.stopAutoRefresh();
  for (const id of ids) {
    const result = await admin.auth.admin.deleteUser(id);
    assert.equal(result.error, null, 'Testkonto entfernen');
  }
  if (messages.length) {
    const response = await fetch(new URL('/api/v1/messages', mail), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: messages }),
    });
    assert.ok(response.ok, 'Nur Test-E-Mails entfernen');
  }
}
console.log(
  'E-Mail-Anmeldung lokal geprüft; keine externen E-Mails, Testkonten oder Sitzungsdateien.',
);
