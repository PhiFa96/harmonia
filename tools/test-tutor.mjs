// Echte lokale Auth-/REST-/Edge-/PostgreSQL-Integration; Anthropic-Transport ausdrücklich ersetzt.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  DEFAULT_TUTOR_POLICY,
  tutorPolicySchema,
  tutorAccountSchema,
  tutorAttemptResponseSchema,
  resolveReportSource,
} from '../packages/content/src/index.ts';
import { catalogue } from '../packages/content/src/authoring.ts';
import { expectedAnswer } from '../packages/exercises/src/index.ts';
import {
  issueTutorAttempt,
  TUTOR_ATTEMPT_TTL_MS,
} from '../supabase/functions/_shared/tutor-attempt.ts';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Nur lokale API',
);
const users = [];
let original,
  checks = 0;
const expect = (value, expected, label) => {
  assert.deepEqual(value, expected, label);
  checks++;
};
const endpoint = '/functions/v1/tutor';
async function raw(path, { token, admin = false, method = 'POST', body, signal } = {}) {
  return fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: `Bearer ${token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    signal: signal ?? AbortSignal.timeout(20000),
  });
}
async function call(path, options) {
  const response = await raw(path, options),
    text = await response.text();
  const events = response.headers.get('Content-Type')?.includes('text/event-stream')
    ? text
        .split('\n\n')
        .filter((block) => block.startsWith('event: '))
        .map((block) => JSON.parse(block.split('\ndata: ')[1]))
    : [];
  return {
    status: response.status,
    headers: response.headers,
    data: events.length ? null : text ? JSON.parse(text) : null,
    events,
  };
}
const payload = (extra = {}) => ({
  id: randomUUID(),
  conversationId: randomUUID(),
  message: 'fixture:tools',
  locale: 'de',
  noteNaming: 'de',
  mode: 'chat',
  hintLevel: null,
  context: null,
  ...extra,
});
const send = (token, body) => call(endpoint, { token, body });
const table = (name, options = {}) => call('/rest/v1/' + name, { method: 'GET', ...options });
async function configure(changes) {
  const response = await raw('/rest/v1/tutor_policy?id=eq.true', {
    admin: true,
    method: 'PATCH',
    body: {
      policy: tutorPolicySchema.parse({ ...policy, ...changes }),
    },
  });
  expect(response.status, 204, 'Lokale Testkonfiguration');
}
const tariff = {
  version: 'synthetic-test-only',
  source: 'https://example.invalid/test-tariff',
  verifiedAt: '2026-10-14T00:00:00Z',
  input: 5000,
  output: 25000,
  cacheRead: 500,
  cacheWrite5m: 6250,
  cacheWrite1h: 10000,
};
const policy = {
  ...DEFAULT_TUTOR_POLICY,
  enabled: true,
  model: 'synthetic-test-model',
  tariff,
  timeoutMs: 5000,
  requestsPerMinute: 60,
  premium: { requests: 200, costNanoUsd: 100_000_000_000 },
  max: { requests: 200, costNanoUsd: 100_000_000_000 },
  globalDailyCostNanoUsd: 200_000_000_000,
};
async function usage(user) {
  return (await table(`ai_usage?user_id=eq.${user.id}`, { admin: true })).data[0];
}
async function grant(
  user,
  entitlement = 'premium',
  expires_at = new Date(Date.now() + 86400000).toISOString(),
) {
  expect(
    (
      await raw('/rest/v1/entitlements', {
        admin: true,
        body: { user_id: user.id, entitlement, active: true, expires_at, store: 'manual' },
      })
    ).status,
    201,
    'Server-Abo-Testbindung',
  );
}
async function waitFinished(id) {
  for (let n = 0; n < 80; n++) {
    const row = (await table(`tutor_requests?id=eq.${id}`, { admin: true })).data[0];
    if (row?.state !== 'reserved') return row;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Tutor-Abschluss blieb offen');
}
try {
  for (let n = 0; n < 60; n++) {
    const ready = await call(endpoint, { method: 'GET' }).catch(() => null);
    if (ready?.status === 401) break;
    if (n === 59)
      throw new Error('Lokale Tutor-Funktion fehlt; db:serve:learning --tutor-test starten');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  for (let n = 0; n < 2; n++) {
    const email = `tutor-${randomUUID()}@example.invalid`,
      password = randomUUID() + randomUUID();
    const created = await call('/auth/v1/admin/users', {
      admin: true,
      body: { email, password, email_confirm: true },
    });
    expect(created.status, 200, 'Testkonto erstellt');
    users.push({ id: created.data.id });
    const signed = await call('/auth/v1/token?grant_type=password', { body: { email, password } });
    expect(signed.status, 200, 'Echte Kontoanmeldung');
    users.at(-1).token = signed.data.access_token;
  }
  const [a, b] = users;
  const sourceLesson = catalogue.lessons[0];
  assert.ok(sourceLesson);
  const evidenceId = randomUUID();
  const retained = {
    kind: 'retained',
    sourceKind: 'lesson',
    id: evidenceId,
    finishedAt: Date.now(),
    lessonId: sourceLesson.id,
    contentVersion: sourceLesson.contentVersion,
    progress: {
      lessonId: sourceLesson.id,
      contentVersion: sourceLesson.contentVersion,
      passed: true,
      eligibleCorrect: 1,
      total: 1,
    },
  };
  expect(
    (
      await raw('/rest/v1/learning_events', {
        admin: true,
        body: {
          user_id: a.id,
          client_id: evidenceId,
          event: retained,
        },
      })
    ).status,
    201,
    'Bestätigte private Lernzusammenfassung angelegt',
  );
  const ownLearning = await call('/rest/v1/rpc/tutor_learner_snapshot', {
    admin: true,
    body: { actor: a.id },
  });
  expect(
    ownLearning.data.passed,
    [{ lessonId: sourceLesson.id, contentVersion: sourceLesson.contentVersion }],
    'Tutor erhält nur verdichtete Lernnachweise',
  );
  expect(
    (
      await call('/rest/v1/rpc/tutor_learner_snapshot', {
        admin: true,
        body: { actor: b.id },
      })
    ).data.passed,
    [],
    'Anderes Konto hat getrennten Lernstand',
  );
  expect(
    (
      await call('/rest/v1/rpc/tutor_learner_snapshot', {
        token: a.token,
        body: { actor: b.id },
      })
    ).status,
    403,
    'Kontotoken darf fremde Tutor-Projektion nicht aufrufen',
  );
  const ready = await call(endpoint, { token: a.token, method: 'GET' });
  expect(
    ready.headers.get('X-Harmonia-Tutor-Simulation'),
    'true',
    'Test verweigert echten Anthropic-Transport',
  );
  original = (await table('tutor_policy', { admin: true })).data[0];
  expect(
    original.policy.enabled,
    false,
    'Bestehende aktive Tutor-Konfiguration wird nicht ersetzt',
  );
  expect((await send(a.token, payload())).status, 503, 'Tutor bleibt ohne Freigabe deaktiviert');
  expect((await call(endpoint, { method: 'OPTIONS' })).status, 204, 'SSE-CORS');
  expect((await call(endpoint, { token: a.token, method: 'PUT' })).status, 405, 'Methodengrenze');
  await configure({});
  expect((await send(a.token, payload())).data.error, 'subscription', 'Kein freier Premium-Tutor');
  expect((await send(status.ANON_KEY, payload())).status, 401, 'Gast erhält keinen Kontotutor');
  await grant(a);
  await grant(b, 'max');
  const first = payload(),
    answer = await send(a.token, first);
  expect(answer.status, 200, 'SDK-SSE über echte Edge Function');
  expect(
    answer.headers.get('Cache-Control'),
    'no-store',
    'Privates SSE wird nicht zwischengespeichert',
  );
  expect(answer.events[0].simulation, true, 'Simulation ausdrücklich ausgewiesen');
  expect(
    answer.events.filter((e) => e.type === 'tool').length,
    4,
    'Vier echte Engine-Werkzeugaufrufe',
  );
  expect(
    answer.events.filter((e) => e.type === 'example').length,
    1,
    'Nur geprüftes Notenbeispiel',
  );
  expect(answer.events.at(-1).status, 'complete', 'Abschluss nach gespeichertem Verlauf');
  expect(
    answer.events.find((e) => e.type === 'usage').usage.costNanoUsd,
    5_950_000,
    'Zwei Runden mit künstlichem Tarif exakt gebucht',
  );
  expect((await usage(a)).requests, 1, 'Ein bezahlter API-Dialog');
  const ownStatus = await call(endpoint + '?view=status', { token: a.token, method: 'GET' });
  expect(
    tutorAccountSchema.safeParse(ownStatus.data).success,
    true,
    'App-Vertrag liest PostgreSQL-Zeitoffset und Kontingent',
  );
  expect(ownStatus.data.tier, 'premium', 'Kontingent verwendet Server-Abo');
  expect(ownStatus.data.requestsUsed, 1, 'Kontingent enthält eigene Zulassungen');
  expect(ownStatus.data.requestsRemaining, 199, 'Verbleibendes Kontingent');
  expect(ownStatus.data.availability, 'available', 'Nächste Anfrage innerhalb aller Grenzen');
  expect(ownStatus.data.day, new Date().toISOString().slice(0, 10), 'Server-UTC statt Gerätezeit');
  expect('globalCost' in ownStatus.data, false, 'Keine globalen Nutzungsdaten im Client');

  const replay = await send(a.token, first);
  expect(replay.events[0].type, 'replay', 'Identische Anfrage liefert gespeichertes Ergebnis');
  expect((await usage(a)).requests, 1, 'Retry belastet keine weiteren Token/Kontingente');
  expect(
    (await send(a.token, { ...first, message: 'anders' })).status,
    409,
    'Geänderte Anfrage mit gleicher ID',
  );
  const listA = await call(endpoint, { token: a.token, method: 'GET' }),
    listB = await call(endpoint, { token: b.token, method: 'GET' });
  expect(listA.data.conversations.length, 1, 'Eigener Verlauf');
  expect(listB.data.conversations.length, 0, 'Konto-Isolation');
  expect(
    (
      await call(`${endpoint}?conversationId=${first.conversationId}`, {
        token: b.token,
        method: 'GET',
      })
    ).status,
    404,
    'Fremder Verlauf bleibt verborgen',
  );
  expect(
    (
      await call(`${endpoint}?conversationId=${first.conversationId}`, {
        token: b.token,
        method: 'DELETE',
      })
    ).status,
    404,
    'Fremdes Löschen bleibt verborgen',
  );
  const history = await call(`${endpoint}?conversationId=${first.conversationId}`, {
    token: a.token,
    method: 'GET',
  });
  expect(history.data.messages.length, 2, 'Benutzer und Tutor gespeichert');
  const tail = await call(`${endpoint}?conversationId=${first.conversationId}&tail=true`, {
    token: a.token,
    method: 'GET',
  });
  expect(
    tail.data.messages.map((m) => m.id),
    history.data.messages.map((m) => m.id),
    'Neueste Verlaufseite chronologisch',
  );
  expect(tail.data.older, null, 'Kein alter Cursor bei kurzem Verlauf');
  expect(
    tail.data.messages.at(-1).content.simulation,
    true,
    'Gespeicherte Antwort kennzeichnet Simulation',
  );
  const report = {
    id: randomUUID(),
    conversationId: first.conversationId,
    messageId: history.data.messages.at(-1).id,
    category: 'incorrect',
    message: 'Kontakt test@example.invalid ist hier unnötig.',
  };
  const reportEndpoint = endpoint + '?view=report';
  expect(
    (await call(reportEndpoint, { token: a.token, body: report })).data.accepted,
    report.id,
    'KI-Antwortmeldung bestätigt',
  );
  expect(
    (await call(reportEndpoint, { token: a.token, body: report })).data.accepted,
    report.id,
    'Gleiche Meldung idempotent',
  );
  expect(
    (await call(reportEndpoint, { token: a.token, body: { ...report, message: 'anders' } })).status,
    409,
    'Geänderte Meldungs-ID zurückgewiesen',
  );
  expect(
    (await call(reportEndpoint, { token: b.token, body: { ...report, id: randomUUID() } })).status,
    404,
    'Fremde Antwort nicht meldbar',
  );
  expect(
    (
      await call(reportEndpoint, {
        token: a.token,
        body: { ...report, id: randomUUID(), messageId: history.data.messages[0].id },
      })
    ).status,
    404,
    'Frage ist keine KI-Antwort',
  );
  expect(
    (await call(reportEndpoint, { body: report })).status,
    401,
    'Keine Gastmeldung einer KI-Antwort',
  );
  expect(
    (
      await call(reportEndpoint, {
        token: a.token,
        body: { ...report, id: randomUUID(), actor: b.id },
      })
    ).status,
    400,
    'Kein Client-Actor',
  );
  const reports = (await table('tutor_reports', { token: a.token })).data;
  expect(reports.length, 1, 'Meldung ohne Duplikat gespeichert');
  expect(reports[0].message.includes('test@example.invalid'), false, 'Keine E-Mail im Berichttext');
  expect(
    (await table('tutor_reports', { token: b.token })).data.length,
    0,
    'Meldungen kontogetrennt',
  );
  const snapshotConversation = randomUUID();
  expect(
    (
      await raw('/rest/v1/tutor_conversations', {
        admin: true,
        body: {
          id: snapshotConversation,
          user_id: b.id,
          context: { locale: 'de', noteNaming: 'de', mode: 'chat', hintLevel: null, context: null },
          context_hash: 'a'.repeat(64),
        },
      })
    ).status,
    201,
    'Eigene separate Pagination-Testdaten',
  );
  const pageRows = Array.from({ length: 112 }, (_, n) => ({
    conversation_id: snapshotConversation,
    role: n % 2 ? 'assistant' : 'user',
    content:
      n % 2
        ? {
            text: 'Simulierte Pagination-Antwort ' + n,
            examples: [],
            errors: [],
            status: 'complete',
            simulation: true,
          }
        : { text: 'Pagination-Frage ' + n },
  }));
  expect(
    (await raw('/rest/v1/tutor_messages', { admin: true, body: pageRows })).status,
    201,
    'Mehr als 100 Verlaufseinträge für echte Cursorprüfung',
  );
  const recent = await call(`${endpoint}?conversationId=${snapshotConversation}&tail=true`, {
    token: b.token,
    method: 'GET',
  });
  expect(recent.data.messages.length, 100, 'Neueste Seite begrenzt');
  expect(
    recent.data.messages.at(-1).content.text,
    'Simulierte Pagination-Antwort 111',
    'Letzte Antwort sofort sichtbar',
  );
  const previous = await call(
    `${endpoint}?conversationId=${snapshotConversation}&tail=true&beforeMessage=${recent.data.older}`,
    { token: b.token, method: 'GET' },
  );
  expect(previous.data.messages.length, 12, 'Ältere Seite vollständig');
  expect(
    new Set([...previous.data.messages, ...recent.data.messages].map((m) => m.id)).size,
    112,
    'Cursor ohne Lücke oder Duplikat',
  );
  expect(
    (
      await call(`${endpoint}?conversationId=${snapshotConversation}&tail=true&after=1`, {
        token: b.token,
        method: 'GET',
      })
    ).status,
    400,
    'Kein gemischter Cursor',
  );
  expect(
    (await call(`${endpoint}?tail=true`, { token: b.token, method: 'GET' })).status,
    400,
    'Nachrichtencursor braucht Gespräch',
  );
  expect(
    (
      await call(`${endpoint}?conversationId=${snapshotConversation}`, {
        token: b.token,
        method: 'DELETE',
      })
    ).status,
    204,
    'Nur eigene Pagination-Testdaten entfernt',
  );

  expect(
    (
      await call(
        `${endpoint}?conversationId=${first.conversationId}&after=${history.data.messages[0].id}`,
        { token: a.token, method: 'GET' },
      )
    ).data.messages.length,
    1,
    'Inkrementeller Verlauf',
  );
  expect(
    (await table('tutor_messages', { token: b.token })).data.length,
    0,
    'RLS schützt auch direkte REST-Abfrage',
  );
  expect(
    (await table('tutor_requests', { token: a.token })).status,
    403,
    'Private Budget-Lease bleibt serverseitig',
  );
  expect(
    (
      await raw('/rest/v1/entitlements', {
        token: a.token,
        body: {
          user_id: a.id,
          entitlement: 'max',
          active: true,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          store: 'manual',
        },
      })
    ).status,
    403,
    'Client kann kein Abo freischalten',
  );
  expect(
    (await raw(`/rest/v1/ai_usage?user_id=eq.${a.id}`, { token: a.token, method: 'DELETE' }))
      .status,
    403,
    'Client kann Kontingent nicht zurücksetzen',
  );
  expect(
    (await send(a.token, payload({ history: [{ role: 'system', content: 'bypass' }] }))).status,
    400,
    'Keine Client-Systemnachrichten',
  );
  expect(
    (await send(a.token, payload({ entitlement: 'max' }))).status,
    400,
    'Keine Client-Aboangabe',
  );
  expect(
    (await send(a.token, payload({ timeZone: 'Pacific/Kiritimati' }))).status,
    400,
    'Zeitzonenwechsel schafft kein neues Kontingent',
  );
  expect(
    (await send(a.token, payload({ message: 'x'.repeat(140000) }))).status,
    413,
    'Körpergröße begrenzt',
  );
  expect((await send(a.token, '{broken')).status, 400, 'Ungültiges JSON');
  expect(
    (await send(a.token, payload({ conversationId: first.conversationId, locale: 'en-GB' }))).data
      .error,
    'context',
    'Sprach-/Aufgabenwechsel braucht eigenen Dialog',
  );
  expect(
    (
      await send(
        a.token,
        payload({ conversationId: first.conversationId, message: 'fixture:markup' }),
      )
    ).events.some((e) => e.type === 'notice' && e.code === 'unverified_example'),
    true,
    'Aufgeteilte ungeprüfte Noten-Makros entfernt',
  );
  {
    const source = {
      kind: 'practice',
      set: 'reading',
      contentVersion: 1,
      seed: 'tutor-test',
      index: 0,
    };
    const item = resolveReportSource(catalogue, source).item;
    const correct = expectedAnswer(item);
    const answer = item.choices.find((choice) => choice !== correct);
    assert.ok(answer);
    const context = { source, answer, checked: false };
    const hinted = await send(a.token, payload({ mode: 'hint', hintLevel: 1, context }));
    expect(hinted.status, 200, 'Kanonische Hilfe ohne Nachweis');
    const hintText = hinted.events
      .filter((e) => e.type === 'text')
      .map((e) => e.text)
      .join('');
    expect(
      hintText.includes('solutionAllowed\\":false'),
      true,
      'Hinweis-Kontext enthält keine Lösung',
    );
    const beforeAttempt = await usage(a);
    for (const mode of ['explain', 'solution']) {
      for (const checked of [false, true]) {
        const unverified = payload({ mode, context: { ...context, checked } });
        const denied = await send(a.token, unverified);
        expect(denied.status, 409, 'Ohne Servernachweis gesperrt');
        expect(denied.data.error, 'attempt_required', 'Clientflag ist kein Versuchsnachweis');
        expect(
          (await table(`tutor_requests?id=eq.${unverified.id}`, { admin: true })).data.length,
          0,
          'Keine Reservierung für ungeprüfte Anfrage',
        );
      }
    }
    expect(
      (await call(endpoint + '?view=attempt', { body: { source, answer } })).status,
      401,
      'Nachweis nur nach Anmeldung',
    );
    const graded = await call(endpoint + '?view=attempt', {
      token: a.token,
      body: { source, answer },
    });
    expect(graded.status, 200, 'Gültige falsche Antwort serverseitig gewertet');
    const proof = tutorAttemptResponseSchema.parse(graded.data).proof;
    expect(Object.keys(graded.data), ['proof'], 'Keine Lösung oder Rohantwort im Nachweis');
    expect(graded.headers.get('Cache-Control'), 'no-store', 'Nachweise nicht zwischenspeichern');
    expect(
      await usage(a),
      beforeAttempt,
      'Weder Ablehnungen noch Nachweisausgabe verbrauchen Modellkontingent',
    );
    for (const [body, expectedStatus] of [
      [{ source, answer: 'untrusted-wrong' }, 422],
      [{ source: { ...source, contentVersion: 999 }, answer }, 400],
    ])
      expect(
        (await call(endpoint + '?view=attempt', { token: a.token, body })).status,
        expectedStatus,
        'Kein Nachweis für ungültige Antwort oder Quelle',
      );
    expect(
      (
        await call(endpoint + '?view=attempt', {
          token: a.token,
          body: { source, answer, correct: true },
        })
      ).status,
      400,
      'Keine fertigen Clientwertungen',
    );
    const protectedRequest = payload({ mode: 'explain', context, attemptProof: proof });
    for (const [token, changed] of [
      [b.token, protectedRequest],
      [a.token, { ...protectedRequest, context: { ...context, answer: correct } }],
      [a.token, { ...protectedRequest, context: { ...context, source: { ...source, index: 1 } } }],
      [a.token, { ...protectedRequest, attemptProof: { ...proof, signature: '0'.repeat(64) } }],
    ]) {
      const denied = await send(token, changed);
      expect(denied.status, 409, 'Fremder oder veränderter Nachweis gesperrt');
      expect(denied.data.error, 'attempt_invalid', 'Bindung an Konto, Quelle und Antwort');
    }
    const expired = await issueTutorAttempt(
      catalogue,
      a.id,
      { source, answer },
      status.SERVICE_ROLE_KEY,
      Date.now() - TUTOR_ATTEMPT_TTL_MS - 1000,
    );
    expect(
      (await send(a.token, { ...protectedRequest, attemptProof: expired })).data.error,
      'attempt_expired',
      'Abgelaufener Nachweis vor Modellaufruf gesperrt',
    );
    const explained = await send(a.token, protectedRequest);
    expect(explained.status, 200, 'Erklärung nach serverseitiger Wertung');
    expect(
      JSON.stringify(explained.events).includes(proof.signature),
      false,
      'Kein Nachweis im Modellkontext oder Stream',
    );
    const savedScope = (
      await table(`tutor_conversations?id=eq.${protectedRequest.conversationId}`, { admin: true })
    ).data[0].context;
    expect('attemptProof' in savedScope, false, 'Gesprächskontext speichert keine Nachweise');
    expect(
      explained.events
        .filter((e) => e.type === 'text')
        .map((e) => e.text)
        .join('')
        .includes('correct\\":false'),
      true,
      'Falsche Antwort bleibt falsch',
    );
    expect(
      (await send(a.token, protectedRequest)).events[0].type,
      'replay',
      'Geprüfte Anfrage identisch wiederholbar',
    );
    expect(
      (await send(a.token, payload({ mode: 'solution', context, attemptProof: proof }))).status,
      200,
      'Lösungsmodus erst mit passendem Versuchsnachweis',
    );
    const lesson = catalogue.lessons[0];
    const lessonSource = {
      kind: 'lesson',
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      seed: 'test',
      round: 'initial',
      index: 0,
    };
    const lessonAnswer = expectedAnswer(resolveReportSource(catalogue, lessonSource).item);
    const lessonReceipt = await call(endpoint + '?view=attempt', {
      token: a.token,
      body: { source: lessonSource, answer: lessonAnswer },
    });
    expect(
      lessonReceipt.status,
      process.argv.includes('--published') ? 422 : 200,
      'Entwürfe ausschließlich in lokaler Vorschau',
    );
    if (lessonReceipt.status === 200) {
      expect(
        (
          await send(
            a.token,
            payload({
              mode: 'solution',
              context: { source: lessonSource, answer: lessonAnswer, checked: true },
              attemptProof: lessonReceipt.data.proof,
            }),
          )
        ).status,
        200,
        'Geprüfte Entwurfsaufgabe nur lokal',
      );
    } else {
      const previewProof = await issueTutorAttempt(
        catalogue,
        a.id,
        { source: lessonSource, answer: lessonAnswer },
        status.SERVICE_ROLE_KEY,
      );
      expect(
        (
          await send(
            a.token,
            payload({
              mode: 'solution',
              context: { source: lessonSource, answer: lessonAnswer, checked: true },
              attemptProof: previewProof,
            }),
          )
        ).status,
        422,
        'Auch signierter Vorschauversuch umgeht öffentlichen Inhaltsfilter nicht',
      );
    }
    expect(
      (
        await call(endpoint + '?view=attempt', {
          token: a.token,
          body: { source: { ...lessonSource, contentVersion: 999 }, answer: lessonAnswer },
        })
      ).status,
      422,
      'Veralteter Inhalt wird vor Nachweisausgabe zurückgewiesen',
    );
  }
  const simultaneous = payload({ message: 'kurze Frage' });
  const duplicates = await Promise.all(
    Array.from({ length: 4 }, () => send(a.token, simultaneous)),
  );
  expect(
    duplicates.every((r) => r.status === 200 || (r.status === 409 && r.data.error === 'busy')),
    true,
    'Konkurrierende identische Anfragen werden serialisiert',
  );
  expect(
    (await table(`tutor_requests?id=eq.${simultaneous.id}`, { admin: true })).data.length,
    1,
    'Nur eine reservierte Anfrage',
  );
  const countBefore = (await usage(a)).requests;
  const refusing = await send(a.token, payload({ message: 'fixture:refusal' }));
  expect(refusing.events.at(-1).status, 'refused', 'Refusal als klarer Endzustand');
  const failure = await send(a.token, payload({ message: 'fixture:error' }));
  expect(failure.events.at(-1).status, 'failed', 'Providerfehler als Endzustand');
  expect(
    failure.events.find((e) => e.type === 'usage').usage.estimated,
    true,
    'Unbekannter Verbrauch als Schätzung markiert',
  );
  expect(
    (await usage(a)).requests,
    countBefore + 2,
    'Refusal und unbekannter Fehler umgehen Kontingente nicht',
  );
  const abort = new AbortController(),
    active = payload({ message: 'fixture:timeout' });
  const streaming = await raw(endpoint, { token: a.token, body: active, signal: abort.signal });
  expect(streaming.status, 200, 'Laufender Stream gestartet');
  expect(
    (await send(a.token, payload({ message: 'weitere Frage' }))).data.error,
    'busy',
    'Parallele neue Anfrage während laufender API blockiert',
  );
  abort.abort();
  const stopped = await waitFinished(active.id);
  expect(stopped.usage.estimated, true, 'Abbruch/Timeout reserviert unbekannten Verbrauch');
  const erased = payload({ message: 'fixture:timeout' });
  const eraseStream = await raw(endpoint, { token: a.token, body: erased });
  expect(eraseStream.status, 200, 'Stream für Löschrennen gestartet');
  expect(
    (
      await call(`${endpoint}?conversationId=${erased.conversationId}`, {
        token: a.token,
        method: 'DELETE',
      })
    ).status,
    204,
    'Löschen während Modellanfrage',
  );
  await eraseStream.text();
  const erasedRow = await waitFinished(erased.id);
  expect(erasedRow.conversation_id, null, 'Abschluss erzeugt gelöschten Verlauf nicht neu');
  expect(erasedRow.result, null, 'Keine gespeicherte Kopie einer gelöschten Antwort');
  expect((await send(a.token, erased)).status, 410, 'Gelöschte laufende Anfrage bleibt gelöscht');
  const emailQuestion = payload({
    message: 'Meine Adresse test@example.invalid gehört nicht zur Musikfrage.',
  });
  expect((await send(a.token, emailQuestion)).status, 200, 'Frage mit Kontaktdaten');
  const emailHistory = await call(`${endpoint}?conversationId=${emailQuestion.conversationId}`, {
    token: a.token,
    method: 'GET',
  });
  expect(
    emailHistory.data.messages[0].content.text.includes('test@example.invalid'),
    false,
    'Keine E-Mail im gespeicherten Modellverlauf',
  );
  const stats = await usage(a);
  await configure({ premium: { ...policy.premium, requests: stats.requests } });
  expect((await send(a.token, payload())).data.error, 'quota', 'Tageskontingent serverseitig');
  await configure({ requestsPerMinute: 1 });
  expect((await send(a.token, payload())).data.error, 'rate', 'Minutenlimit serverseitig');
  await configure({ premium: { ...policy.premium, costNanoUsd: stats.cost_nano_usd } });
  expect((await send(a.token, payload())).data.error, 'budget', 'Kostenlimit pro Konto');
  await configure({ globalDailyCostNanoUsd: stats.cost_nano_usd });
  expect((await send(b.token, payload())).data.error, 'budget', 'Globale Budgetreservierung');
  await configure({});
  expect(
    (
      await raw(`/rest/v1/entitlements?user_id=eq.${a.id}`, {
        admin: true,
        method: 'PATCH',
        body: { expires_at: new Date(Date.now() - 1000).toISOString() },
      })
    ).status,
    204,
    'Aboablauf im Test',
  );
  expect((await send(a.token, payload())).status, 403, 'Abgelaufenes Abo wird neu geprüft');
  expect(
    (await send(a.token, first)).events[0].type,
    'replay',
    'Alter bezahlter Dialog bleibt bei Aboablauf verfügbar',
  );
  await configure({ enabled: false });
  expect((await send(b.token, payload())).status, 503, 'Kill-Switch stoppt neue Anfragen');
  expect(
    (await send(a.token, first)).events[0].type,
    'replay',
    'Kill-Switch löscht keinen Verlauf',
  );
  await configure({});
  expect(
    (
      await raw(`/rest/v1/entitlements?user_id=eq.${a.id}`, {
        admin: true,
        method: 'PATCH',
        body: { expires_at: new Date(Date.now() + 86400000).toISOString() },
      })
    ).status,
    204,
    'Test-Abo erneuert',
  );
  for (let n = 0; n < 21; n++)
    expect(
      (await send(b.token, payload({ message: 'kurze Frage' }))).status,
      200,
      'Neuer Dialog für Pagination',
    );
  const page = await call(endpoint, { token: b.token, method: 'GET' });
  expect(page.data.conversations.length, 20, 'Verlaufseite begrenzt');
  assert.ok(page.data.next);
  checks++;
  const more = await call(`${endpoint}?before=${page.data.next}`, {
    token: b.token,
    method: 'GET',
  });
  expect(more.data.conversations.length, 1, 'Stabiler Gesprächscursor');
  const beforeDelete = (await usage(a)).requests;
  expect(
    (
      await call(`${endpoint}?conversationId=${first.conversationId}`, {
        token: a.token,
        method: 'DELETE',
      })
    ).status,
    204,
    'Eigener Verlauf gelöscht',
  );
  expect(
    (await send(a.token, first)).status,
    410,
    'Replay stellt gelöschten Text nicht wieder her',
  );
  expect(
    (await usage(a)).requests,
    beforeDelete,
    'Gesprächslöschung setzt Kontingente nicht zurück',
  );
  const ledger = (await table(`tutor_requests?id=eq.${first.id}`, { admin: true })).data[0];
  expect(ledger.result, null, 'Cache gelöscht');
  expect(
    (await table(`tutor_reports?conversation_id=eq.${first.conversationId}`, { admin: true })).data
      .length,
    0,
    'Gesprächslöschung entfernt alle Antwortmeldungen',
  );
  expect(ledger.user_text, '', 'Keine verbliebene Kopie der Frage');
  expect(
    (await table(`ai_usage?user_id=eq.${a.id}`, { token: b.token })).data.length,
    0,
    'Nutzungsdaten sind kontogetrennt',
  );
} finally {
  if (original)
    expect(
      (
        await raw('/rest/v1/tutor_policy?id=eq.true', {
          admin: true,
          method: 'PATCH',
          body: { policy: original.policy },
        })
      ).status,
      204,
      'Vorherige lokale Konfiguration wiederhergestellt',
    );
  for (const user of users)
    await raw(`/auth/v1/admin/users/${user.id}`, { admin: true, method: 'DELETE' });
  for (const user of users) {
    expect(
      (await table(`tutor_requests?user_id=eq.${user.id}`, { admin: true })).data.length,
      0,
      'Kontolöschung entfernt Reservierungen',
    );
    expect(
      (await table(`ai_usage?user_id=eq.${user.id}`, { admin: true })).data.length,
      0,
      'Kontolöschung entfernt Nutzung',
    );
  }
}

console.log(`${checks} lokale Tutor-API-Prüfungen bestanden; SDK-Transport und Preise simuliert.`);
