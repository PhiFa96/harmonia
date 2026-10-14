// Reiner lokaler Dialoglauf. Der Node-CLI führt ausschließlich ausdrücklich gestartete SDK-Batches aus.
import { runTutor } from '../supabase/functions/_shared/tutor-runtime.ts';
import { exerciseContext } from '../supabase/functions/_shared/tutor-tools.ts';
import { catalogue as preview } from '../packages/content/src/authoring.ts';
import { catalogue as published } from '../packages/content/src/published.ts';
import { DEFAULT_TUTOR_POLICY, tutorPolicySchema } from '../packages/content/src/index.ts';
import {
  catalogueSchema,
  configSchema,
  preparationSchema,
  cacheEntrySchema,
} from './tutor-benchmark/schema.ts';
import type { CacheEntry, BenchmarkOutcome, Pending } from './tutor-benchmark/schema.ts';
import { ReplayBatchProvider, outcome } from './tutor-benchmark/replay.ts';
import { fingerprint } from './tutor-benchmark/hash.ts';
declare const Deno: {
  args: string[];
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, data: string): Promise<void>;
};
const inputPath = Deno.args[0],
  outputPath = Deno.args[1];
if (!inputPath || !outputPath) throw Error('Worker erwartet Eingabe-/Ausgabedatei');
const raw: unknown = JSON.parse(await Deno.readTextFile(inputPath));
if (
  !raw ||
  typeof raw !== 'object' ||
  !('catalogue' in raw) ||
  !('config' in raw) ||
  !('preparation' in raw) ||
  !('cache' in raw)
)
  throw Error('Worker-Datei ungültig');
const catalogue = catalogueSchema.parse(raw.catalogue),
  config = configSchema.parse(raw.config),
  preparation = preparationSchema.parse(raw.preparation);
if (
  preparation.catalogueHash !== (await fingerprint(catalogue)) ||
  preparation.configHash !== (await fingerprint(config))
)
  throw Error('Eingabehash passt nicht');
if (!raw.cache || typeof raw.cache !== 'object' || Array.isArray(raw.cache))
  throw Error('Cache ungültig');
const cache: Record<string, CacheEntry> = {};
for (const [id, value] of Object.entries(raw.cache)) cache[id] = cacheEntrySchema.parse(value);
const pending: Pending[] = [],
  outcomes: BenchmarkOutcome[] = [];
for (const episode of preparation.episodes) {
  const c = catalogue.cases.find((c) => c.id === episode.caseId),
    variant = config.variants.find((v) => v.id === episode.variant);
  if (!c || !variant) throw Error('Unbekannte Episode');
  const request = {
    id: '00000000-0000-4000-8000-000000000001',
    conversationId: '00000000-0000-4000-8000-000000000002',
    ...c.scope,
    locale: episode.locale,
    noteNaming: episode.locale === 'de' ? ('de' as const) : ('intl' as const),
    message: c.questions[episode.locale],
  };
  const policy = tutorPolicySchema.parse({
    ...DEFAULT_TUTOR_POLICY,
    ...config.limits,
    enabled: true,
    model: variant.model,
    tariff: config.batchTariff,
    effort: variant.roleEffort[request.mode],
  });
  const provider = new ReplayBatchProvider(
    episode.id,
    variant,
    episode.locale,
    policy,
    config.streamTariff,
    cache,
  );
  const result = await runTutor({
    provider,
    request,
    policy,
    context: exerciseContext(config.lane === 'preview' ? preview : published, request),
    history: [],
    knowledge: episode.knowledge,
    signal: new AbortController().signal,
    emit: (event) => {
      if (event.type === 'tool') provider.markTool(event.id, event.ok);
    },
  });
  if (provider.pending) pending.push(provider.pending);
  else outcomes.push(await outcome(c, episode.id, result.result, provider, episode.knowledge));
}
await Deno.writeTextFile(
  outputPath,
  JSON.stringify({
    pending,
    report: {
      schemaVersion: 1,
      simulation: false,
      catalogueHash: preparation.catalogueHash,
      configHash: preparation.configHash,
      runtimeHash: preparation.runtimeHash,
      preparationHash: await fingerprint(preparation),
      receiptsHash: await fingerprint(cache),
      lane: config.lane,
      sourceMode: config.sourceMode,
      outcomes,
    },
  }),
);
