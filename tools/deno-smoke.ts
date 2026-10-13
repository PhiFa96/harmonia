// Prüft Theorie-Engine und Übungs-Framework unter Deno (Laufzeit der Supabase Edge Functions).
// Aufruf: pnpm check:deno

import {
  createRng as exerciseRng,
  generateExercise,
  evaluateExercise,
  expectedAnswer,
  exerciseFeedback,
  createLessonSession,
  LISTENING_QUESTIONS,
  generateListening,
  listeningAnswer,
  listeningTimeline,
  answerLesson,
  nextLessonExercise,
  lessonSummary,
  generateNotePlace,
  generateNote,
  generateKeyFind,
  generateIntervalBuild,
  generateVisualInterval,
  generateScale,
  generateKeySignature,
  generateChord,
  generateRhythm,
  generateKnowledge,
  generateMatch,
  generateOrder,
  pulseExample,
  measureGapFact,
  knowledgeFactId,
  rhythmOnsets,
  CONTEXT_TOPICS,
  generateContext,
  contextAnswer,
  octaveName,
} from '../packages/exercises/src/index.ts';
import { firstLesson, catalogue, curriculumPlan } from '../packages/content/src/authoring.ts';
import { publicCatalogue, resolveLesson, curriculumSkills } from '../packages/content/src/index.ts';
import { parseScore, scoreTimeline, layoutGrandStaff } from '../packages/notation/src/index.ts';

import {
  buildScale,
  checkMeasure,
  duration,
  durationName,
  durationSeconds,
  durationValue,
  formatFraction,
  parseTimeSignature,
  TRIPLET,
  chordName,
  chordSymbol,
  identifyChord,
  identifyChordFromMidi,
  createRng,
  diatonicTriads,
  formatInterval,
  frequency,
  intervalBetween,
  intervalName,
  key,
  keyName,
  keySignature,
  midi,
  parseNoteName,
  parsePitch,
  pitchName,
  relativeKey,
  transpose,
} from '../packages/theory/src/index.ts';

function check(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${label}: erwartet ${String(expected)}, erhalten ${String(actual)}`);
  }
  console.log(`ok  ${label}`);
}

const exercise = generateExercise(
  { type: 'INTERVAL_IDENTIFY_VISUAL', params: { intervals: ['m3', 'M3', 'P5'] } },
  exerciseRng('deno-exercises'),
);
const plannedSkills = curriculumSkills(catalogue, curriculumPlan);
check('85 interne Lektionen in Stufe 1 und 2', catalogue.lessons.length, 85);
let internalTasks = 0;
for (const record of catalogue.lessons) {
  const lesson = resolveLesson(catalogue, record.id);
  if (!lesson) throw new Error('Lektion fehlt');
  let state = createLessonSession(lesson, 'deno-all-lessons');
  for (const item of state.initial.items)
    state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
  if (state.phase !== 'complete' || lessonSummary(state).correct !== lesson.exercises.length)
    throw new Error('Interner Lektionsdurchgang fehlerhaft');
  internalTasks += lesson.exercises.length;
}
check('Alle 850 internen Aufgaben unter Deno durchspielbar', internalTasks, 850);
check(
  'Alle elf Hörfrageformen unter Deno bewertbar',
  LISTENING_QUESTIONS.every((question) => {
    const item = generateListening({ question }, exerciseRng(question));
    return (
      evaluateExercise(item, listeningAnswer(item)).correct &&
      listeningTimeline(item).tones.length > 0
    );
  }),
  true,
);
check(
  'Sechs Epochen unter Deno aufsteigend ordnen',
  expectedAnswer(
    generateOrder(
      { topics: ['periods'], count: 6, direction: 'ascending' },
      exerciseRng('deno-history-order'),
    ),
  ),
  'order:period:medieval,period:renaissance,period:baroque,period:classical,period:romantic,period:since1900',
);
check(
  'Erste Intervallqualitäten mit acht, zehn und zwölf Aufgaben',
  ['distance', 'thirds', 'perfect']
    .map(
      (name) => resolveLesson(catalogue, `intervals.l1.first-qualities.${name}`)?.exercises.length,
    )
    .join(','),
  '8,10,12',
);
const firstQuality = generateVisualInterval(
  { intervals: ['m3', 'M3'], question: 'quality', maxAccidentals: 0 },
  exerciseRng('deno-first-quality'),
);
check(
  'Kleine und große Terz aus sichtbaren Noten unter Deno',
  ['treble | 4/4 | E4/2 G4/2', 'treble | 4/4 | G4/2 B4/2']
    .map((score) => expectedAnswer({ ...firstQuality, score: parseScore(score) }))
    .join(','),
  'm3,M3',
);
check(
  'Abwärts bleibt der Halbtonabstand positiv unter Deno',
  expectedAnswer({
    ...firstQuality,
    question: 'semitones',
    score: parseScore('treble | 4/4 | G4/2 F4/2'),
  }),
  'interval-semitones:2',
);
check(
  'Beide Tritonus-Schreibweisen sind keine reinen Intervalle unter Deno',
  ['treble | 4/4 | F4/2 B4/2', 'treble | 4/4 | B4/2 F5/2']
    .map((score) =>
      expectedAnswer({ ...firstQuality, question: 'perfect', score: parseScore(score) }),
    )
    .join(','),
  'interval-perfect:no,interval-perfect:no',
);
check(
  'Intervallgrundlagen mit acht, zehn und zwölf Aufgaben',
  ['numbers', 'direction', 'motion']
    .map((name) => resolveLesson(catalogue, `intervals.l1.size.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
const intervalNumber = generateVisualInterval(
  { intervals: ['P1', 'M3', 'P8'], question: 'number', maxAccidentals: 0 },
  exerciseRng('deno-interval-number'),
);
check(
  'Oktavnummer aus zwei sichtbaren Halben unter Deno',
  expectedAnswer({ ...intervalNumber, score: parseScore('treble | 4/4 | E4/2 E5/2') }),
  'interval-number:8',
);
const intervalMotion = generateVisualInterval(
  { intervals: ['P1', 'm2', 'M2', 'M3'], question: 'motion', maxAccidentals: 0 },
  exerciseRng('deno-interval-motion'),
);
check(
  'Halbton und Ganzton sind beide Tonschritte unter Deno',
  ['treble | 4/4 | E4/2 F4/2', 'treble | 4/4 | F4/2 G4/2']
    .map((score) => expectedAnswer({ ...intervalMotion, score: parseScore(score) }))
    .join(','),
  'interval-motion:step,interval-motion:step',
);
check(
  'Pulseinheit mit acht, zehn und zwölf Aufgaben',
  ['steady', 'tempo', 'groups']
    .map((name) => resolveLesson(catalogue, `rhythm.l1.pulse.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
check(
  '21 Kontextfragen mit quellenbezogenen Lösungen unter Deno',
  CONTEXT_TOPICS.every((topic) => {
    const item = generateContext({ topics: [topic] }, exerciseRng(topic));
    return evaluateExercise(item, contextAnswer(item)).correct;
  }),
  true,
);
check(
  'Achteltriole mit echten 333-ms-Abständen unter Deno',
  rhythmOnsets(
    generateRhythm(
      { meters: ['2/4'], level: 'triplets', rests: false, tempos: [60] },
      exerciseRng('deno-triplets'),
      'RHYTHM_TAP',
    ),
  ).join(','),
  '0,333,667,1000,1333,1667',
);
check(
  'Neue Periodenquellen unter Deno',
  expectedAnswer(
    generateContext(
      { topics: ['period-context'], years: [1250, 1550] },
      exerciseRng('deno-history'),
    ),
  ).startsWith('period:'),
  true,
);
const grand = generateKeyFind({ presentation: 'grand-staff' }, exerciseRng('deno-grand'));
check(
  'Großes Lernsystem hat zehn Linien unter Deno',
  layoutGrandStaff(grand.score).items.filter((i) => i.kind === 'line' && i.role === 'staffLine')
    .length,
  10,
);
check(
  'Großes Lernsystem spielt nur einen Zielton',
  scoreTimeline(grand.score, { bpm: 90 }).tones.length,
  1,
);
const namedOctave = {
  ...generateNote(
    {
      presentation: 'octave-name',
      sourceSystem: 'scientific',
      range: { minMidi: 48, maxMidi: 77 },
    },
    exerciseRng('deno-octave'),
  ),
  score: parseScore('treble | 4/4 | B3/1'),
};
check(
  'Internationales B3 als deutsche Helmholtz-Antwort',
  octaveName(namedOctave, 'de', false),
  'h',
);
check('Oktavnamenslösung folgt der Quelle unter Deno', expectedAnswer(namedOctave), 'B3');
const pulse = pulseExample(parseScore('treble | 3/4 | G4/4 G4/4 G4/4'), 90);
check(
  'Pulsbeispiel mit unabhängigen Millisekunden unter Deno',
  rhythmOnsets(pulse).join(','),
  '0,667,1333',
);
check(
  'Pulsmodus erzeugt gleichmäßige Zählgruppen unter Deno',
  generateRhythm(
    { meters: ['3/4'], level: 'pulse', tempos: [90] },
    exerciseRng('deno-pulse'),
    'RHYTHM_TAP',
  ).presentation,
  'pulse',
);
check(
  'Einfache Taktarten mit acht, zehn und zwölf Aufgaben',
  ['meter', 'count-in', 'read']
    .map((name) => resolveLesson(catalogue, `rhythm.l1.simple-meter.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
check(
  'Viertelmodus erzeugt drei notierte Einsätze in 3/4 unter Deno',
  rhythmOnsets(
    generateRhythm(
      { meters: ['3/4'], level: 'quarters', rests: false, tempos: [90] },
      exerciseRng('deno-quarters'),
      'RHYTHM_TAP',
    ),
  ).length,
  3,
);
const pickup = generateExercise(
  { type: 'METER_IDENTIFY', params: { meters: ['2/4', '3/4', '4/4'], presentation: 'pickup' } },
  exerciseRng('deno-pickup'),
);
check(
  'Auftaktfrage bewertet den notierten Takt unter Deno',
  pickup.type === 'METER_IDENTIFY' && evaluateExercise(pickup, expectedAnswer(pickup)).correct,
  true,
);
check(
  'Registereinheit mit acht, zehn und zwölf Aufgaben',
  ['octaves', 'ledger', 'match']
    .map((name) => resolveLesson(catalogue, `notation.l1.register.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
const registerNote = generateNote(
  { includeOctave: true, range: { minMidi: 64, maxMidi: 77 } },
  exerciseRng('deno-register-note'),
);
check(
  'Oktavgenaue Namensantwort unter Deno',
  registerNote.includeOctave === true &&
    evaluateExercise(registerNote, expectedAnswer(registerNote)).correct,
  true,
);
const registerKey = generateKeyFind(
  { presentation: 'score', range: { minMidi: 57, maxMidi: 84 } },
  exerciseRng('deno-register-key'),
);
check(
  'Score-Tastenfrage mit A3–C6 unter Deno',
  `${String(registerKey.presentation)}:${String(registerKey.keyboardRange?.first)}-${String(registerKey.keyboardRange?.last)}:${String(evaluateExercise(registerKey, expectedAnswer(registerKey)).correct)}`,
  'score:57-84:true',
);
check(
  'Erste Notationseinheit mit acht, zehn und zwölf Aufgaben',
  ['anchor', 'positions', 'reading']
    .map((name) => resolveLesson(catalogue, `notation.l1.staff.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
check(
  'Vollständiges Notenbeispiel mit acht Tönen',
  scoreTimeline(parseScore('treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4'), {
    bpm: 120,
  }).tones.length,
  8,
);
check(
  'Klaviatureinheit mit acht, zehn und zwölf Aufgaben',
  ['keys', 'steps', 'accidentals']
    .map((name) => resolveLesson(catalogue, `notation.l1.keyboard.${name}`)?.exercises.length)
    .join(','),
  '8,10,12',
);
const namedKey = generateKeyFind(
  { presentation: 'name', range: { minMidi: 60, maxMidi: 71 }, maxAccidentals: 1 },
  exerciseRng('deno-named-key'),
);
check(
  'Tastenfrage mit Tonnamen und festem Ausschnitt',
  `${String(namedKey.presentation)}:${String(namedKey.keyboardRange?.first)}-${String(namedKey.keyboardRange?.last)}:${String(evaluateExercise(namedKey, expectedAnswer(namedKey)).correct)}`,
  'name:60-71:true',
);
check(
  'Klaviaturwissen und einfache Vorzeichen unter Deno',
  [
    generateKnowledge({ topics: ['keyboard'] }, exerciseRng('deno-keyboard-knowledge')),
    generateKnowledge(
      { topics: ['accidentals'], maxAccidentals: 1 },
      exerciseRng('deno-basic-accidentals'),
    ),
  ]
    .map(
      (item) =>
        `${item.fact.topic}:${String(item.choices.length)}:${String(evaluateExercise(item, expectedAnswer(item)).correct)}`,
    )
    .join(','),
  'keyboard:4:true,accidentals:3:true',
);
check('Vollständiger Fähigkeitsplan', plannedSkills.length, catalogue.skills.length);
check(
  'Fähigkeiten den Stufen 1–2 zugeordnet',
  [...new Set(plannedSkills.map((entry) => entry.level.number))].join(','),
  '1,2',
);
check(
  'Gehörbildung beginnt ohne Notationsvoraussetzung',
  plannedSkills.find((entry) => entry.skill.id === 'aural.pitch-direction')?.skill.prerequisites
    .length,
  0,
);
check('Öffentlicher Katalog enthält keinen Entwurf', publicCatalogue(catalogue).lessons.length, 0);
check(
  'Unveröffentlichte Lektion nicht auflösbar',
  resolveLesson(publicCatalogue(catalogue), firstLesson.id),
  undefined,
);
check(
  'Versionierte Lektion mit zehn Aufgaben',
  createLessonSession(firstLesson, 'deno-lesson').initial.items.length,
  10,
);
const evaluation = evaluateExercise(exercise, expectedAnswer(exercise));
for (const item of [
  generateKnowledge({ topics: ['intervals', 'noteValues'] }, exerciseRng('deno-knowledge')),
  generateMatch({ topics: ['triads', 'accidentals'], count: 3 }, exerciseRng('deno-match')),
  generateOrder({ topics: ['noteValues', 'pitches'], count: 4 }, exerciseRng('deno-order')),
  generateRhythm(
    { meters: ['2/4', '3/4', '4/4', '6/8'], level: 'dotted' },
    exerciseRng('deno-rhythm'),
    'RHYTHM_TAP',
  ),
  generateRhythm(
    { meters: ['2/4', '3/4', '4/4', '6/8'] },
    exerciseRng('deno-meter'),
    'METER_IDENTIFY',
  ),
  generateNotePlace({ clefs: ['treble', 'bass'], maxAccidentals: 2 }, exerciseRng('deno-place')),
  generateKeyFind({ maxAccidentals: 1 }, exerciseRng('deno-key')),
  generateIntervalBuild(
    { intervals: ['m3', 'M3', 'P5'], direction: 'both' },
    exerciseRng('deno-build'),
  ),
  generateScale(
    { types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'] },
    exerciseRng('deno-scale-build'),
    'SCALE_BUILD',
  ),
  generateScale(
    { types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'] },
    exerciseRng('deno-scale-identify'),
    'SCALE_IDENTIFY',
  ),
  generateKeySignature(
    { modes: ['major', 'minor'] },
    exerciseRng('deno-signature-build'),
    'KEYSIG_BUILD',
  ),
  generateKeySignature(
    { modes: ['major', 'minor'] },
    exerciseRng('deno-signature-identify'),
    'KEYSIG_IDENTIFY',
  ),
  generateChord(
    { types: ['major', 'minor', 'diminished', 'augmented'], inversions: [0, 1, 2] },
    exerciseRng('deno-chord-build'),
    'CHORD_BUILD',
  ),
  generateChord(
    { types: ['major', 'minor', 'diminished', 'augmented'] },
    exerciseRng('deno-chord-visual'),
    'CHORD_IDENTIFY',
  ),
  generateChord(
    { types: ['major', 'minor', 'diminished', 'augmented'], presentation: 'aural' },
    exerciseRng('deno-chord-aural'),
    'CHORD_IDENTIFY',
  ),
])
  check(
    `${item.type}: freie Eingabe unter Deno`,
    evaluateExercise(item, expectedAnswer(item)).correct,
    true,
  );
check('Übungsgenerator und Engine-Bewertung', evaluation.correct, true);
check(
  'Übungserklärung DE',
  exerciseFeedback(exercise, evaluation, 'de').message.includes('Klangabstand'),
  true,
);
check(
  'Übungserklärung UK',
  exerciseFeedback(exercise, evaluation, 'en-GB').message.includes('semitones'),
  true,
);

for (const topic of ['noteValues', 'rests'] as const) {
  for (const presentation of ['symbol', 'measure-gap'] as const) {
    const item = generateKnowledge(
      { topics: [topic], maxDots: 0, presentation },
      exerciseRng('deno-values'),
    );
    check(
      `${topic}/${presentation}: quellbasierte Bewertung unter Deno`,
      item.choices.filter((id) => evaluateExercise(item, id).correct).join(','),
      item.gap ? knowledgeFactId(measureGapFact(item.gap)) : knowledgeFactId(item.fact),
    );
  }
}

check('midi(C4)', midi(parsePitch('C4')), 60);
check('frequency(A4)', frequency(parsePitch('A4')), 440);
check('verminderte Quarte C4 → Fb4', pitchName(transpose(parsePitch('C4'), 3, 4)), 'F♭4');
check(
  'Helmholtz fis¹',
  pitchName(parsePitch('F#4'), { system: 'de', octave: 'helmholtz' }),
  'fis¹',
);
check('Heses', pitchName(parsePitch('Bbb3'), { system: 'de', octave: 'none' }), 'Heses');
check('Seed deterministisch', createRng('duell').int(0, 1000), createRng('duell').int(0, 1000));
check(
  'Intervall C4 → Fb4',
  formatInterval(intervalBetween(parsePitch('C4'), parsePitch('Fb4'))),
  'd4',
);
check(
  'Intervallname',
  intervalName(intervalBetween(parsePitch('C4'), parsePitch('A3'))),
  'kleine Terz abwärts',
);
check(
  'Tonleiter gis-Moll harmonisch',
  buildScale(parsePitch('G#4'), 'harmonicMinor')
    .map((n) => pitchName(n, { system: 'de', octave: 'none' }))
    .join(' '),
  'Gis Ais H Cis Dis E Fisis',
);
check('Vorzeichen Es-Dur', keySignature(key(parseNoteName('Eb'))).length, 3);
check('Paralleltonart von Es-Dur', keyName(relativeKey(key(parseNoteName('Eb')))), 'c-Moll');
check(
  'Dreiklang auf der 7. Stufe von C-Dur',
  diatonicTriads(key(parseNoteName('C'))).at(-1)?.quality,
  'diminished',
);
const sixthChord = identifyChord(['E3', 'G3', 'C4'].map((t) => parsePitch(t)))[0];
check('Akkord E–G–C', sixthChord ? chordName(sixthChord.chord) : undefined, 'C-Dur-Sextakkord');
const [keyboardChord] = identifyChordFromMidi([52, 55, 60]);
check(
  'Akkordsymbol aus MIDI 52, 55, 60',
  keyboardChord ? chordSymbol(keyboardChord.chord) : undefined,
  'C/E',
);
check(
  '6/8-Takt mit punktierter Viertel und drei Achteln',
  checkMeasure(
    [duration('quarter', 1), duration('eighth'), duration('eighth'), duration('eighth')],
    parseTimeSignature('6/8'),
  ).status,
  'complete',
);
check(
  'Triolenachtel als Bruch',
  formatFraction(durationValue(duration('eighth', 0, TRIPLET))),
  '1/12',
);
check(
  'Triolenachtel bei ♩ = 120 in Millisekunden',
  Math.round(durationSeconds(duration('eighth', 0, TRIPLET), { bpm: 120 }) * 1000),
  167,
);
check(
  'UK-Name',
  durationName(duration('quarter', 1), { language: 'en', variant: 'uk' }),
  'dotted crotchet',
);
console.log('Theorie-Engine, Übungen und erste Lektion laufen unter Deno.');
