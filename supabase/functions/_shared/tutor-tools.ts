import {
  tutorToolSchemas,
  tutorToolJsonSchema,
  resolveReportSource,
} from '../../../packages/content/src/index.ts';
import type {
  ContentCatalogue,
  TutorRequest,
  TutorToolName,
} from '../../../packages/content/src/index.ts';
import {
  parsePitch,
  parseNoteName,
  parseInterval,
  intervalBetween,
  formatInterval,
  intervalName,
  semitones,
  transposeBy,
  buildScale,
  key,
  keyFifths,
  keySignature,
  keyName,
  formatNoteName,
  chord,
  chordPitches,
  chordName,
  identifyChord,
  midi,
  formatPitch,
  pitchName,
} from '../../../packages/theory/src/index.ts';
import type { Pitch } from '../../../packages/theory/src/index.ts';
import type { LearnerContext } from './tutor-learner.ts';
import {
  parseScore,
  validateScore,
  scoreTimeline,
  grandStaffTarget,
} from '../../../packages/notation/src/index.ts';
import {
  exercisePrompt,
  exerciseDescription,
  exerciseHints,
  hintText,
  expectedAnswer,
  evaluateExercise,
  exerciseFeedback,
  choiceLabel,
  isAuralExercise,
} from '../../../packages/exercises/src/index.ts';

const descriptions: Record<TutorToolName, string> = {
  analyze_interval:
    'Determine the spelled interval, direction and semitones between two canonical pitches.',
  build_interval: 'Transpose a canonical pitch by a spelled interval, e.g. M3 or -P5.',
  build_scale:
    'Build a correctly spelled scale. Descending melodic minor follows the classical natural-minor convention.',
  key_signature: 'Compute ordered accidentals for a major or minor key (at most seven).',
  identify_chord:
    'Identify spelled triads and inversions; returns all matches. Seventh chords are not supported yet.',
  build_chord:
    'Build a major/minor/diminished/augmented triad in close position. bassOctave is the bass octave, not root octave.',
  get_exercise_context:
    'Read the server-reconstructed CURRENT task and allowed hint or verified feedback. No task ID or user ID parameter.',
  get_learner_summary:
    'Read aggregate strengths and practice needs from verified skill ratings for the current authenticated learner. No account identifier parameter.',
  analyze_progression:
    'Read completed lesson count, currently open lessons and a short weekly study suggestion from the current authenticated learner. No account identifier parameter.',
  render_example:
    'Validate a short Harmonia score for notation and playback; only this result can be rendered. BPM counts quarter-note beats. Syntax: treble | key:G | 4/4 | C4/4 D4/4 E4/4 r/4. Chord: (C4 E4 G4)/1. Durations 1,2,4,8,16,32,64,breve; dot: /4.; tie: ~; undotted triplet: /8{3:2}. Max 8 bars, one staff/voice. Two staves only the current simple treble/bass whole-note example.',
};
export const TUTOR_TOOLS = (Object.keys(tutorToolSchemas) as TutorToolName[]).map(
  (name, index, names) => ({
    name,
    description:
      descriptions[name] +
      ' Pitch inputs use international ASCII scientific notation: B3 = German H, Bb3 = German B; preserve spelling.',
    input_schema: { ...tutorToolJsonSchema(name), type: 'object' as const },
    strict: true,
    ...(index === names.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
  }),
);
function checkedPitch(value: string): Pitch {
  const p = parsePitch(value);
  if (midi(p) < 0 || midi(p) > 127) throw new RangeError('Pitch range');
  return p;
}
export function exerciseContext(catalogue: ContentCatalogue, request: TutorRequest) {
  if (!request.context) return { available: false };
  const { item, contentId, contentVersion } = resolveReportSource(
    catalogue,
    request.context.source,
  );
  // Wie in der App: Hörfragen zeigen ihr Notenbild erst nach der Wertung.
  const hidden =
    (request.mode === 'hint' || request.mode === 'chat') &&
    !request.context.checked &&
    isAuralExercise(item) &&
    item.type !== 'RHYTHM_TAP' &&
    item.type !== 'LISTENING_CHOICE';
  const base = {
    available: true,
    contentId,
    contentVersion,
    type: item.type,
    prompt: exercisePrompt(item, request.locale),
    description: hidden ? null : exerciseDescription(item, request.locale),
  };
  if (request.mode === 'hint') {
    const hint = exerciseHints(item, request.hintLevel ?? 1);
    return {
      ...base,
      hintLevel: request.hintLevel,
      // Manche Aufgaben bieten noch keine lösungsfreie feste Hilfe.
      hint: hint.key === 'solution' ? null : hintText(item, hint, request.locale),
      solutionAllowed: false,
    };
  }
  if (request.mode === 'chat') return { ...base, solutionAllowed: false };
  const solution = expectedAnswer(item),
    answer = request.mode === 'explain' ? (request.context.answer ?? '') : solution,
    evaluated = evaluateExercise(item, answer),
    // Nur engine-gültige Antwort-IDs erscheinen im vertrauenswürdigen Kontextblock, kein freier Text.
    shown = evaluated.validAnswer ? answer : null,
    evaluation = { ...evaluated, answer: shown };
  return {
    ...base,
    solutionAllowed: true,
    answer: shown,
    answerValid: evaluated.validAnswer,
    solution,
    solutionLabel: choiceLabel(item, solution, request.locale),
    evaluation,
    feedback: exerciseFeedback(item, evaluated, request.locale),
  };
}
export function executeTutorTool(
  name: string,
  input: unknown,
  request: TutorRequest,
  context: unknown,
  learner?: LearnerContext,
) {
  const language = request.locale === 'de' ? 'de' : 'en',
    // Deutsche Anzeige wie in der App mit Helmholtz-Oktaven (h¹ = B4), sonst wissenschaftlich.
    names = {
      system: request.noteNaming,
      octave: request.noteNaming === 'de' ? ('helmholtz' as const) : ('scientific' as const),
    },
    display = (p: Pitch) => ({ id: formatPitch(p), name: pitchName(p, names), midi: midi(p) });
  try {
    switch (name) {
      case 'analyze_interval': {
        const v = tutorToolSchemas.analyze_interval.parse(input),
          i = intervalBetween(checkedPitch(v.from), checkedPitch(v.to));
        return {
          ok: true,
          interval: formatInterval(i),
          name: intervalName(i, { language }),
          semitones: semitones(i),
          direction: i.direction,
        };
      }
      case 'build_interval': {
        const v = tutorToolSchemas.build_interval.parse(input),
          result = transposeBy(checkedPitch(v.from), parseInterval(v.interval));
        checkedPitch(formatPitch(result));
        return { ok: true, pitch: display(result) };
      }
      case 'build_scale': {
        const v = tutorToolSchemas.build_scale.parse(input),
          result = buildScale(checkedPitch(v.tonic), v.type, v);
        result.forEach((p) => checkedPitch(formatPitch(p)));
        return { ok: true, pitches: result.map(display) };
      }
      case 'key_signature': {
        const v = tutorToolSchemas.key_signature.parse(input),
          k = key(parseNoteName(v.tonic), v.mode);
        return {
          ok: true,
          name: keyName(k, { language }),
          fifths: keyFifths(k),
          accidentals: keySignature(k).map((n) => formatNoteName(n)),
        };
      }
      case 'identify_chord': {
        const v = tutorToolSchemas.identify_chord.parse(input);
        return {
          ok: true,
          matches: identifyChord(v.pitches.map(checkedPitch)).map((c) => ({
            ...c,
            name: chordName(c.chord, { language }),
            rootId: formatNoteName(c.chord.root),
          })),
        };
      }
      case 'build_chord': {
        const v = tutorToolSchemas.build_chord.parse(input),
          c = chord(parseNoteName(v.root), v.type, v.inversion),
          pitches = chordPitches(c, { octave: v.bassOctave });
        pitches.forEach((p) => checkedPitch(formatPitch(p)));
        return { ok: true, name: chordName(c, { language }), pitches: pitches.map(display) };
      }
      case 'get_exercise_context':
        tutorToolSchemas.get_exercise_context.parse(input);
        return { ok: true, context };
      case 'get_learner_summary':
        tutorToolSchemas.get_learner_summary.parse(input);
        return learner?.available
          ? {
              ok: true,
              evidence: learner.evidence,
              strengths: learner.strengths,
              needsPractice: learner.needsPractice,
              limits: learner.limits,
            }
          : { ok: false, error: 'learner_unavailable' };
      case 'analyze_progression':
        tutorToolSchemas.analyze_progression.parse(input);
        return learner?.available
          ? { ok: true, evidence: learner.evidence, ...learner.progression, limits: learner.limits }
          : { ok: false, error: 'learner_unavailable' };
      case 'render_example': {
        const v = tutorToolSchemas.render_example.parse(input),
          score = parseScore(v.source);
        if (score.staves.length > 2 || validateScore(score, { allowPickup: false }).length)
          throw new RangeError('Score structure');
        if (score.staves.length === 2) grandStaffTarget(score);
        if (
          score.staves.some(
            (s) =>
              s.measures.length > 8 ||
              s.measures.some(
                (m) => m.voices.length !== 1 || m.voices.some((v) => v.events.length > 32),
              ),
          )
        )
          throw new RangeError('Score size');
        const timeline = scoreTimeline(score, { bpm: v.bpm });
        if (timeline.durationSeconds > 60 || timeline.tones.length > 128)
          throw new RangeError('Score duration');
        timeline.tones.forEach((t) => checkedPitch(formatPitch(t.pitch)));
        return { ok: true, example: { source: v.source, bpm: v.bpm, score, timeline } };
      }
      default:
        return { ok: false, error: 'unknown_tool' };
    }
  } catch {
    // Keine ungeprüften Parameter oder internen Fehlermeldungen an Modell/Client weitergeben.
    return { ok: false, error: 'invalid_tool_input' };
  }
}
