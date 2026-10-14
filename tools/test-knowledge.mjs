// PostgreSQL-Suche und echte lokale Tutor-API. KI-Transport ausdrücklich ersetzt.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { DEFAULT_TUTOR_POLICY } from '../packages/content/src/index.ts';
import { knowledgeQueries } from './knowledge-queries.ts';
import {
  currentKnowledgeSnapshot,
  selectKnowledgeChunks,
} from '../supabase/functions/_shared/knowledge.ts';
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
const publicMode = process.argv.includes('--published');
const lane = publicMode ? 'published' : 'preview';
const snapshots = {
  published: await currentKnowledgeSnapshot('published'),
  preview: await currentKnowledgeSnapshot('preview'),
};
let checks = 0,
  actor = null,
  original = null,
  indexChanged = false;
const equal = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
async function call(path, { admin = false, token, method = 'POST', body } = {}) {
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
  const events = response.headers.get('Content-Type')?.includes('text/event-stream')
    ? text
        .split('\n\n')
        .filter((b) => b.startsWith('event: '))
        .map((b) => JSON.parse(b.split('\ndata: ')[1]))
    : [];
  return {
    status: response.status,
    data: events.length ? null : text ? JSON.parse(text) : null,
    events,
    headers: response.headers,
  };
}
const rpc = (name, body) => call('/rest/v1/rpc/' + name, { admin: true, body });
const search = (question, locale = 'de', snapshot = snapshots.preview.digest, skills = []) =>
  rpc('search_knowledge', {
    target_lane: 'preview',
    expected_snapshot: snapshot,
    language: locale,
    question,
    skills,
  });
const replace = (snapshot) =>
  rpc('replace_knowledge_index', {
    target_lane: snapshot.lane,
    new_snapshot: snapshot.digest,
    version: snapshot.contentVersion,
    article_total: snapshot.articleCount,
    entries: snapshot.chunks,
  });
const rows = async (path, options = {}) =>
  (await call('/rest/v1/' + path, { method: 'GET', ...options })).data;
const endpoint = '/functions/v1/tutor';
const payload = (message, locale = 'de') => ({
  id: randomUUID(),
  conversationId: randomUUID(),
  message,
  locale,
  noteNaming: locale === 'de' ? 'de' : 'intl',
  mode: 'chat',
  hintLevel: null,
  context: null,
});
try {
  if (!process.argv.includes('--search-only')) {
    // Function-Serving lädt auch die lokale Gateway-Konfiguration neu. Vor REST-Proben warten.
    for (let n = 0; n < 60; n++) {
      const ready = await call(endpoint, { method: 'GET' }).catch(() => null);
      if (ready?.status === 401) break;
      if (n === 59) throw new Error('db:serve:learning --tutor-test starten');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  for (const snapshot of Object.values(snapshots)) {
    const existing = await rows('knowledge_indexes?lane=eq.' + snapshot.lane, { admin: true });
    equal(existing[0]?.snapshot, snapshot.digest, 'Explizit synchronisierter Index erwartet');
    equal(existing[0]?.chunk_count, snapshot.chunks.length, 'Vollständiger Index');
    equal((await replace(snapshot)).data, false, 'Identischer Abgleich idempotent');
  }
  const failures = [],
    durations = [];
  for (const locale of ['de', 'en-US', 'en-GB'])
    for (const query of knowledgeQueries) {
      const question =
        locale === 'de' ? query.de : locale === 'en-GB' ? (query.uk ?? query.us) : query.us;
      const started = performance.now(),
        result = await search(question, locale);
      durations.push(performance.now() - started);
      equal(result.status, 200, 'Echte FTS-Abfrage');
      equal(result.data.state, 'ready', 'Aktueller Suchindex');
      const bundle = selectKnowledgeChunks(snapshots.preview, locale, result.data.hits);
      if (!bundle.chunks.some((c) => c.articleId === query.article))
        failures.push({
          locale,
          article: query.article,
          found: [...new Set(bundle.chunks.map((c) => c.articleId))],
        });
    }
  equal(failures, [], 'Alle 29 Themen in DE/US/UK innerhalb des Dokumentbudgets');
  durations.sort((a, b) => a - b);
  console.log(
    `Suchabnahme: 87/87 Themenfragen mit passendem Artikel. Lokale REST-/Postgres-Latenz: Median ${durations[43].toFixed(1)} ms, P95 ${durations[82].toFixed(1)} ms. Kein KI-Qualitätsmaß.`,
  );
  if (process.argv.includes('--search-only')) process.exit(0);
  equal(
    (await search('Galaxienantriebsleistung')).data.hits.length,
    0,
    'Unbekanntes Thema liefert keine Quellen',
  );
  equal((await search('Viertelnoten')).data.hits.length > 0, true, 'Deutsche Flexion');
  equal((await search('crotchets', 'en-GB')).data.hits.length > 0, true, 'Britische Flexion');
  equal((await search('quarter notes', 'en-US')).data.hits.length > 0, true, 'US-Wörter');
  equal(
    (await search('Puls', 'de', '0'.repeat(64))).data.state,
    'stale',
    'Veralteter Snapshot wird nicht vermischt',
  );
  equal((await search('x'.repeat(4001))).status, 400, 'Suchgröße begrenzt');
  equal(
    (await call('/rest/v1/knowledge_chunks?lane=eq.preview', { method: 'GET' })).data,
    [],
    'Gast sieht keine Vorschau',
  );
  equal(
    (await call('/rest/v1/knowledge_indexes?lane=eq.preview', { method: 'GET' })).data,
    [],
    'Gast sieht keinen Vorschauindex',
  );
  equal(
    (
      await call('/rest/v1/rpc/search_knowledge', {
        body: {
          target_lane: 'preview',
          expected_snapshot: snapshots.preview.digest,
          language: 'de',
          question: 'Puls',
        },
      })
    ).status,
    401,
    'Privates Such-RPC nicht für Gäste',
  );
  equal(
    (
      await call('/rest/v1/knowledge_chunks', {
        body: { lane: 'published', id: 'f'.repeat(64), body: 'poisoned' },
      })
    ).status,
    401,
    'Gäste schreiben keine Quellen',
  );
  const invalid = {
    ...snapshots.preview,
    digest: '1'.repeat(64),
    chunks: [{ ...snapshots.preview.chunks[0], body: '' }],
    articleCount: 1,
  };
  equal((await replace(invalid)).status, 400, 'Ungültiger Abgleich abgewiesen');
  equal(
    (await rows('knowledge_indexes?lane=eq.preview', { admin: true }))[0].snapshot,
    snapshots.preview.digest,
    'Fehler ersetzt nichts teilweise',
  );
  const email = `knowledge-${randomUUID()}@example.invalid`,
    password = randomUUID() + randomUUID();
  const created = await call('/auth/v1/admin/users', {
    admin: true,
    body: { email, password, email_confirm: true },
  });
  equal(created.status, 200, 'Testkonto erstellt');
  actor = { id: created.data.id };
  const signed = await call('/auth/v1/token?grant_type=password', { body: { email, password } });
  equal(signed.status, 200, 'Echte Anmeldung');
  actor.token = signed.data.access_token;
  const ready = await call(endpoint, { token: actor.token, method: 'GET' });
  equal(
    ready.headers.get('X-Harmonia-Tutor-Simulation'),
    'true',
    'Echter KI-Transport für Test ausgeschlossen',
  );
  original = (await rows('tutor_policy', { admin: true }))[0].policy;
  equal(original.enabled, false, 'Bestehende aktive Modellbindung nicht verändern');
  const policy = {
    ...DEFAULT_TUTOR_POLICY,
    enabled: true,
    model: 'synthetic-test-model',
    tariff: {
      version: 'synthetic-test-only',
      source: 'https://example.invalid/test-tariff',
      verifiedAt: '2026-10-14T00:00:00Z',
      input: 5000,
      output: 25000,
      cacheRead: 500,
      cacheWrite5m: 6250,
      cacheWrite1h: 10000,
    },
    requestsPerMinute: 60,
    premium: { requests: 200, costNanoUsd: 100_000_000_000 },
    max: { requests: 200, costNanoUsd: 100_000_000_000 },
    globalDailyCostNanoUsd: 200_000_000_000,
  };
  equal(
    (
      await call('/rest/v1/tutor_policy?id=eq.true', {
        admin: true,
        method: 'PATCH',
        body: { policy },
      })
    ).status,
    204,
    'Lokaler Testtarif',
  );
  equal(
    (
      await call('/rest/v1/entitlements', {
        admin: true,
        body: {
          user_id: actor.id,
          entitlement: 'premium',
          active: true,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          store: 'manual',
        },
      })
    ).status,
    201,
    'Temporäres Testabo',
  );
  equal(
    (await call('/rest/v1/knowledge_chunks?lane=eq.preview', { token: actor.token, method: 'GET' }))
      .data,
    [],
    'Konten sehen keine Vorschau über REST',
  );
  equal(
    (
      await call('/rest/v1/rpc/search_knowledge', {
        token: actor.token,
        body: {
          target_lane: 'preview',
          expected_snapshot: snapshots.preview.digest,
          language: 'de',
          question: 'Puls',
        },
      })
    ).status,
    403,
    'Auch Konten dürfen nicht das private RPC nutzen',
  );
  const send = (body) => call(endpoint, { token: actor.token, body });
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const body = payload(
      'fixture:knowledge fixture:tools ' +
        (locale === 'de'
          ? 'Violinschlüssel Notensystem'
          : locale === 'en-US'
            ? 'treble clef staff'
            : 'treble clef stave'),
      locale,
    );
    const response = await send(body);
    equal(response.status, 200, 'Echte Tutor-Edge mit Quellen');
    equal(response.events.at(-1).status, 'complete', 'Werkzeuge und Zitate schließen ab');
    const citation = response.events.find((e) => e.type === 'citation')?.citation;
    equal(Boolean(citation), !publicMode, 'Entwürfe nur im lokalen Tutor');
    if (citation) {
      const chunk = snapshots.preview.chunks.find((c) => c.id === citation.chunkId);
      equal(citation.locale, locale, 'Quelle in Dialogsprache');
      equal(chunk.articleId, citation.articleId, 'Quellen-ID aus Katalog');
      equal(
        Array.from(chunk.body)
          .slice(citation.startChar - chunk.startChar, citation.endChar - chunk.startChar)
          .join(''),
        citation.quote,
        'Originaltext stimmt exakt',
      );
      equal(citation.href.startsWith('/article?'), true, 'Verlinkbare Artikelroute');
      const history = await call(`${endpoint}?conversationId=${body.conversationId}`, {
        token: actor.token,
        method: 'GET',
      });
      equal(
        history.data.messages.at(-1).content.citations,
        [citation],
        'Zitat im privaten Verlauf',
      );
      equal(
        (await send(body)).events[0].result.citations,
        [citation],
        'Idempotentes Replay behält Quelle',
      );
      equal(
        (
          await call(`${endpoint}?conversationId=${body.conversationId}`, {
            token: actor.token,
            method: 'DELETE',
          })
        ).status,
        204,
        'Verlauf samt Quelle gelöscht',
      );
      equal(
        (await rows(`tutor_requests?id=eq.${body.id}`, { admin: true }))[0].result,
        null,
        'Kein verbliebenes Quellen-Backup',
      );
    } else
      equal(
        response.events.some((e) => e.type === 'notice' && e.code === 'no_library_source'),
        true,
        'Öffentliches leeres Register klar markiert',
      );
  }
  if (!publicMode) {
    for (const bad of ['fixture:bad-quote', 'fixture:bad-index']) {
      const response = await send(payload('fixture:knowledge ' + bad + ' Violinschlüssel'));
      equal(
        response.events.some((e) => e.type === 'citation'),
        false,
        'Fehlerhafte Zitate nicht ausliefern',
      );
      equal(
        response.events.some((e) => e.type === 'notice' && e.code === 'invalid_citation'),
        true,
        'Verweigerte Quelle gemeldet',
      );
    }
    const withdrawn = { ...snapshots.preview, digest: '2'.repeat(64), articleCount: 0, chunks: [] };
    equal((await replace(withdrawn)).status, 200, 'Atomarer Artikelrückzug');
    indexChanged = true;
    equal(
      (await search('Violinschlüssel')).data.state,
      'stale',
      'Alte Abschnitte sofort unerreichbar',
    );
    const response = await send(payload('fixture:knowledge Violinschlüssel'));
    equal(
      response.events.some((e) => e.type === 'citation'),
      false,
      'Tutor verwendet keine zurückgezogene Quelle',
    );
    equal(
      response.events.some((e) => e.type === 'notice' && e.code === 'knowledge_unavailable'),
      true,
      'Indexstand stimmt nicht zur Function',
    );
  }
} finally {
  if (indexChanged)
    equal((await replace(snapshots.preview)).status, 200, 'Vorschauindex wiederhergestellt');
  if (original)
    equal(
      (
        await call('/rest/v1/tutor_policy?id=eq.true', {
          admin: true,
          method: 'PATCH',
          body: { policy: original },
        })
      ).status,
      204,
      'Vorheriger deaktivierter Tarif wiederhergestellt',
    );
  if (actor) await call('/auth/v1/admin/users/' + actor.id, { admin: true, method: 'DELETE' });
}
console.log(
  `${checks} lokale Wissensbasis-/Tutor-API-Prüfungen bestanden (${lane}); keine echte KI-Antwort oder Kostenmessung.`,
);
