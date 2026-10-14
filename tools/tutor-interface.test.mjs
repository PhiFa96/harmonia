import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TutorEventDecoder,
  TutorTransport,
  TutorError,
} from '../apps/mobile/src/tutor/transport.ts';
import { checkedTutorExample } from '../apps/mobile/src/tutor/example.ts';
import { parseScore, scoreTimeline } from '../packages/notation/src/index.ts';
const id = '11111111-1111-4111-8111-111111111111',
  conversationId = '22222222-2222-4222-8222-222222222222';
const request = {
  id,
  conversationId,
  message: 'Eine Frage',
  locale: 'de',
  noteNaming: 'de',
  mode: 'chat',
  hintLevel: null,
  context: null,
};
const meta = {
    type: 'meta',
    id,
    conversationId,
    promptVersion: 2,
    toolVersion: 1,
    simulation: true,
  },
  done = { type: 'done', status: 'complete', replay: false };
const event = (value) => `event: ${value.type}\r\ndata: ${JSON.stringify(value)}\r\n\r\n`;
test('SSE bewahrt UTF-8 bei jeder Bytegrenze, CRLF und Keepalive', () => {
  const expected = [meta, { type: 'text', text: 'H, B♭ und 𝄞: Grüße.' }, done];
  const bytes = new TextEncoder().encode(': keepalive\r\n\r\n' + expected.map(event).join(''));
  for (const size of [1, 2, 3, 7, 31, bytes.length]) {
    const output = [],
      decoder = new TutorEventDecoder((e) => {
        output.push(e);
      });
    for (let at = 0; at < bytes.length; at += size) decoder.push(bytes.slice(at, at + size));
    decoder.push(new Uint8Array(), true);
    assert.deepEqual(output, expected);
  }
});
test('SSE unterstützt mehrzeilige Daten und die letzte Ereignisgrenze am EOF', () => {
  const output = [],
    decoder = new TutorEventDecoder((e) => {
      output.push(e);
    });
  decoder.push(
    new TextEncoder().encode('event: text\ndata: {"type":"text",\ndata: "text":"Viertelnote"}'),
    true,
  );
  assert.deepEqual(output, [{ type: 'text', text: 'Viertelnote' }]);
});
for (const payload of [
  'event: text\ndata: {}\n\n',
  'event: done\ndata: {"type":"text","text":"fake"}\n\n',
  'event: text\ndata: {bad}\n\n',
  'event: command\ndata: {"type":"command","url":"https://evil.invalid"}\n\n',
])
  test('Ungültiger Stream: ' + payload.slice(0, 18), () => {
    assert.throws(
      () => new TutorEventDecoder(() => {}).push(new TextEncoder().encode(payload)),
      TutorError,
    );
  });
test('Sehr große oder ungültig codierte Ereignisse werden begrenzt', () => {
  assert.throws(
    () => new TutorEventDecoder(() => {}).push(new TextEncoder().encode('x'.repeat(262145))),
    TutorError,
  );
  assert.throws(
    () => new TutorEventDecoder(() => {}).push(new Uint8Array([255])),
    /encoded|encoding/i,
  );
});
const response = (values, type = 'text/event-stream') =>
  new Response(values.map(event).join(''), { headers: { 'Content-Type': type } });
const transport = (fetcher) =>
  new TutorTransport(
    () => ({ url: 'https://project.example.invalid', key: 'public-key', token: 'test-token' }),
    fetcher,
  );
test('Transport nutzt die eigene Function und trägt keine Zugangsdaten in die URL', async () => {
  const output = [];
  const client = transport(async (url, init) => {
    assert.equal(url, 'https://project.example.invalid/functions/v1/tutor');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(init.body), request);
    return response([meta, { type: 'text', text: 'Antwort' }, done]);
  });
  await client.stream(request, new AbortController().signal, (e) => {
    output.push(e);
  });
  assert.equal(output.at(-1).type, 'done');
});
for (const [label, values, code] of [
  ['ohne Abschluss', [meta, { type: 'text', text: 'Teil' }], 'interrupted'],
  ['falsche Anfrage', [{ ...meta, id: conversationId }, done], 'protocol'],
  ['Ereignis nach Abschluss', [meta, done, { type: 'text', text: 'late' }], 'protocol'],
  ['ohne Metadaten', [{ type: 'text', text: 'fake' }, done], 'protocol'],
])
  test(label, async () => {
    const client = transport(async () => response(values));
    await assert.rejects(
      client.stream(request, new AbortController().signal, () => {}),
      (error) => error instanceof TutorError && error.code === code,
    );
  });
test('Unvollständiger Stream liefert empfangenen Text, aber keinen Erfolg', async () => {
  const output = [];
  await assert.rejects(
    transport(async () => response([meta, { type: 'text', text: 'Teil' }])).stream(
      request,
      new AbortController().signal,
      (e) => {
        output.push(e);
      },
    ),
  );
  assert.equal(output[1].text, 'Teil');
  assert.equal(
    output.some((e) => e.type === 'done'),
    false,
  );
});
test('JSON statt SSE ist kein erfolgreiches Streaming', async () => {
  await assert.rejects(
    transport(async () => response([meta, done], 'application/json')).stream(
      request,
      new AbortController().signal,
      () => {},
    ),
    (error) => error.code === 'protocol',
  );
});
test('Gleiches Request-ID-Replay liefert die gespeicherte Antwort', async () => {
  const answer = {
    text: 'Gespeichert',
    examples: [],
    errors: [],
    status: 'complete',
    simulation: true,
  };
  const usage = {
    inputTokens: 1,
    outputTokens: 1,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    unknownCacheWriteTokens: 0,
    costNanoUsd: 0,
    estimated: false,
  };
  const output = [];
  await transport(async () =>
    response([
      { type: 'replay', id, conversationId, result: answer, usage },
      { ...done, replay: true },
    ]),
  ).stream(request, new AbortController().signal, (e) => {
    output.push(e);
  });
  assert.deepEqual(output[0].result, answer);
});
test('Quota- und Authfehler erhalten einen passenden Code ohne Rohantwort', async () => {
  for (const [status, code] of [
    [401, 'auth'],
    [429, 'quota'],
    [503, 'unavailable'],
  ]) {
    await assert.rejects(
      transport(
        async () => new Response(JSON.stringify({ error: code, private: 'hidden' }), { status }),
      ).stream(request, new AbortController().signal, () => {}),
      (error) => error.code === code && !error.message.includes('hidden'),
    );
  }
  await assert.rejects(
    transport(async () => new Response(JSON.stringify({ error: 'missing' }), { status: 404 })).json(
      '?conversationId=' + request.conversationId,
    ),
    (error) => error.code === 'deleted',
  );
});
test('Abbruch vor und während der Datenübertragung', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    transport(async (_url, init) => {
      if (init.signal.aborted) throw new Error('aborted');
      return response([meta, done]);
    }).stream(request, controller.signal, () => {}),
    (error) => error.code === 'cancelled',
  );
  const later = new AbortController();
  await assert.rejects(
    transport(async () => response([meta, { type: 'text', text: 'Teil' }, done])).stream(
      request,
      later.signal,
      (e) => {
        if (e.type === 'text') later.abort();
      },
    ),
    (error) => error.code === 'cancelled',
  );
});
const example = (source) => {
  const score = parseScore(source);
  return { source, bpm: 120, score, timeline: scoreTimeline(score, { bpm: 120 }) };
};
test('Beispielnotation und Tempo stammen nachweislich aus derselben Quelle', () => {
  const valid = example('treble | 4/4 | C4/4 D4/4 E4/4 r/4');
  assert.deepEqual(checkedTutorExample(valid), valid.score);
  const jsonb = JSON.parse(
    JSON.stringify(valid, (_key, value) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).reverse())
        : value,
    ),
  );
  assert.deepEqual(
    checkedTutorExample(jsonb),
    valid.score,
    'JSONB-Schlüsselreihenfolge ändert die geprüften Daten nicht',
  );
  assert.throws(() => checkedTutorExample({ ...valid, score: parseScore('treble | 4/4 | G4/1') }));
  assert.throws(() => checkedTutorExample({ ...valid, timeline: { tones: [] } }));
  assert.throws(() => checkedTutorExample({ ...valid, bpm: 60 }));
});
test('Ungültige, zu lange oder nicht spielbare Beispiele werden nicht gerendert', () => {
  for (const source of ['<script>alert(1)</script>', 'treble | 4/4 | C99/1', 'treble | 4/4 | C4/4'])
    assert.throws(() => checkedTutorExample(example(source)));
  assert.throws(() =>
    checkedTutorExample(
      example('treble | 4/4 | ' + Array.from({ length: 9 }, () => 'C4/1').join(' | ')),
    ),
  );
});
