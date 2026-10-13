// Echte lokale Auth-, Engine-, RPC- und Paging-Integration. Keine Remote-Testkonten.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import { lessonEvent, learningPath, validateLearningEvent } from '../packages/content/src/index.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
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
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Nur lokale Test-API',
);
const users = [];
async function request(path, { token, admin = false, method = 'POST', body } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: `Bearer ${token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
let lesson = createLessonSession(firstLesson, 'sync-real');
while (lesson.phase === 'initial') {
  const active = activeLessonSession(lesson),
    item = active && currentItem(active);
  assert.ok(item);
  lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
}
const event = (id) => lessonEvent(id, lesson, 1000, 2000);
const sync = (token, events = [], since = 0) =>
  request('/functions/v1/learning-sync', { token, body: { events, since } });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(new URL('/functions/v1/learning-sync', api), {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(2000),
      });
      if (response.status === 204) {
        ready = true;
        break;
      }
    } catch {
      /* Der lokale Worker startet noch. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Lokale Funktion zuerst mit pnpm db:serve:learning starten.');
  for (let i = 0; i < 2; i++) {
    const email = `learning-${randomUUID()}@example.invalid`,
      password = randomUUID() + randomUUID();
    const created = await request('/auth/v1/admin/users', {
      admin: true,
      body: { email, password, email_confirm: true },
    });
    assert.equal(created.status, 200, 'Lokales Testkonto');
    users.push({ id: created.data.id });
    const signed = await request('/auth/v1/token?grant_type=password', {
      body: { email, password },
    });
    assert.equal(signed.status, 200, 'Lokale Auth');
    users.at(-1).token = signed.data.access_token;
  }
  const [a, b] = users;
  assert.equal((await sync('invalid')).status, 401, 'Ungültiges JWT');
  assert.equal((await sync(status.ANON_KEY)).status, 401, 'Gast darf nicht syncen');
  const one = event('first');
  if (process.argv.includes('--published')) {
    assert.equal(
      (await sync(a.token, [one])).status,
      422,
      'Öffentliche Funktion akzeptiert keine Entwurfslektion',
    );
    assert.equal(
      (await sync(a.token)).data.rows.length,
      0,
      'Keine Entwurfsgutschrift im öffentlichen Modus',
    );
    console.log('Learning sync: öffentlicher Modus verweigert Entwurfsinhalte.');
  } else {
    const [first, repeated] = await Promise.all([sync(a.token, [one]), sync(a.token, [one])]);
    assert.equal(first.status, 200, 'Engine-geprüfter Upload');
    assert.equal(repeated.status, 200, 'Gleichzeitige Wiederholung');
    const own = await sync(a.token);
    assert.equal(own.data.rows.length, 1, 'Genau eine gespeicherte ID');
    assert.equal(validateLearningEvent(catalogue, own.data.rows[0].event).lesson.passed, true);
    const other = await sync(b.token);
    assert.equal(other.status, 200);
    assert.equal(other.data.rows.length, 0, 'Anderes Konto sieht keine Antworten');
    const forged = { ...one, id: 'forged', initial: { answers: [], skipped: [] } };
    assert.equal(
      (await sync(a.token, [forged])).status,
      422,
      'Keine clientseitige Ergebnisbehauptung',
    );
    assert.equal(
      (await sync(a.token, [{ ...one, id: 'flags', passed: true }])).status,
      400,
      'Zusatzfelder abgelehnt',
    );
    assert.equal(
      (await sync(a.token, [{ ...one, id: 'old', contentVersion: one.contentVersion + 1 }])).status,
      422,
      'Andere Inhaltsversion',
    );
    assert.equal(
      (await sync(a.token, [{ ...one, finishedAt: 3000 }])).status,
      409,
      'Bestehende ID unveränderlich',
    );
    assert.equal(
      (
        await request('/rest/v1/learning_events', {
          token: a.token,
          body: { user_id: a.id, client_id: 'direct', event: one },
        })
      ).status,
      403,
      'Direktwrite verboten',
    );
    assert.equal(
      (
        await request('/rest/v1/rpc/append_learning_events', {
          token: a.token,
          body: { actor: b.id, events: [one] },
        })
      ).status,
      403,
      'RPC-Bypass verboten',
    );
    // 226 offline gespeicherte Durchgänge: mehrere Uploadbatches und Downloadseiten.
    for (let start = 0; start < 225; start += 50) {
      const batch = Array.from({ length: Math.min(50, 225 - start) }, (_, i) =>
        event(`offline-${start + i}`),
      );
      const result = await sync(a.token, batch);
      assert.equal(result.status, 200);
      assert.equal(result.data.accepted.length, batch.length);
    }
    const page1 = await sync(a.token);
    assert.equal(page1.data.rows.length, 200);
    assert.equal(page1.data.more, true);
    const page2 = await sync(a.token, [], page1.data.cursor);
    assert.equal(page2.data.rows.length, 26);
    assert.equal(page2.data.more, false);
    const receipts = [...page1.data.rows, ...page2.data.rows].map(
      (r) => validateLearningEvent(catalogue, r.event).lesson,
    );
    const deviceTwo = learningPath(catalogue, receipts);
    const deviceOne = learningPath(catalogue, [validateLearningEvent(catalogue, one).lesson]);
    assert.deepEqual(deviceTwo, deviceOne, 'Zweites Gerät berechnet denselben Lernpfad');
    assert.equal(
      (await sync(a.token, [], page2.data.cursor)).data.rows.length,
      0,
      'Cursor verhindert doppelte Downloads',
    );
    assert.equal(
      (await sync(b.token, [event('first')])).status,
      200,
      'Gleiche Client-ID in anderem Konto zulässig',
    );
    assert.equal((await sync(b.token)).data.rows.length, 1, 'Konto B bleibt isoliert');
    console.log(
      'Learning sync: Auth, Engine, RLS, parallele Duplikate, 226 Offline-Versuche, Paging und zwei Geräte bestanden.',
    );
  }
} finally {
  for (const user of users) {
    const result = await request(`/auth/v1/admin/users/${user.id}`, {
      admin: true,
      method: 'DELETE',
    });
    assert.equal(result.status, 200, 'Nur erzeugte Testkonten entfernen');
  }
}
