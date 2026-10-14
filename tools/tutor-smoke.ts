import {
  DEFAULT_TUTOR_POLICY,
  tutorRequestSchema,
  tutorPolicySchema,
  tutorToolJsonSchema,
  tutorToolSchemas,
  tutorTariffSchema,
  resolveLesson,
} from '../packages/content/src/index.ts';
import type { TutorRequest, TutorPolicy, TutorToolName } from '../packages/content/src/index.ts';
import { catalogue } from '../packages/content/src/authoring.ts';
import {
  createFreePracticeSession,
  PRACTICE_SETS,
  PRACTICE_CONTENT_VERSION,
  expectedAnswer,
  createLessonSession,
} from '../packages/exercises/src/index.ts';
import {
  TUTOR_TOOLS,
  exerciseContext,
  executeTutorTool,
} from '../supabase/functions/_shared/tutor-tools.ts';
import {
  tutorSystemPrompt,
  TutorTextFilter,
  redactTutorText,
} from '../supabase/functions/_shared/tutor-prompt.ts';
import {
  AnthropicTutorProvider,
  measuredTutorUsage,
  tutorReservation,
} from '../supabase/functions/_shared/tutor-provider.ts';
import { runTutor } from '../supabase/functions/_shared/tutor-runtime.ts';
import type { TutorEvent } from '../supabase/functions/_shared/tutor-runtime.ts';
import {
  localTutorFetch,
  fixtureUsage,
  localTutorFixtureEnabled,
} from '../supabase/functions/_shared/tutor-local-fixture.ts';
let checks = 0;
function check(value: boolean, label: string) {
  if (!value) throw new Error(label);
  checks++;
}
function equal(value: unknown, expected: unknown, label: string) {
  check(JSON.stringify(value) === JSON.stringify(expected), label + ': ' + JSON.stringify(value));
}
const tariff = tutorTariffSchema.parse({
  version: 'synthetic-test-only',
  source: 'https://example.invalid/test-tariff',
  verifiedAt: '2026-10-14T00:00:00Z',
  input: 5000,
  output: 25000,
  cacheRead: 500,
  cacheWrite5m: 6250,
  cacheWrite1h: 10000,
});
const policy: TutorPolicy = {
  ...DEFAULT_TUTOR_POLICY,
  enabled: true,
  model: 'synthetic-test-model',
  tariff,
};
const request: TutorRequest = {
  id: '11111111-1111-4111-8111-111111111111',
  conversationId: '22222222-2222-4222-8222-222222222222',
  message: 'fixture:tools',
  locale: 'de',
  noteNaming: 'de',
  mode: 'chat',
  hintLevel: null,
  context: null,
};
const tool = (name: string, input: unknown) =>
  executeTutorTool(name, input, request, { available: false });
equal(
  tool('analyze_interval', { from: 'C4', to: 'Fb4' }),
  { ok: true, interval: 'd4', name: 'verminderte Quarte', semitones: 4, direction: 1 },
  'Enharmonic spelling',
);
equal(
  tool('analyze_interval', { from: 'C4', to: 'E4' }),
  { ok: true, interval: 'M3', name: 'große Terz', semitones: 4, direction: 1 },
  'Equal semitones, different interval',
);
check(
  JSON.stringify(tool('build_interval', { from: 'B3', interval: '-M3' })).includes('G3'),
  'Descending spelled transposition',
);
check(
  JSON.stringify(tool('build_interval', { from: 'C4', interval: 'M3' })).includes('E4'),
  'Build major third',
);
check(
  JSON.stringify(tool('build_interval', { from: 'C4', interval: 'M3', userId: 'other' })).includes(
    'invalid_tool_input',
  ),
  'Extra tool parameters rejected',
);
check(
  JSON.stringify(tool('build_interval', { from: 'G##4', interval: 'M7' })).includes(
    'invalid_tool_input',
  ),
  'Triple accidental refused',
);
check(
  JSON.stringify(tool('analyze_interval', { from: 'C99', to: 'D99' })).includes(
    'invalid_tool_input',
  ),
  'Playable range checked',
);
const scale = tool('build_scale', {
  tonic: 'A4',
  type: 'melodicMinor',
  direction: 'descending',
  includeOctave: true,
});
check(
  'pitches' in scale && scale.pitches.map((p) => p.id).join(' ') === 'A4 G4 F4 E4 D4 C4 B3 A3',
  'Classical descending melodic minor',
);
const signature = tool('key_signature', { tonic: 'G', mode: 'major' });
check(
  'accidentals' in signature && signature.accidentals.join(' ') === 'F#',
  'Key signature ordered',
);
check(
  JSON.stringify(tool('key_signature', { tonic: 'G#', mode: 'major' })).includes(
    'invalid_tool_input',
  ),
  'Eight-sharp key unsupported',
);
const built = tool('build_chord', { root: 'C', type: 'major', inversion: 1, bassOctave: 4 });
check(
  'pitches' in built && built.pitches.map((p) => p.id).join(' ') === 'E4 G4 C5',
  'Bass octave and inversion',
);
check(
  JSON.stringify(tool('identify_chord', { pitches: ['E4', 'G4', 'C5'] })).includes('"inversion":1'),
  'Identify spelled inversion',
);
const wrongSpelling = tool('identify_chord', { pitches: ['C4', 'E4', 'Ab4'] });
check(
  'matches' in wrongSpelling && wrongSpelling.matches.every((m) => m.chord.root.letter !== 'C'),
  'Enharmonic wrong triad spelling',
);
check(
  JSON.stringify(
    tool('build_chord', { root: 'C', type: 'dominant7', inversion: 0, bassOctave: 4 }),
  ).includes('invalid_tool_input'),
  'Unsupported seventh chord refused',
);
check(
  'example' in tool('render_example', { source: 'treble | 4/4 | C4/4 r/4 (E4 G4)/2', bpm: 90 }),
  'Valid score and rests',
);
for (const source of [
  'treble | 4/4 | C4/4',
  'treble | 4/4 | C4/1 C4/4',
  'treble | 4/4 | C4/1 & E4/1',
  'treble | 4/4 | C99/1',
  'treble | 4/4 | C4/1~',
]) {
  check(
    !('example' in tool('render_example', { source, bpm: 90 })),
    'Invalid score never emitted: ' + source,
  );
}
check(
  'example' in tool('render_example', { source: 'treble | 4/4 | C4/1\nbass | 4/4 | r/1', bpm: 90 }),
  'Bounded grand staff',
);
check(
  !(
    'example' in
    tool('render_example', { source: 'treble | 4/4 | C4/2 D4/2\nbass | 4/4 | C3/1', bpm: 90 })
  ),
  'General multi-staff score deferred',
);
check(!tool('fetch_url', { url: 'https://example.invalid' }).ok, 'No network tool');
for (const name of Object.keys(tutorToolSchemas) as TutorToolName[]) {
  const schema = tutorToolJsonSchema(name);
  check(schema.additionalProperties === false, 'Closed tool object: ' + name);
  equal(
    [...(schema.required ?? [])].sort(),
    Object.keys(schema.properties ?? {}).sort(),
    'Every strict tool property required: ' + name,
  );
}
check(
  TUTOR_TOOLS.every((t) => t.strict),
  'Strict provider tools',
);
check(
  !!TUTOR_TOOLS.at(-1)?.cache_control && TUTOR_TOOLS.filter((t) => t.cache_control).length === 1,
  'Stable tool prefix cached',
);
check(
  !tutorRequestSchema.safeParse({ ...request, history: [{ role: 'system' }] }).success,
  'No client-provided history',
);
check(
  !tutorRequestSchema.safeParse({ ...request, mode: 'explain' }).success,
  'Explain requires evaluated answer',
);
check(
  !tutorRequestSchema.safeParse({ ...request, mode: 'hint', hintLevel: 3 }).success,
  'Solution is separate mode',
);
check(
  !tutorPolicySchema.safeParse({ ...DEFAULT_TUTOR_POLICY, enabled: true }).success,
  'Activation requires model and tariff',
);
check(!tutorTariffSchema.safeParse({ ...tariff, output: 0.5 }).success, 'Integer Nano-USD tariff');
const task = createFreePracticeSession('pitch', 'tutor-context').items[0];
if (!task) throw new Error('Task');
const source = {
  kind: 'practice' as const,
  set: 'pitch' as const,
  contentVersion: PRACTICE_CONTENT_VERSION as 1,
  seed: 'tutor-context',
  index: 0,
};
const hint = {
  ...request,
  mode: 'hint' as const,
  hintLevel: 1 as const,
  context: { source, answer: null, checked: false },
};
const hintContext = exerciseContext(catalogue, hint);
check(
  !('solution' in hintContext) && !('evaluation' in hintContext) && !('feedback' in hintContext),
  'Hint context contains no grading/solution',
);
const explained = exerciseContext(catalogue, {
  ...hint,
  mode: 'explain',
  hintLevel: null,
  context: { source, answer: expectedAnswer(task), checked: true },
});
check('evaluation' in explained && explained.evaluation.correct, 'Recomputed checked answer');
const wrong = exerciseContext(catalogue, {
  ...hint,
  mode: 'explain',
  hintLevel: null,
  context: { source, answer: 'untrusted-wrong', checked: true },
});
check('evaluation' in wrong && !wrong.evaluation.correct, 'Client cannot assert a correct answer');
const seenTypes = new Set<string>();
for (const entry of catalogue.lessons) {
  const lesson = resolveLesson(catalogue, entry.id);
  if (!lesson) throw new Error('Lesson source');
  const items = createLessonSession(lesson, 'tutor-all-types').initial.items;
  for (const [index, item] of items.entries()) {
    if (seenTypes.has(item.type)) continue;
    seenTypes.add(item.type);
    const source = {
      kind: 'lesson' as const,
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      seed: 'tutor-all-types',
      round: 'initial' as const,
      index,
    };
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const checked = exerciseContext(catalogue, {
        ...request,
        locale,
        mode: 'explain',
        context: { source, answer: expectedAnswer(item), checked: true },
      });
      check(
        'evaluation' in checked &&
          checked.evaluation.correct &&
          checked.feedback.message.length > 0,
        'Checked context ' + item.type + ' ' + locale,
      );
      const hint = exerciseContext(catalogue, {
        ...request,
        locale,
        mode: 'hint',
        hintLevel: 2,
        context: { source, answer: null, checked: false },
      });
      check(
        !('solution' in hint) && !('feedback' in hint),
        'Non-solution hint context ' + item.type + ' ' + locale,
      );
    }
  }
}
for (const set of PRACTICE_SETS) {
  const items = createFreePracticeSession(set, 'tutor-free-types').items;
  for (const [index, item] of items.entries()) {
    if (seenTypes.has(item.type)) continue;
    seenTypes.add(item.type);
    const source = {
      kind: 'practice' as const,
      set,
      contentVersion: PRACTICE_CONTENT_VERSION as 1,
      seed: 'tutor-free-types',
      index,
    };
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const checked = exerciseContext(catalogue, {
        ...request,
        locale,
        mode: 'explain',
        context: { source, answer: expectedAnswer(item), checked: true },
      });
      check(
        'evaluation' in checked &&
          checked.evaluation.correct &&
          checked.feedback.message.length > 0,
        'Free checked context ' + item.type + ' ' + locale,
      );
      const hint = exerciseContext(catalogue, {
        ...request,
        locale,
        mode: 'hint',
        hintLevel: 2,
        context: { source, answer: null, checked: false },
      });
      check(
        !('solution' in hint) && !('feedback' in hint),
        'Free hint context ' + item.type + ' ' + locale,
      );
    }
  }
}
equal(seenTypes.size, 19, 'Every current exercise type reconstructed');
for (const locale of ['de', 'en-US', 'en-GB'] as const) {
  const prompt = tutorSystemPrompt({ ...request, locale });
  check(prompt[0]?.text.includes(locale) === true, 'Requested language');
  check(
    prompt[0]?.text.includes(
      locale === 'en-GB' ? 'crotchet' : locale === 'en-US' ? 'quarter note' : 'Viertelnote',
    ) === true,
    'US/UK/DE glossary',
  );
  check(prompt[0]?.cache_control.type === 'ephemeral', 'Stable prompt cached');
}
equal(
  redactTutorText('Kontakt test@example.invalid ist unnötig.'),
  'Kontakt [email] ist unnötig.',
  'Email redaction',
);
for (const pieces of [
  ['Vorher [[no', 'tes:C4/1]] danach.'],
  ['Vorher [[notes:C4/1'],
  ['Hallo test@', 'example.invalid danach.'],
]) {
  const filter = new TutorTextFilter();
  const text = pieces.map((p) => filter.push(p)).join('') + filter.push('', true);
  check(
    !text.includes('[[notes:') && !text.includes('C4/1') && !text.includes('test@example.invalid'),
    'Split markers/emails suppressed',
  );
}
check(
  !localTutorFixtureEnabled((key) =>
    key === 'HARMONIA_TUTOR_LOCAL_TEST' ? 'true' : 'https://remote.supabase.co',
  ),
  'Remote cannot activate fixture',
);
check(
  localTutorFixtureEnabled((key) =>
    key === 'HARMONIA_TUTOR_LOCAL_TEST' ? 'true' : 'http://supabase_kong_harmonia:8000',
  ),
  'Explicit local fixture',
);
const measured = measuredTutorUsage(fixtureUsage, tariff);
equal(measured.costNanoUsd, 2_975_000, 'Synthetic tariff exact arithmetic');
check(!measured.estimated, 'Known 5-minute cache write');
check(
  measuredTutorUsage({ ...fixtureUsage, cache_creation: null }, tariff).estimated,
  'Unknown cache split marked estimated',
);
const events: TutorEvent[] = [];
const run = (
  message: string,
  extra: Partial<TutorPolicy> = {},
  signal = new AbortController().signal,
) =>
  runTutor({
    provider: new AnthropicTutorProvider('no-secret', localTutorFetch),
    request: { ...request, message },
    policy: { ...policy, ...extra },
    context: { available: false },
    history: [],
    signal,
    emit: (e) => {
      events.push(e);
    },
  });
const captured: string[] = [];
const spy: typeof fetch = (url, options) => {
  captured.push(typeof options?.body === 'string' ? options.body : '');
  const target = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
  check(target === 'https://api.anthropic.com/v1/messages', 'Fixed provider host');
  return localTutorFetch(url, options);
};
const traced = await runTutor({
  provider: new AnthropicTutorProvider('no-secret', spy),
  request: { ...request, message: 'fixture:tools contact@example.invalid' },
  policy,
  context: { available: false },
  history: [],
  signal: new AbortController().signal,
  emit: () => {
    /* Transport assertions below. */
  },
});
check(traced.result.status === 'complete' && captured.length === 2, 'Actual SDK continuation');
check(
  captured.every(
    (body) =>
      !body.includes(request.id) &&
      !body.includes(request.conversationId) &&
      !body.includes('contact@example.invalid'),
  ),
  'No actor/request IDs or email sent',
);
check(
  captured[1]?.includes('tool_result') === true && captured[1].includes('tool_1_0'),
  'Tool result IDs match assistant uses',
);
const outcome = await run('fixture:tools');
equal(outcome.result.status, 'complete', 'SDK SSE tool loop complete');
check(events.filter((e) => e.type === 'tool').length === 4, 'Actual SDK tool events');
check(events.filter((e) => e.type === 'example').length === 1, 'Only verified score emitted');
equal(outcome.usage.inputTokens, 200, 'Two round input tokens');
equal(outcome.usage.cacheReadTokens, 400, 'Cache reads across rounds');
equal(outcome.usage.cacheWrite5mTokens, 600, 'Cache writes across rounds');
equal(outcome.usage.costNanoUsd, 5_950_000, 'Every round charged once');
check(outcome.result.text.includes('d4'), 'Tool result reaches continuation');
equal((await run('fixture:refusal')).result.status, 'refused', 'Refusal logged');
const failure = await run('fixture:error');
equal(failure.result.status, 'failed', 'Provider error sanitized');
check(
  failure.usage.estimated && failure.usage.costNanoUsd === tutorReservation(policy),
  'Unknown consumption conservatively reserved',
);
const limited = await run('fixture:tools fixture:loop', { maxRounds: 2 });
equal(limited.result.status, 'partial', 'Tool round cap');
check(limited.result.errors.includes('round_limit'), 'Explicit bounded-loop outcome');
const tooMany = await run('fixture:tools', { maxToolsPerRound: 1 });
check(tooMany.result.errors.includes('tool_limit'), 'Tool fan-out cap');
const small = await run('fixture:tools', { maxInputTokens: 1024 });
check(
  small.result.errors.includes('input_limit') && small.usage.costNanoUsd === 0,
  'No provider request beyond input budget',
);
const markup = await run('fixture:markup');
check(
  markup.result.errors.includes('unverified_example') && !markup.result.text.includes('C4/1'),
  'Model cannot send unchecked notation',
);
const cancelled = new AbortController();
cancelled.abort();
const before = await run('fixture:tools', {}, cancelled.signal);
check(
  before.result.status === 'cancelled' && before.usage.costNanoUsd === 0,
  'Cancellation before API consumes zero',
);
const timeout = await run('fixture:timeout', { timeoutMs: 5000 });
check(
  timeout.result.errors.includes('timeout') && timeout.usage.estimated,
  'SDK timeout stops stream and accounts unknown usage',
);
const during = new AbortController(),
  timer = setTimeout(() => {
    during.abort();
  }, 50);
const after = await run('fixture:timeout', {}, during.signal);
clearTimeout(timer);
check(
  after.result.status === 'cancelled' && after.usage.estimated,
  'Cancellation after API admission is accounted',
);
console.log(
  `${String(checks)} Tutor-/SDK-/Engine-Prüfungen bestanden; ausschließlich simulierte API und Testtarif.`,
);
