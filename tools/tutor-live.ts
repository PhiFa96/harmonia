// Manuell auslösen. Echte Anthropic-Kosten; benötigt eine geprüfte Modell-/Tarifbindung.
import {
  DEFAULT_TUTOR_POLICY,
  tutorPolicySchema,
  tutorTariffSchema,
} from '../packages/content/src/index.ts';
import { PRACTICE_CONTENT_VERSION } from '../packages/exercises/src/index.ts';
import type { TutorRequest } from '../packages/content/src/index.ts';
import { catalogue } from '../packages/content/src/published.ts';
import { AnthropicTutorProvider } from '../supabase/functions/_shared/tutor-provider.ts';
import { runTutor } from '../supabase/functions/_shared/tutor-runtime.ts';
import { exerciseContext } from '../supabase/functions/_shared/tutor-tools.ts';
import type { TutorEvent } from '../supabase/functions/_shared/tutor-runtime.ts';
import {
  currentKnowledgeSnapshot,
  selectKnowledgeChunks,
} from '../supabase/functions/_shared/knowledge.ts';
import { knowledgeQueries } from './knowledge-queries.ts';
const key = Deno.env.get('ANTHROPIC_API_KEY'),
  model = Deno.env.get('HARMONIA_TUTOR_MODEL'),
  tariffJson = Deno.env.get('HARMONIA_TUTOR_TARIFF');
if (!key || !model || !tariffJson)
  throw new Error(
    'Sichere ANTHROPIC_API_KEY-Bindung sowie HARMONIA_TUTOR_MODEL und HARMONIA_TUTOR_TARIFF fehlen. Kein API-Aufruf.',
  );
if (!/^claude-[a-z0-9.-]+$/.test(model))
  throw new Error(
    'Ein aus den aktuellen offiziellen Anthropic-Unterlagen geprüftes Modell ist erforderlich.',
  );
const tariff = tutorTariffSchema.parse(JSON.parse(tariffJson) as unknown),
  source = new URL(tariff.source),
  age = Date.now() - Date.parse(tariff.verifiedAt);
if (
  source.protocol !== 'https:' ||
  !['platform.claude.com', 'docs.anthropic.com', 'www.anthropic.com', 'anthropic.com'].includes(
    source.hostname,
  ) ||
  age < 0 ||
  age > 30 * 86400000
)
  throw new Error(
    'Tarifquelle muss offiziell und die Prüfung höchstens 30 Tage alt sein. Kein API-Aufruf.',
  );
const policy = tutorPolicySchema.parse({ ...DEFAULT_TUTOR_POLICY, enabled: true, model, tariff });
const provider = new AnthropicTutorProvider(key);
const base: TutorRequest = {
  id: crypto.randomUUID(),
  conversationId: crypto.randomUUID(),
  locale: 'de',
  noteNaming: 'de',
  mode: 'chat',
  hintLevel: null,
  context: null,
  message: 'test',
};
const sourceTask = {
  kind: 'practice' as const,
  set: 'pitch' as const,
  contentVersion: PRACTICE_CONTENT_VERSION as 1,
  seed: 'tutor-live-original',
  index: 0,
};
const questions: { tool: string; request: TutorRequest }[] = [
  {
    tool: 'analyze_interval',
    request: {
      ...base,
      message:
        'Bestimme C4–Fb4 mit analyze_interval und erkläre, warum vier Halbtonschritte allein die Bezeichnung nicht festlegen.',
    },
  },
  {
    tool: 'build_interval',
    request: {
      ...base,
      locale: 'en-US',
      noteNaming: 'intl',
      message: 'Use build_interval to build a major third above G#4. Explain the spelling.',
    },
  },
  {
    tool: 'build_scale',
    request: {
      ...base,
      locale: 'en-GB',
      noteNaming: 'intl',
      message:
        'Use build_scale for classical melodic A minor descending from A4 including the octave. Explain the seventh and sixth.',
    },
  },
  {
    tool: 'key_signature',
    request: {
      ...base,
      message:
        'Bestimme die Vorzeichnung von B-Dur (international Bb major) mit key_signature und erläutere die Reihenfolge.',
    },
  },
  {
    tool: 'identify_chord',
    request: {
      ...base,
      message: 'Bestimme E4–G4–C5 mit identify_chord; erkläre Grundton und Basston.',
    },
  },
  {
    tool: 'build_chord',
    request: {
      ...base,
      message:
        'Baue mit build_chord einen H-Moll-Dreiklang in erster Umkehrung, Basston in Oktave 4. Internationale Eingabe B.',
    },
  },
  {
    tool: 'get_exercise_context',
    request: {
      ...base,
      mode: 'solution',
      context: { source: sourceTask, answer: null, checked: false },
      message: 'Bitte verwende get_exercise_context und erkläre direkt die Lösung dieser Aufgabe.',
    },
  },
  {
    tool: 'render_example',
    request: {
      ...base,
      message:
        'Prüfe mit render_example ein eigenes kurzes Notenbeispiel: treble | 4/4 | C4/4 D4/4 E4/4 r/4, BPM 90. Erkläre nur die Abfolge, keine ungeprüften Noten-Makros.',
    },
  },
];
const knowledgeCheck =
  Deno.args.includes('--knowledge') || Deno.args.includes('--knowledge-preview');
if (knowledgeCheck) {
  const snapshot = await currentKnowledgeSnapshot(
    Deno.args.includes('--knowledge-preview') ? 'preview' : 'published',
  );
  if (!snapshot.chunks.length)
    throw new Error(
      'Keine freigegebenen Wissensquellen verfügbar. Kein API-Aufruf. Interne Quellen nur ausdrücklich mit --knowledge-preview prüfen.',
    );
  let totalCostNanoUsd = 0,
    passed = 0;
  for (const locale of ['de', 'en-US', 'en-GB'] as const)
    for (const article of [
      'notation.l1.staff.article',
      'rhythm.l1.values.article',
      'history.l2.jazz-pop-sources.article',
    ]) {
      const query = knowledgeQueries.find((q) => q.article === article);
      if (!query) throw new Error('Missing live query');
      const question =
        locale === 'de' ? query.de : locale === 'en-GB' ? (query.uk ?? query.us) : query.us;
      const knowledge = selectKnowledgeChunks(
        snapshot,
        locale,
        snapshot.chunks
          .filter((c) => c.locale === locale && c.articleId === article)
          .sort((a, b) => a.section - b.section || a.part - b.part)
          .map((c) => ({ id: c.id })),
      );
      if (!knowledge.chunks.length) throw new Error('Missing live article');
      const request: TutorRequest = {
        ...base,
        id: crypto.randomUUID(),
        conversationId: crypto.randomUUID(),
        locale,
        noteNaming: locale === 'de' ? 'de' : 'intl',
        message: question,
      };
      const outcome = await runTutor({
        provider,
        request,
        policy,
        context: { available: false },
        history: [],
        knowledge,
        signal: new AbortController().signal,
        emit: () => {
          /* Ergebnis und Zitate werden gemeinsam ausgegeben. */
        },
      });
      const accepted =
        outcome.result.status === 'complete' &&
        outcome.result.sourceState === 'cited' &&
        Boolean(outcome.result.citations?.length) &&
        !outcome.result.errors.includes('invalid_citation');
      totalCostNanoUsd += outcome.usage.costNanoUsd;
      console.log(
        JSON.stringify({
          test: ++passed,
          simulation: false,
          preview: snapshot.lane === 'preview',
          model,
          tariffVersion: tariff.version,
          locale,
          article,
          question,
          passed: accepted,
          answer: outcome.result.text,
          citations: outcome.result.citations,
          errors: outcome.result.errors,
          usage: outcome.usage,
        }),
      );
      if (!accepted)
        throw new Error('Live-Quellenprüfung fehlgeschlagen. Keine automatische Wiederholung.');
    }
  console.log(
    JSON.stringify({
      passed,
      simulation: false,
      preview: snapshot.lane === 'preview',
      totalCostNanoUsd,
      totalCostUsd: totalCostNanoUsd / 1_000_000_000,
      checkedAt: new Date().toISOString(),
    }),
  );
  Deno.exit(0);
}
let total = 0;
for (const [index, q] of questions.entries()) {
  const events: TutorEvent[] = [],
    request = { ...q.request, id: crypto.randomUUID(), conversationId: crypto.randomUUID() },
    outcome = await runTutor({
      provider,
      request,
      policy,
      context: exerciseContext(catalogue, request),
      history: [],
      signal: new AbortController().signal,
      emit: (event) => {
        events.push(event);
      },
    });
  const passed =
    outcome.result.status === 'complete' &&
    events.some((event) => event.type === 'tool' && event.name === q.tool && event.ok) &&
    !outcome.result.errors.includes('tool_error');
  total += outcome.usage.costNanoUsd;
  // Nur eigene Testfragen, geprüfte Beispiele und Nutzungsmetadaten; keine Schlüssel/Profilfelder.
  console.log(
    JSON.stringify({
      test: index + 1,
      expectedTool: q.tool,
      passed,
      simulation: false,
      model,
      tariffVersion: tariff.version,
      locale: request.locale,
      usage: outcome.usage,
      answer: outcome.result.text,
      examples: outcome.result.examples,
      errors: outcome.result.errors,
    }),
  );
  if (!passed)
    throw new Error(
      'Live-Tutor-Prüfung fehlgeschlagen; siehe das datensparsame Testprotokoll. Keine automatische Wiederholung.',
    );
}
console.log(
  JSON.stringify({
    passed: questions.length,
    totalCostNanoUsd: total,
    totalCostUsd: total / 1_000_000_000,
    simulation: false,
    checkedAt: new Date().toISOString(),
  }),
);
