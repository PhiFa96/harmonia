// P2.18: lokale Vorbereitung, ausdrücklich gestartete asynchrone SDK-Batches und getrennte Bewertung.
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
  statSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  currentKnowledgeSnapshot,
  selectKnowledgeChunks,
} from '../supabase/functions/_shared/knowledge.ts';
import { knowledgeSearchResponseSchema } from '../packages/content/src/index.ts';
import { exerciseContext } from '../supabase/functions/_shared/tutor-tools.ts';
import { catalogue as preview } from '../packages/content/src/authoring.ts';
import { catalogue as published } from '../packages/content/src/published.ts';
import {
  catalogueSchema,
  configSchema,
  journalSchema,
  preparationSchema,
  workerOutputSchema,
  catalogueReviewSchema,
  gradesSchema,
  budgetSchema,
  LOCALES,
} from './tutor-benchmark/schema.ts';
import { fingerprint } from './tutor-benchmark/hash.ts';
import { catalogueApprovals, evaluateReport } from './tutor-benchmark/evaluate.ts';
import { validateReceipts, receiptCosts } from './tutor-benchmark/batch.ts';
import { officialEvidence } from './tutor-benchmark/binding.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
function currentCatalogue(version) {
  if (version !== 1 && version !== 2) throw Error('Unknown tutor catalogue version');
  return catalogueSchema.parse(
    readJson(join(root, `tools/tutor-benchmark/catalogue${version === 2 ? '-v2' : ''}.json`)),
  );
}
export const readJson = (path) => {
  if (statSync(path).size > 512_000_000) throw Error('Datei überschreitet 512 MB');
  return JSON.parse(readFileSync(path, 'utf8'));
};
export function writeJson(path, value, create = false) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  if (create) {
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    return;
  }
  const temp = path + '.' + process.pid + '.tmp';
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  try {
    renameSync(temp, path);
  } finally {
    rmSync(temp, { force: true });
  }
}
export async function withLock(path, operation) {
  const lock = path + '.lock';
  try {
    mkdirSync(lock);
  } catch {
    throw Error(
      'Lauf ist gesperrt. Nur nach Prüfung, dass kein anderer eigener Prozess arbeitet, die Sperre entfernen.',
    );
  }
  try {
    return await operation();
  } finally {
    rmSync(lock, { recursive: true });
  }
}
export async function runtimeHash() {
  const paths = [];
  const visit = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const name = dir + '/' + e.name;
      if (e.isDirectory() && !['testing', 'native', '__tests__'].includes(e.name)) visit(name);
      else if (
        e.isFile() &&
        /\.(ts|json)$/.test(e.name) &&
        !e.name.includes('.test.') &&
        !e.name.includes('.tonal.')
      )
        paths.push(name);
    }
  };
  for (const dir of [
    'packages/theory/src',
    'packages/notation/src',
    'packages/exercises/src',
    'packages/content/src',
    'packages/i18n/src',
    'supabase/functions/_shared',
    'tools/tutor-benchmark',
  ])
    visit(dir);
  paths.push('tools/tutor-benchmark-worker.ts', 'tools/tutor-benchmark.mjs', 'pnpm-lock.yaml');
  return fingerprint(paths.sort().map((path) => [path, readFileSync(join(root, path), 'utf8')]));
}
export function liveBinding(config) {
  if (!process.env.ANTHROPIC_API_KEY)
    throw Error('Sichere ANTHROPIC_API_KEY-Bindung fehlt. Kein API-Aufruf.');
  if (
    config.variants.some((v) => !/^claude-[a-z0-9.-]+$/.test(v.model)) ||
    !officialEvidence(config.modelEvidence.source, config.modelEvidence.verifiedAt)
  )
    throw Error('Aktuelle offiziell geprüfte Modellbindung fehlt. Kein API-Aufruf.');
  if (
    !officialEvidence(config.streamTariff.source, config.streamTariff.verifiedAt) ||
    !officialEvidence(config.batchTariff.source, config.batchTariff.verifiedAt)
  )
    throw Error(
      'Offiziell geprüfter Stream- und Batch-Tarif (höchstens 30 Tage alt) fehlen. Kein API-Aufruf.',
    );
  return batchReader();
}
export function batchReader() {
  if (!process.env.ANTHROPIC_API_KEY)
    throw Error('Sichere ANTHROPIC_API_KEY-Bindung fehlt. Kein API-Aufruf.');
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: 'https://api.anthropic.com',
    authToken: null,
    webhookKey: null,
    maxRetries: 0,
    logLevel: 'off',
    openTelemetry: { propagation: false, traces: false },
    timeout: 30000,
  });
}
const flag = (args, name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error(name + ' benötigt einen Wert');
  return args[i + 1];
};
const roleRequest = (c, locale) => ({
  id: '00000000-0000-4000-8000-000000000001',
  conversationId: '00000000-0000-4000-8000-000000000002',
  ...c.scope,
  locale,
  noteNaming: locale === 'de' ? 'de' : 'intl',
  message: c.questions[locale],
});
async function localSearch() {
  const status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
  const url = new URL(status.API_URL);
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw Error('Nur lokale Supabase-Suche erlaubt');
  return async (body) => {
    const response = await fetch(url.origin + '/rest/v1/rpc/search_knowledge', {
      method: 'POST',
      headers: {
        apikey: status.SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + status.SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw Error('Lokale Wissenssuche nicht verfügbar (' + response.status + ')');
    return knowledgeSearchResponseSchema.parse(await response.json());
  };
}
export async function prepare(catalogue, config, sourceSearch = null) {
  const snapshot = await currentKnowledgeSnapshot(config.lane),
    episodes = [];
  const sourceCourse = config.lane === 'preview' ? preview : published;
  for (const c of catalogue.cases)
    for (const locale of LOCALES) {
      const request = roleRequest(c, locale),
        context = exerciseContext(sourceCourse, request);
      const skills = sourceCourse.lessons.find((l) => l.id === context.contentId)?.skillIds ?? [];
      let knowledge;
      if (config.sourceMode === 'postgres') {
        if (!sourceSearch) throw Error('Postgres-Suchadapter fehlt');
        if (!snapshot.chunks.length)
          knowledge = { lane: config.lane, snapshot: snapshot.digest, state: 'empty', chunks: [] };
        else {
          const found = await sourceSearch({
            target_lane: config.lane,
            expected_snapshot: snapshot.digest,
            language: locale,
            question: request.message,
            skills,
          });
          if (found.state !== 'ready')
            throw Error(
              'DB-/Function-Snapshot stimmt nicht überein. Wissensindex explizit synchronisieren.',
            );
          knowledge = selectKnowledgeChunks(snapshot, locale, found.hits);
        }
      } else {
        knowledge = selectKnowledgeChunks(
          snapshot,
          locale,
          snapshot.chunks
            .filter(
              (chunk) => chunk.locale === locale && c.sourceArticles.includes(chunk.articleId),
            )
            .sort((a, b) => a.section - b.section || a.part - b.part)
            .map((chunk) => ({ id: chunk.id })),
        );
      }
      for (const variant of config.variants)
        episodes.push({
          id: await fingerprint([c.id, locale, variant.id]),
          caseId: c.id,
          locale,
          variant: variant.id,
          knowledge,
        });
    }
  return preparationSchema.parse({
    schemaVersion: 1,
    catalogueHash: await fingerprint(catalogue),
    configHash: await fingerprint(config),
    runtimeHash: await runtimeHash(),
    knowledgeSnapshot: snapshot.digest,
    episodes,
  });
}
export async function runWorker(journal) {
  if (journal.preparation.runtimeHash !== (await runtimeHash()))
    throw Error(
      'Runtime/Engine/Prompt/Werkzeuge wurden seit Vorbereitung verändert. Passenden Stand wiederherstellen oder neuen Lauf vorbereiten.',
    );
  if (
    journal.preparation.configHash !== (await fingerprint(journal.config)) ||
    journal.preparation.catalogueHash !== (await fingerprint(journal.catalogue)) ||
    journal.preparation.catalogueHash !==
      (await fingerprint(currentCatalogue(journal.catalogue.version)))
  )
    throw Error('Laufkonfiguration oder Katalog wurde verändert');
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-tutor-benchmark-')),
    input = join(dir, 'input.json'),
    output = join(dir, 'output.json');
  try {
    writeJson(input, journal, true);
    execFileSync(
      'npx',
      [
        '-y',
        'deno@2.9.6',
        'run',
        '--config',
        'tools/deno.json',
        '--allow-env=ANTHROPIC_CUSTOM_HEADERS',
        '--allow-read=' + dir,
        '--allow-write=' + dir,
        'tools/tutor-benchmark-worker.ts',
        input,
        output,
      ],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 2_000_000 },
    );
    const result = workerOutputSchema.parse(readJson(output));
    result.report.simulation = journal.simulation;
    return result;
  } catch (error) {
    if (error?.stderr) console.error(String(error.stderr).slice(0, 4000));
    throw error;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const currentWave = (j) => j.waves.at(-1);
export function planWave(journal, pending) {
  if (!pending.length) return null;
  if (currentWave(journal) && currentWave(journal).state !== 'ended')
    throw Error('Letzte Welle ist noch offen; keine automatische Neuübermittlung');
  if (journal.waves.length >= journal.config.limits.maxRounds)
    throw Error('Maximale Rundenzahl erreicht');
  if (new Set(pending.map((p) => p.id)).size !== pending.length) throw Error('Doppelte Aufträge');
  const reservationNanoUsd = pending.reduce((n, p) => n + p.reservationNanoUsd, 0);
  if (!Number.isSafeInteger(reservationNanoUsd))
    throw Error('Kostenreservierung überschreitet den sicheren Ganzzahlbereich. Kein API-Aufruf.');
  const committed = journal.waves.reduce((n, w) => n + (w.costNanoUsd ?? w.reservationNanoUsd), 0);
  if (committed + reservationNanoUsd > journal.budgetNanoUsd)
    throw Error('Konservatives Kostenlimit erreicht. Kein API-Aufruf.');
  if (
    new TextEncoder().encode(
      JSON.stringify(pending.map((p) => ({ custom_id: p.id, params: p.params }))),
    ).length > 200_000_000
  )
    throw Error('Batch-Payload über 200 MB. Konfiguration reduzieren.');
  return {
    number: journal.waves.length + 1,
    state: 'planned',
    batchId: null,
    requests: pending,
    reservationNanoUsd,
    costNanoUsd: null,
    estimated: false,
  };
}
export function simulatedReceipts(journal, requests) {
  return requests
    .map((row) => {
      const episode = journal.preparation.episodes.find((e) => e.id === row.episodeId),
        c = journal.catalogue.cases.find((c) => c.id === episode.caseId),
        params = row.params;
      const firstRound = !params.messages.some((m) => m.role === 'assistant');
      const content =
        firstRound && c.calls.length
          ? c.calls.map((call, i) => ({
              type: 'tool_use',
              id: 'tool_simulated_' + row.id.slice(0, 12) + '_' + i,
              name: call.name,
              input: call.input,
            }))
          : [
              {
                type: 'text',
                text: 'Lokale Simulatorantwort / local simulation. Keine fachliche Qualitätsaussage / no measured model quality.',
                citations: [],
              },
            ];
      if (content[0]?.type === 'text' && c.sourceArticles.length) {
        const user = params.messages.find((m) => m.role === 'user' && Array.isArray(m.content)),
          documents = user?.content.filter((b) => b.type === 'document') ?? [];
        const index = documents.findIndex((d) =>
          episode.knowledge.chunks.find(
            (chunk) =>
              c.sourceArticles.includes(chunk.articleId) &&
              chunk.title + ' — ' + chunk.heading === d.title,
          ),
        );
        if (index >= 0) {
          const doc = documents[index],
            quote = Array.from(doc.source.data).slice(0, 80).join('');
          content[0].citations = [
            {
              type: 'char_location',
              document_index: index,
              document_title: doc.title,
              file_id: null,
              start_char_index: 0,
              end_char_index: Array.from(quote).length,
              cited_text: quote,
            },
          ];
        }
      }
      return {
        custom_id: row.id,
        result: {
          type: 'succeeded',
          message: {
            id: 'msg_simulated_' + row.id.slice(0, 16),
            type: 'message',
            role: 'assistant',
            model: params.model,
            content,
            stop_reason: content[0]?.type === 'tool_use' ? 'tool_use' : 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: 100,
              output_tokens: 20,
              cache_creation_input_tokens: 300,
              cache_read_input_tokens: 200,
              cache_creation: { ephemeral_5m_input_tokens: 300, ephemeral_1h_input_tokens: 0 },
              server_tool_use: null,
              service_tier: 'standard',
              inference_geo: null,
              output_tokens_details: null,
            },
          },
        },
      };
    })
    .reverse(); // Reihenfolge ist laut Batch-Vertrag nicht garantiert.
}
async function collect(journal, client) {
  const wave = currentWave(journal);
  if (!wave || wave.state === 'ended') throw Error('Keine ausstehende Welle');
  if (!wave.batchId || wave.state === 'uncertain' || wave.state === 'planned')
    throw Error('Batch-ID nicht bestätigt. Explizit abgleichen, nicht erneut senden.');
  let rows;
  if (journal.simulation) rows = simulatedReceipts(journal, wave.requests);
  else {
    const status = await client.messages.batches.retrieve(wave.batchId);
    if (status.processing_status !== 'ended') {
      console.log('Batch noch ' + status.processing_status + '. collect später erneut ausführen.');
      return false;
    }
    const resultUrl = new URL(status.results_url ?? '');
    if (resultUrl.protocol !== 'https:' || resultUrl.hostname !== 'api.anthropic.com')
      throw Error('Unerwartetes Ergebnisziel');
    rows = [];
    const decoder = await client.messages.batches.results(wave.batchId);
    let bytes = 0;
    for await (const row of decoder) {
      bytes += new TextEncoder().encode(JSON.stringify(row)).length;
      if (bytes > 256_000_000 || rows.length >= wave.requests.length)
        throw Error('Batch-Ergebnisse zu groß oder zu viele');
      rows.push(row);
    }
  }
  const entries = validateReceipts(wave.requests, rows, (id) => {
    const episode = journal.preparation.episodes.find((e) => e.id === id);
    return journal.config.variants.find((v) => v.id === episode.variant).model;
  });
  const cost = receiptCosts(wave.requests, entries, journal.config.batchTariff);
  Object.assign(journal.cache, entries);
  Object.assign(wave, { state: 'ended', ...cost });
  journal.report = null;
  return true;
}
export async function main(args = process.argv.slice(2)) {
  const accepted = {
    prepare: {
      value: [
        '--run',
        '--config',
        '--catalogue-review',
        '--budget-nano-usd',
        '--catalogue-version',
      ],
      boolean: ['--simulate', '--allow-draft'],
    },
    inspect: { value: ['--run'], boolean: [] },
    simulate: { value: ['--run'], boolean: [] },
    submit: { value: ['--run'], boolean: [] },
    collect: { value: ['--run'], boolean: [] },
    reconcile: { value: ['--run', '--batch-id'], boolean: [] },
    cancel: { value: ['--run'], boolean: [] },
    'review-template': { value: ['--run', '--output'], boolean: [] },
    evaluate: {
      value: ['--run', '--catalogue-review', '--grades', '--budget', '--baseline', '--output'],
      boolean: ['--release'],
    },
  }[args[0]];
  const seenFlags = new Set();
  if (accepted)
    for (let i = 1; i < args.length; i++) {
      if (seenFlags.has(args[i])) throw Error('Doppeltes Argument: ' + args[i]);
      seenFlags.add(args[i]);
      if (accepted.value.includes(args[i])) {
        if (!args[i + 1] || args[i + 1].startsWith('--'))
          throw Error(args[i] + ' benötigt einen Wert');
        i++;
      } else if (!accepted.boolean.includes(args[i]))
        throw Error('Unbekanntes Argument: ' + args[i]);
    }
  const command = args[0],
    runPath = resolve(flag(args, '--run', join(root, 'artifacts/tutor-benchmark/run.json')));
  if (
    ![
      'prepare',
      'inspect',
      'simulate',
      'submit',
      'collect',
      'reconcile',
      'cancel',
      'review-template',
      'evaluate',
    ].includes(command)
  )
    throw Error(
      'Befehle: prepare, inspect, simulate, submit, collect, reconcile, cancel, review-template, evaluate. Details docs/plan/tutor-testkatalog.md.',
    );
  if (command === 'prepare') {
    const catalogue = currentCatalogue(Number(flag(args, '--catalogue-version', '1'))),
      config = configSchema.parse(
        readJson(
          resolve(flag(args, '--config', join(root, 'tools/tutor-benchmark/config.example.json'))),
        ),
      );
    const simulation = args.includes('--simulate'),
      reviewPath = flag(args, '--catalogue-review', null),
      review = reviewPath ? catalogueReviewSchema.parse(readJson(resolve(reviewPath))) : null;
    const approvals = await catalogueApprovals(catalogue, review);
    if (
      !simulation &&
      !args.includes('--allow-draft') &&
      approvals.size !== catalogue.cases.length * 3
    )
      throw Error(
        'Getrennte Katalogfreigabe fehlt. Nur einen ausdrücklich explorativen Lauf mit --allow-draft vorbereiten.',
      );
    if (!simulation) liveBinding(config); // Fehlende Bindung stoppt vor Such-/Modellzugriff.
    if (new Set(config.variants.map((v) => v.id)).size !== config.variants.length)
      throw Error('Doppelte Varianten-ID');
    const budgetNanoUsd = Number(
      flag(args, '--budget-nano-usd', simulation ? '10000000000000' : null),
    );
    if (!Number.isSafeInteger(budgetNanoUsd) || budgetNanoUsd <= 0)
      throw Error('Ein positives konservatives --budget-nano-usd ist erforderlich.');
    const preparation = await prepare(
      catalogue,
      config,
      config.sourceMode === 'postgres' ? await localSearch() : null,
    );
    const journal = journalSchema.parse({
      schemaVersion: 1,
      simulation,
      createdAt: new Date().toISOString(),
      catalogue,
      config,
      preparation,
      budgetNanoUsd,
      cache: {},
      waves: [],
      report: null,
    });
    writeJson(runPath, journal, true);
    console.log(
      `Vorbereitet: ${preparation.episodes.length} Episoden, ${simulation ? 'SIMULATION' : 'echter Lauf'}, keine Modellanfrage. ${runPath}`,
    );
    return;
  }
  if (command === 'inspect') {
    const j = journalSchema.parse(readJson(runPath));
    console.log(
      JSON.stringify(
        {
          simulation: j.simulation,
          episodes: j.preparation.episodes.length,
          waves: j.waves.map((w) => ({
            number: w.number,
            state: w.state,
            batchId: w.batchId,
            requests: w.requests.length,
            costNanoUsd: w.costNanoUsd,
            estimated: w.estimated,
          })),
          results: j.report?.outcomes.length ?? 0,
          budgetNanoUsd: j.budgetNanoUsd,
        },
        null,
        2,
      ),
    );
    return;
  }
  await withLock(runPath, async () => {
    const j = journalSchema.parse(readJson(runPath));
    if (command === 'simulate') {
      if (!j.simulation) throw Error('simulate verweigert echte Läufe');
      for (let round = 0; round <= j.config.limits.maxRounds; round++) {
        const output = await runWorker(j);
        if (!output.pending.length) {
          j.report = output.report;
          writeJson(runPath, j);
          console.log(
            `${j.report.outcomes.length} simulierte Dialoge abgeschlossen; keine gemessene Modellqualität.`,
          );
          return;
        }
        const wave = planWave(j, output.pending);
        j.waves.push(wave);
        writeJson(runPath, j);
        wave.batchId = 'msgbatch_simulated_' + wave.number;
        wave.state = 'submitted';
        await collect(j, null);
        writeJson(runPath, j);
      }
      throw Error('Simulation überschreitet Rundenlimit');
    }
    if (command === 'submit') {
      if (j.simulation) throw Error('submit verweigert Simulationen');
      const client = liveBinding(j.config),
        output = await runWorker(j);
      if (!output.pending.length) {
        j.report = output.report;
        writeJson(runPath, j);
        console.log('Alle Dialoge abgeschlossen. Getrennte Bewertung erforderlich.');
        return;
      }
      const wave = planWave(j, output.pending);
      j.waves.push(wave);
      writeJson(runPath, j); // vor dem einzigen kostenpflichtigen Schreibzugriff
      try {
        const batch = await client.messages.batches.create({
          requests: wave.requests.map((r) => ({ custom_id: r.id, params: r.params })),
        });
        wave.batchId = batch.id;
        wave.state = 'submitted';
        writeJson(runPath, j);
        console.log(
          `Welle ${wave.number}: ${wave.requests.length} Aufträge. Batch ${wave.batchId}. collect später ausführen.`,
        );
      } catch {
        wave.state = 'uncertain';
        writeJson(runPath, j);
        throw Error(
          'Übermittlung nicht eindeutig bestätigt. Keine automatische Wiederholung. Batch im Anbieter-Konto abgleichen und reconcile --batch-id verwenden.',
        );
      }
      return;
    }
    if (command === 'collect') {
      const done = await collect(j, j.simulation ? null : batchReader());
      if (done) {
        writeJson(runPath, j);
        const output = await runWorker(j);
        j.report = output.pending.length ? null : output.report;
        writeJson(runPath, j);
        console.log(
          output.pending.length
            ? `Welle gespeichert. ${output.pending.length} Folgeaufträge warten auf ausdrückliches submit.`
            : 'Alle Dialoge gespeichert. Getrennte Bewertung erforderlich.',
        );
      }
      return;
    }
    if (command === 'reconcile') {
      const wave = currentWave(j),
        id = flag(args, '--batch-id', null);
      if (j.simulation || !wave || !['planned', 'uncertain'].includes(wave.state) || !id)
        throw Error('Nur eine unklare eigene Übermittlung mit expliziter Batch-ID abgleichen');
      const batch = await batchReader().messages.batches.retrieve(id),
        total = Object.values(batch.request_counts).reduce((n, v) => n + v, 0);
      if (total !== wave.requests.length) throw Error('Anzahl der Quittung passt nicht');
      wave.batchId = batch.id;
      wave.state = 'submitted';
      writeJson(runPath, j);
      console.log('Batch-ID zugeordnet. collect prüft anschließend alle custom_id-Belege.');
      return;
    }
    if (command === 'cancel') {
      const wave = currentWave(j);
      if (j.simulation || !wave?.batchId || wave.state !== 'submitted')
        throw Error('Kein eigener laufender echter Batch');
      await batchReader().messages.batches.cancel(wave.batchId);
      console.log(
        'Abbruch angefordert. Mit collect terminale Ergebnisse und konservative Kosten erfassen.',
      );
      return;
    }
    if (j.preparation.runtimeHash !== (await runtimeHash()))
      throw Error(
        'Lauf gehört zu einem anderen Runtime-/Prompt-/Werkzeugstand; für Bewertung den passenden Stand wiederherstellen.',
      );
    if (!j.report) {
      const output = await runWorker(j);
      if (output.pending.length)
        throw Error('Dialoglauf noch nicht vollständig; fehlende Ergebnisse werden nicht entfernt');
      j.report = output.report;
      writeJson(runPath, j);
    }
    if (
      j.report.receiptsHash !== (await fingerprint(j.cache)) ||
      j.preparation.catalogueHash !== (await fingerprint(currentCatalogue(j.catalogue.version)))
    )
      throw Error('Quittungen oder aktueller Katalog passen nicht zum bewerteten Lauf');
    if (command === 'review-template') {
      const directory = resolve(
        flag(args, '--output', join(root, 'artifacts/tutor-benchmark/review')),
      );
      mkdirSync(directory, { recursive: true });
      const runHash = await fingerprint(j.report);
      writeJson(
        join(directory, 'catalogue-review.json'),
        { schemaVersion: 1, catalogueHash: j.preparation.catalogueHash, reviews: [] },
        true,
      );
      writeJson(
        join(directory, 'answer-grades.json'),
        { schemaVersion: 1, runHash, grades: [] },
        true,
      );
      writeJson(
        join(directory, 'review-pack.json'),
        {
          schemaVersion: 1,
          simulation: j.simulation,
          runHash,
          catalogueHash: j.preparation.catalogueHash,
          cases: j.catalogue.cases,
          episodes: j.preparation.episodes,
          outcomes: j.report.outcomes,
        },
        true,
      );
      console.log(
        'Leere Reviewdateien und Belege geschrieben. Keine Prüferidentität oder Zustimmung vorgetragen.',
      );
      return;
    }
    const optional = (name, schema) => {
      const path = flag(args, name, null);
      return path
        ? schema
          ? schema.parse(readJson(resolve(path)))
          : readJson(resolve(path))
        : null;
    };
    const summary = await evaluateReport({
      catalogue: j.catalogue,
      preparation: j.preparation,
      report: j.report,
      review: optional('--catalogue-review', catalogueReviewSchema),
      grades: optional('--grades', gradesSchema),
      budget: optional('--budget', budgetSchema),
      baseline: optional('--baseline', null),
      configuration: j.config,
    });
    const outputPath = flag(args, '--output', null);
    if (outputPath) writeJson(resolve(outputPath), summary);
    console.log(
      JSON.stringify(
        {
          total: summary.total,
          completed: summary.completed,
          reviewed: summary.reviewed,
          simulation: summary.simulation,
          factualPercent: summary.factualPercent,
          releaseEligible: summary.releaseEligible,
          blockedReasons: summary.blockedReasons,
          metrics: summary.metrics,
          recommendation: summary.recommendation,
        },
        null,
        2,
      ),
    );
    if (args.includes('--release') && !summary.releaseEligible)
      throw Error('Release-Gate geschlossen; siehe konkrete Gründe.');
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
