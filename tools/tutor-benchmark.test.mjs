import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Anthropic from '@anthropic-ai/sdk';
import { buildBenchmarkCatalogue } from './tutor-benchmark/catalogue.ts';
import { catalogueSchema, configSchema, LOCALES } from './tutor-benchmark/schema.ts';
import { fingerprint, canonical } from './tutor-benchmark/hash.ts';
import { automaticChecks } from './tutor-benchmark/replay.ts';
import { evaluateReport, percentile } from './tutor-benchmark/evaluate.ts';
import { validateReceipts, receiptCosts } from './tutor-benchmark/batch.ts';
import {
  planWave,
  withLock,
  writeJson,
  liveBinding,
  batchReader,
  main,
} from './tutor-benchmark.mjs';

const catalogue = buildBenchmarkCatalogue(),
  config = configSchema.parse(
    JSON.parse(
      readFileSync(new URL('./tutor-benchmark/config.example.json', import.meta.url), 'utf8'),
    ),
  );
const rawUsage = {
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
const message = {
  id: 'msg_unit_fixture',
  model: config.variants[0].model,
  role: 'assistant',
  type: 'message',
  content: [{ type: 'text', text: 'Unit fixture, keine echte Modellantwort.', citations: [] }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: rawUsage,
};
const pending = [
  {
    id: 'a'.repeat(64),
    episodeId: 'episode',
    params: {
      model: message.model,
      max_tokens: 128,
      messages: [{ role: 'user', content: 'Unit fixture' }],
    },
    reservationNanoUsd: 1_000_000,
  },
];

test('245 eindeutige eigene Fälle, alle Sprachen/Werkzeuge/Typen und vier Aufgabenrollen', () => {
  assert.equal(catalogue.cases.length, 245);
  assert.equal(new Set(catalogue.cases.map((c) => c.id)).size, 245);
  for (const locale of LOCALES)
    assert.equal(new Set(catalogue.cases.map((c) => c.questions[locale])).size, 245);
  assert.equal(new Set(catalogue.cases.flatMap((c) => c.calls.map((call) => call.name))).size, 8);
  assert.equal(new Set(catalogue.cases.map((c) => c.exerciseType).filter(Boolean)).size, 19);
  for (const type of new Set(catalogue.cases.map((c) => c.exerciseType).filter(Boolean)))
    assert.equal(catalogue.cases.filter((c) => c.exerciseType === type).length, 4);
  assert.ok(catalogue.cases.every((c) => c.status === 'entwurf'));
});
test('Hash ist unabhängig von Objektreihenfolge und bewahrt Arrayreihenfolge', async () => {
  assert.equal(await fingerprint({ b: 2, a: 1 }), await fingerprint({ a: 1, b: 2 }));
  assert.notEqual(await fingerprint([1, 2]), await fingerprint([2, 1]));
  assert.throws(() => canonical(undefined));
});
test('Batch-Quittungen werden über custom_id statt Reihenfolge zugeordnet', () => {
  const second = { ...pending[0], id: 'b'.repeat(64) },
    rows = [
      { custom_id: second.id, result: { type: 'succeeded', message } },
      { custom_id: pending[0].id, result: { type: 'succeeded', message } },
    ];
  assert.equal(
    Object.keys(validateReceipts([...pending, second], rows, () => message.model)).length,
    2,
  );
});
test('Unbekannte, doppelte und fehlende Batch-Quittungen werden zurückgewiesen', () => {
  const row = { custom_id: pending[0].id, result: { type: 'succeeded', message } };
  assert.throws(() => validateReceipts(pending, [], () => message.model), /unvollständig/);
  assert.throws(() => validateReceipts(pending, [row, row], () => message.model), /doppelte/);
  assert.throws(
    () => validateReceipts(pending, [{ ...row, custom_id: 'c'.repeat(64) }], () => message.model),
    /Unbekannte/,
  );
  assert.throws(() => validateReceipts(pending, [row], () => 'other-model'), /Modellquittung/);
});
test('Terminale Fehler und fehlende Cacheaufteilung sind konservativ bepreist', () => {
  const failed = validateReceipts(
    pending,
    [{ custom_id: pending[0].id, result: { type: 'expired' } }],
    () => message.model,
  );
  assert.deepEqual(receiptCosts(pending, failed, config.batchTariff), {
    costNanoUsd: 1_000_000,
    estimated: true,
  });
  const result = validateReceipts(
    pending,
    [
      {
        custom_id: pending[0].id,
        result: {
          type: 'succeeded',
          message: { ...message, usage: { ...rawUsage, cache_creation: null } },
        },
      },
    ],
    () => message.model,
  );
  assert.equal(receiptCosts(pending, result, config.batchTariff).estimated, true);
});
test('Alle fünf Tokenarten werden mit explizitem Batch-Tarif gerechnet', () => {
  const entries = validateReceipts(
    pending,
    [{ custom_id: pending[0].id, result: { type: 'succeeded', message } }],
    () => message.model,
  );
  assert.deepEqual(receiptCosts(pending, entries, config.batchTariff), {
    costNanoUsd: 2_340_000,
    estimated: false,
  });
});
test('Kostenbudget, laufende und unklare Übermittlungen verhindern neue Batch-Wellen', () => {
  const j = { config, budgetNanoUsd: 1_000_000, waves: [] };
  assert.equal(planWave(j, pending).reservationNanoUsd, 1_000_000);
  assert.throws(() => planWave({ ...j, budgetNanoUsd: 999_999 }, pending), /Kostenlimit/);
  const wave = { ...planWave(j, pending), state: 'submitted' };
  assert.throws(() => planWave({ ...j, waves: [wave] }, pending), /offen/);
  assert.throws(
    () => planWave({ ...j, waves: [{ ...wave, state: 'uncertain' }] }, pending),
    /offen/,
  );
  assert.throws(() => planWave(j, [...pending, ...pending]), /Doppelte/);
});
test('Geschätzte Kosten und maximal erlaubte Runden bleiben im Budget', () => {
  const wave = {
    ...planWave({ config, budgetNanoUsd: 2_000_000, waves: [] }, pending),
    state: 'ended',
    costNanoUsd: null,
    estimated: true,
  };
  assert.throws(
    () => planWave({ config, budgetNanoUsd: 1_999_999, waves: [wave] }, pending),
    /Kostenlimit/,
  );
  assert.throws(
    () =>
      planWave(
        {
          config,
          budgetNanoUsd: 1e10,
          waves: Array.from({ length: config.limits.maxRounds }, () => wave),
        },
        pending,
      ),
    /Rundenzahl/,
  );
});
test('Eigene Laufdateien werden nicht überschrieben und parallele Prozesse gesperrt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-benchmark-test-')),
    path = join(dir, 'run.json');
  try {
    writeJson(path, { own: true }, true);
    assert.throws(() => writeJson(path, { own: false }, true), /EEXIST/);
    let release;
    const first = withLock(
      path,
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    await assert.rejects(
      withLock(path, async () => {
        await Promise.resolve();
      }),
      /gesperrt/,
    );
    release();
    await first;
    assert.equal(existsSync(path + '.lock'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('Fehlende sichere Bindung stoppt vor jedem API-Aufruf', () => {
  const old = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    assert.throws(() => liveBinding(config), /Kein API-Aufruf/);
  } finally {
    if (old !== undefined) process.env.ANTHROPIC_API_KEY = old;
  }
});
test('Unbekannte und doppelte CLI-Optionen ändern kein Kostenlimit stillschweigend', async () => {
  await assert.rejects(main(['prepare', '--unknown-option']), /Unbekanntes Argument/);
  await assert.rejects(
    main(['prepare', '--budget-nano-usd', '1', '--budget-nano-usd', '2']),
    /Doppeltes Argument/,
  );
});
test('Testtarif und Testmodell können nicht als Live-Bindung verwendet werden', () => {
  const old = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'unit-fixture-only';
  try {
    assert.throws(() => liveBinding(config), /geprüfte Modellbindung/);
    assert.ok(
      batchReader() instanceof Anthropic,
      'Der Abruf bezahlter Batches bleibt auch bei älterer Modell-/Tarifevidenz verfügbar; Create bleibt gesperrt.',
    );
  } finally {
    if (old === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = old;
  }
});
test('Der echte SDK-Batchparser verarbeitet Create, Retrieve und unsortiertes JSONL', async () => {
  const meta = {
    id: 'msgbatch_unit_fixture',
    type: 'message_batch',
    processing_status: 'ended',
    created_at: '2026-10-14T00:00:00Z',
    ended_at: '2026-10-14T00:00:01Z',
    expires_at: '2026-10-15T00:00:00Z',
    results_url: 'https://api.anthropic.com/unit-results',
    request_counts: { processing: 0, succeeded: 1, errored: 0, canceled: 0, expired: 0 },
    archived_at: null,
    cancel_initiated_at: null,
  };
  const calls = [];
  const client = new Anthropic({
    apiKey: 'unit-fixture-only',
    baseURL: 'https://api.anthropic.com',
    maxRetries: 0,
    logLevel: 'off',
    fetch: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      if (String(url).endsWith('/unit-results'))
        return new Response(
          JSON.stringify({ custom_id: pending[0].id, result: { type: 'succeeded', message } }) +
            '\n',
          { headers: { 'Content-Type': 'application/x-jsonl' } },
        );
      return new Response(JSON.stringify(meta), {
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });
  const batch = await client.messages.batches.create({
    requests: pending.map((p) => ({ custom_id: p.id, params: p.params })),
  });
  assert.equal(batch.id, meta.id);
  const rows = [];
  for await (const row of await client.messages.batches.results(batch.id)) rows.push(row);
  assert.equal(Object.keys(validateReceipts(pending, rows, () => message.model)).length, 1);
  assert.equal(calls.filter((c) => c.method === 'POST').length, 1);
  assert.ok(calls.every((c) => new URL(c.url).hostname === 'api.anthropic.com'));
});

// Ausschließlich synthetische Urteil-FIXTURES für die Logik. Sie sind keine Claude-Freigabe des echten Katalogs.
async function gradingFixture(variants = ['baseline']) {
  const templates = ['chat', 'explain', 'hint', 'solution'].map((mode) =>
    catalogue.cases.find((c) => c.scope.mode === mode),
  );
  const cases = Array.from({ length: 200 }, (_, i) => ({
    ...structuredClone(templates[i % 4]),
    id: 'unit_case_' + String(i),
    category: 'facts',
    calls: [],
    sourceArticles: [],
    exampleRequired: false,
  }));
  const fixtureCatalogue = catalogueSchema.parse({ ...catalogue, cases }),
    catalogueHash = await fingerprint(fixtureCatalogue),
    episodes = [];
  for (const c of cases)
    for (const locale of LOCALES)
      for (const variant of variants)
        episodes.push({
          id: await fingerprint([c.id, locale, variant]),
          caseId: c.id,
          locale,
          variant,
          knowledge: { state: 'empty', snapshot: '0'.repeat(64), lane: 'published', chunks: [] },
        });
  const prep = {
      schemaVersion: 1,
      catalogueHash,
      configHash: '1'.repeat(64),
      runtimeHash: '2'.repeat(64),
      knowledgeSnapshot: '0'.repeat(64),
      episodes,
    },
    outcomes = [],
    rows = [],
    review = [];
  for (const c of cases)
    for (const locale of LOCALES)
      review.push({
        caseId: c.id,
        locale,
        caseHash: await fingerprint(c),
        reviewer: 'claude-code',
        freshContext: true,
        approved: true,
        reviewedAt: '2026-10-14T00:00:00Z',
        methods: ['table', 'tonal'],
        references: ['UNIT FIXTURE, kein echter fachlicher Durchgang'],
        notes: 'UNIT FIXTURE',
      });
  for (const e of episodes) {
    const c = cases.find((c) => c.id === e.caseId),
      answer = {
        text: 'UNIT FIXTURE. Keine echte Modellantwort.',
        examples: [],
        errors: [],
        status: 'complete',
        citations: [],
        sourceState: 'no_source',
      },
      checks = automaticChecks(c, answer, [], e.knowledge),
      cheap = e.variant === 'cheap';
    const usage = {
      inputTokens: 10,
      outputTokens: 10,
      cacheReadTokens: 0,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0,
      unknownCacheWriteTokens: 0,
      costNanoUsd: cheap ? 50 : 100,
      estimated: false,
    };
    const out = {
      episodeId: e.id,
      status: 'complete',
      answer,
      checks,
      tools: [],
      rounds: 1,
      batchUsage: usage,
      streamUsage: { ...usage, costNanoUsd: cheap ? 100 : 200 },
      answerHash: await fingerprint([answer, [], checks, 1]),
    };
    outcomes.push(out);
    rows.push({
      episodeId: e.id,
      answerHash: out.answerHash,
      reviewer: 'claude-code',
      freshContext: true,
      reviewedAt: '2026-10-14T00:00:00Z',
      verdicts: { factual: true, tools: true, sources: true, hints: true, languageTone: true },
      references: [],
      notes: 'UNIT FIXTURE',
    });
  }
  const report = {
    schemaVersion: 1,
    simulation: false,
    catalogueHash,
    configHash: prep.configHash,
    runtimeHash: prep.runtimeHash,
    preparationHash: await fingerprint(prep),
    receiptsHash: '3'.repeat(64),
    lane: 'published',
    sourceMode: 'postgres',
    outcomes,
  };
  return {
    catalogue: fixtureCatalogue,
    preparation: prep,
    report,
    review: { schemaVersion: 1, catalogueHash, reviews: review },
    grades: { schemaVersion: 1, runHash: await fingerprint(report), grades: rows },
  };
}
test('Unbewertete und fehlende Antworten bleiben im festen Nenner', async () => {
  const f = await gradingFixture();
  f.report.outcomes.splice(0, 1);
  const summary = await evaluateReport({ ...f, grades: null });
  assert.equal(summary.total, 600);
  assert.equal(summary.completed, 599);
  assert.equal(summary.factualPercent, 0);
  assert.equal(summary.releaseEligible, false);
  assert.equal(summary.recommendation, null);
  await assert.rejects(
    evaluateReport({ ...f, grades: null, baseline: { ...summary, cells: undefined } }),
    /Basis muss/,
  );
});
test('Eine kleine Teilmenge kann den vollständigen Testkatalog nicht vertreten', async () => {
  const f = await gradingFixture();
  f.preparation.episodes.splice(3);
  f.report.preparationHash = await fingerprint(f.preparation);
  f.report.outcomes.splice(3);
  f.grades = null;
  await assert.rejects(evaluateReport(f), /Unvollständiger Testlauf/);
});
test('Eine Simulation bekommt auch mit synthetischen Vollurteilen keine Freigabe oder Kontingente', async () => {
  const f = await gradingFixture();
  f.report.simulation = true;
  f.grades.runHash = await fingerprint(f.report);
  const summary = await evaluateReport(f);
  assert.equal(summary.factualPercent, 100);
  assert.equal(summary.releaseEligible, false);
  assert.ok(summary.blockedReasons.includes('simulation'));
  assert.equal(summary.recommendation, null);
});
test('Die 98-%-Schwelle gilt je Sprache; Fehler werden nicht durch andere Sprachen verdeckt', async () => {
  const f = await gradingFixture();
  for (const e of f.preparation.episodes.filter((e) => e.locale === 'de').slice(0, 5))
    f.grades.grades.find((g) => g.episodeId === e.id).verdicts.factual = false;
  const result = await evaluateReport(f);
  assert.ok(result.factualPercent > 98);
  assert.equal(result.groups['locale:de'].factualPercent, 97.5);
  assert.equal(result.releaseEligible, false);
});
test('Auch die Annahmequote gilt je Sprache und Rolle', async () => {
  const f = await gradingFixture();
  for (const e of f.preparation.episodes.filter((e) => e.locale === 'en-GB').slice(0, 5))
    f.grades.grades.find((g) => g.episodeId === e.id).verdicts.languageTone = false;
  const result = await evaluateReport(f);
  assert.ok(result.acceptancePercent > 98);
  assert.equal(result.groups['locale:en-GB'].factualPercent, 100);
  assert.ok(result.groups['locale:en-GB'].acceptancePercent < 98);
  assert.equal(result.releaseEligible, false);
  assert.equal(result.selection, null);
});
test('Günstigere schlechtere Variante wird verworfen; valide Rollenwahl bleibt möglich', async () => {
  const f = await gradingFixture(['baseline', 'cheap']);
  for (const e of f.preparation.episodes
    .filter((e) => e.variant === 'cheap' && e.locale === 'de')
    .slice(0, 20))
    f.grades.grades.find((g) => g.episodeId === e.id).verdicts.factual = false;
  const result = await evaluateReport(f);
  assert.equal(result.releaseEligible, true);
  assert.ok(Object.values(result.recommendation.roleVariants).includes('baseline'));
  assert.equal(result.selection.factualPercent, 100);
});
test('Hinweisleck und Quellenverletzung disqualifizieren einen Rollenkandidaten', async () => {
  const f = await gradingFixture();
  const hint = f.preparation.episodes.find(
    (e) => f.catalogue.cases.find((c) => c.id === e.caseId).scope.mode === 'hint',
  );
  f.grades.grades.find((g) => g.episodeId === hint.id).verdicts.hints = false;
  const result = await evaluateReport(f);
  assert.equal(result.releaseEligible, false);
  assert.equal(result.recommendation, null);
});
test('Veraltete Katalog- und Antworturteile sowie manipulierte automatische Checks scheitern', async () => {
  const f = await gradingFixture(),
    stale = structuredClone(f);
  stale.grades.grades[0].answerHash = 'a'.repeat(64);
  await assert.rejects(evaluateReport(stale), /veralteter/);
  const other = structuredClone(f);
  other.review.reviews[0].caseHash = 'b'.repeat(64);
  await assert.rejects(evaluateReport(other), /Katalogreview/);
  const altered = structuredClone(f);
  const out = altered.report.outcomes[0];
  out.answer.text = '';
  out.answerHash = await fingerprint([out.answer, out.tools, out.checks, out.rounds]);
  altered.grades = null;
  await assert.rejects(evaluateReport(altered), /Automatische/);
});
test('Ein fachlicher Rückschritt gegen die ausgewählte freigegebene Basis blockiert', async () => {
  const f = await gradingFixture(),
    baseline = await evaluateReport(f);
  f.grades.grades[0].verdicts.factual = false;
  const result = await evaluateReport({ ...f, baseline });
  assert.equal(result.releaseEligible, false);
  assert.ok(result.regressions.length > 0);
});
test('Abo-Vorschlag verwendet Streamprojektion, Ausfallkosten, Sicherheit und Geschäftsbudget', async () => {
  const f = await gradingFixture(),
    budget = {
      premiumMonthlyModelBudgetNanoUsd: 9000,
      maxMonthlyModelBudgetNanoUsd: 18000,
      activeDaysPerMonth: 30,
      safetyMultiplier: 1.5,
    };
  const result = await evaluateReport({ ...f, budget });
  assert.deepEqual(result.recommendation.quotaSuggestion, {
    premiumDailyQuestions: 1,
    maxDailyQuestions: 2,
    basis: budget,
  });
  assert.equal(result.selection.costPerAcceptedAnswerNanoUsd, 200);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.95), 5);
});
test('CLI-Simulation kann niemals als echte Batchübermittlung gesendet werden', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-benchmark-command-')),
    path = join(dir, 'run.json');
  try {
    const f = await gradingFixture();
    writeJson(
      path,
      {
        schemaVersion: 1,
        simulation: true,
        createdAt: '2026-10-14T00:00:00Z',
        catalogue: f.catalogue,
        config,
        preparation: f.preparation,
        budgetNanoUsd: 1e9,
        cache: {},
        waves: [],
        report: null,
      },
      true,
    );
    await assert.rejects(main(['submit', '--run', path]), /verweigert Simulationen/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
