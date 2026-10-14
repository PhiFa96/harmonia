// Deno-Probe der tatsächlichen Tutor-Laufzeit mit wiedergegebenen Batch-Nachrichten. Kein Modellzugriff.
import { runTutor } from '../supabase/functions/_shared/tutor-runtime.ts';
import {
  DEFAULT_TUTOR_POLICY,
  tutorPolicySchema,
  EMPTY_TUTOR_USAGE,
  tutorExampleSchema,
} from '../packages/content/src/index.ts';
import type { TutorRequest, KnowledgeBundle } from '../packages/content/src/index.ts';
import { currentKnowledgeSnapshot } from '../supabase/functions/_shared/knowledge.ts';
import { ReplayBatchProvider, automaticChecks, outcome } from './tutor-benchmark/replay.ts';
import { buildBenchmarkCatalogue } from './tutor-benchmark/catalogue.ts';
import { configSchema, LOCALES } from './tutor-benchmark/schema.ts';
import type { CacheEntry, BenchmarkVariant } from './tutor-benchmark/schema.ts';
import rawConfig from './tutor-benchmark/config.example.json' with { type: 'json' };
const config = configSchema.parse(rawConfig),
  c = buildBenchmarkCatalogue().cases.find((c) => c.id === 'interval_02');
if (!c) throw Error('Testfall fehlt');
let checks = 0;
const check = (value: unknown, label: string) => {
  if (!value) throw Error(label);
  checks++;
};
const variant = config.variants[0];
if (!variant) throw Error('Variante fehlt');
const usage = {
  input_tokens: 100,
  output_tokens: 20,
  cache_creation_input_tokens: 300,
  cache_read_input_tokens: 200,
  cache_creation: { ephemeral_5m_input_tokens: 300, ephemeral_1h_input_tokens: 0 },
  server_tool_use: null,
  service_tier: 'standard',
  inference_geo: null,
  output_tokens_details: null,
};
const policy = tutorPolicySchema.parse({
  ...DEFAULT_TUTOR_POLICY,
  ...config.limits,
  enabled: true,
  model: variant.model,
  tariff: config.batchTariff,
});
const snapshot = await currentKnowledgeSnapshot('preview');
for (const locale of LOCALES) {
  const chunk = snapshot.chunks.find((c) => c.locale === locale);
  if (!chunk) throw Error('Quelle fehlt');
  const knowledge: KnowledgeBundle = {
    state: 'ready',
    snapshot: snapshot.digest,
    lane: 'preview',
    chunks: [chunk],
  };
  const request: TutorRequest = {
      id: '00000000-0000-4000-8000-000000000001',
      conversationId: '00000000-0000-4000-8000-000000000002',
      ...c.scope,
      locale,
      noteNaming: locale === 'de' ? 'de' : 'intl',
      message: c.questions[locale],
    },
    cache: Record<string, CacheEntry> = {};
  const run = async (selected: BenchmarkVariant = variant) => {
    const provider = new ReplayBatchProvider(
      'episode-' + locale,
      selected,
      locale,
      policy,
      config.streamTariff,
      cache,
    );
    const result = await runTutor({
      provider,
      request,
      policy,
      context: { available: false },
      history: [],
      knowledge,
      signal: new AbortController().signal,
      emit: (e) => {
        if (e.type === 'tool') provider.markTool(e.id, e.ok);
      },
    });
    return { provider, result };
  };
  const first = await run(),
    pending = first.provider.pending;
  check(
    pending && first.result.result.status === 'failed',
    'Fehlender erster Schritt ist geplant, nicht als Antwort gewertet',
  );
  check(first.provider.batchUsage.costNanoUsd === 0, 'Planen bucht keine gemessenen Modellkosten');
  if (!pending) throw Error('Pending');
  cache[pending.id] = {
    type: 'succeeded',
    message: {
      id: 'msg_fixture_tools',
      role: 'assistant',
      type: 'message',
      model: variant.model,
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage,
      content: [
        {
          type: 'tool_use',
          id: 'first',
          name: 'analyze_interval',
          input: { from: 'C4', to: 'Fb4' },
        },
        {
          type: 'tool_use',
          id: 'example',
          name: 'render_example',
          input: { source: 'treble | 4/4 | C4/4 Fb4/4 r/2', bpm: 120 },
        },
      ],
    },
  };
  const second = await run(),
    follow = second.provider.pending;
  check(
    follow && follow.id !== pending.id,
    'Werkzeugresultate erzeugen eine eigene folgende Batch-Runde',
  );
  check(
    second.provider.calls.length === 2 && second.provider.calls.every((c) => c.ok),
    'Tatsächliche Engine-Werkzeuge nach Quittung ausgeführt',
  );
  check(second.provider.rounds === 1, 'Quittierte Runde genau einmal gezählt');
  if (!follow) throw Error('Followup');
  const quote = Array.from(chunk.body).slice(0, 80).join('');
  cache[follow.id] = {
    type: 'succeeded',
    message: {
      id: 'msg_fixture_answer',
      role: 'assistant',
      type: 'message',
      model: variant.model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage,
      content: [
        {
          type: 'text',
          text: 'Simulierte Batch-Antwort. / Simulated batch answer.',
          citations: [
            {
              type: 'char_location',
              document_index: 0,
              document_title: 'ignored title',
              file_id: null,
              start_char_index: 0,
              end_char_index: Array.from(quote).length,
              cited_text: quote,
            },
          ],
        },
      ],
    },
  };
  const final = await run();
  check(
    final.provider.pending === null && final.result.result.status === 'complete',
    'Dialog nach Batch-Folgerunde abgeschlossen',
  );
  check(final.provider.rounds === 2, 'Beide Runden genau einmal gezählt');
  check(
    final.provider.batchUsage.costNanoUsd === 4_680_000,
    'Beide SDK-Nutzungsbelege mit Batch-Tarif berechnet',
  );
  check(
    final.provider.streamUsage.costNanoUsd === 5_950_000,
    'Streaming-Projektion mit eigenem Tarif statt pauschalem Faktor',
  );
  check(
    tutorExampleSchema.parse(final.result.result.examples[0]).example.bpm === 120,
    'Engine-geprüftes Beispiel und Tempo behalten',
  );
  check(
    final.result.result.citations?.[0]?.quote === quote,
    'Native SDK-Zitatdaten gegen tatsächliche Quelle geprüft',
  );
  check(final.result.result.citations?.[0]?.locale === locale, 'Quellensprache erhalten');
  const out = await outcome(c, 'episode-' + locale, final.result.result, final.provider, knowledge);
  check(
    Object.values(out.checks).every(Boolean),
    'Automatische Belege für den vollständigen Dialog',
  );
  const wrong = structuredClone(final.provider.calls);
  const call = wrong[0];
  if (!call) throw Error('Tool');
  call.input = { from: 'C4', to: 'E4' };
  check(
    !automaticChecks(c, final.result.result, wrong, knowledge).tools,
    'Ein richtiger Werkzeugname mit falschen Argumenten zählt nicht',
  );
  const forged = structuredClone(final.result.result),
    cite = forged.citations?.[0];
  if (!cite) throw Error('Citation');
  cite.quote = 'x'.repeat(Array.from(cite.quote).length);
  check(
    !automaticChecks(c, forged, final.provider.calls, knowledge).sources,
    'Nachträglich veränderte Quellenbehauptung wird nicht akzeptiert',
  );
  cache[follow.id] = { type: 'expired', reason: 'unit-fixture-only' };
  const expired = await run();
  check(
    expired.provider.batchUsage.estimated && expired.result.result.status === 'failed',
    'Abgelaufene Folgerunde bleibt konservativ und fehlgeschlagen',
  );
}
const tiny = tutorPolicySchema.parse({ ...policy, maxInputTokens: 1024 }),
  empty = new ReplayBatchProvider('tiny', variant, 'de', tiny, config.streamTariff, {});
await runTutor({
  provider: empty,
  request: {
    id: '00000000-0000-4000-8000-000000000001',
    conversationId: '00000000-0000-4000-8000-000000000002',
    ...c.scope,
    message: c.questions.de,
  },
  policy: tiny,
  context: { available: false },
  history: [],
  signal: new AbortController().signal,
  emit: () => {
    /* Nur prüfen, ob vor einem Modellaufruf gestoppt wird. */
  },
});
check(
  empty.pending === null && empty.batchUsage.costNanoUsd === EMPTY_TUTOR_USAGE.costNanoUsd,
  'Zu kleines Eingabebudget plant keine Modellanfrage',
);
console.log(
  `${String(checks)} Batch-/Runtime-/Quellenprüfungen bestanden. Ausschließlich lokale Quittungsfixtures; keine gemessene Modellqualität.`,
);
