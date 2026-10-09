import type { AppLocale, Messages } from '@harmonia/i18n';
import { createI18n, engineLanguage } from '@harmonia/i18n';
import type { NoteName, Pitch } from '@harmonia/theory';
import {
  diatonicIndex,
  intervalBetween,
  intervalName,
  parseInterval,
  pitchName,
  semitones,
  keyName,
  keySignature,
  midi,
  scaleTypeName,
  SHARP_ORDER,
  FLAT_ORDER,
  chordName,
  chordIntervals,
  inversionName,
  durationName,
  formatTimeSignature,
  durationValue,
  duration,
  fractionEquals,
  beats,
  parseTimeSignature,
  scaleIntervals,
} from '@harmonia/theory';
import {
  isKnowledgeItem,
  knowledgeChoiceFact,
  knowledgeFactId,
  orderedValues,
  orderValueId,
} from './knowledge.ts';
import type { KnowledgeFact, KnowledgeExerciseItem, OrderValue } from './types.ts';
import { expectedAnswer } from './evaluate.ts';
import type { Evaluation, ExerciseFeedback, ExerciseHint, ExerciseItem } from './types.ts';
import {
  isKeySignatureItem,
  isScaleItem,
  scalePitches,
  signatureKey,
  tonalityFromId,
  MVP_SCALE_TYPES,
  scaleChoiceId,
} from './tonality.ts';
import type { ChordItem, KeySignatureItem, ScaleItem, RhythmItem } from './types.ts';
import { chordFromId, chordTargets, isChordItem, resolvedChord } from './chords.ts';
import {
  assessRhythm,
  isRhythmItem,
  meterFromId,
  rhythmAnswerTaps,
  rhythmBeat,
  rhythmBeatCount,
  rhythmMeter,
  rhythmOnsets,
  rhythmTolerance,
} from './rhythm.ts';

const translations = new Map<AppLocale, ReturnType<typeof createI18n>>();
type TextKey =
  | `exercise.${keyof Messages['exercise']}`
  | 'exercise.noteSteps'
  | 'exercise.halfSteps'
  | 'exercise.diatonicCount'
  | 'exercise.knowledgePositions'
  | 'practice.correctTitle'
  | 'practice.wrongTitle'
  | 'glossary:trebleClef_one'
  | 'glossary:bassClef_one'
  | 'glossary:major'
  | 'glossary:minor'
  | 'glossary:sharp_one'
  | 'glossary:sharp_other'
  | 'glossary:flat_one'
  | 'glossary:flat_other';
type AccidentalKey =
  | 'glossary:doubleFlat_one'
  | 'glossary:flat_one'
  | 'glossary:natural_one'
  | 'glossary:sharp_one'
  | 'glossary:doubleSharp_one';
function translate(
  locale: AppLocale,
  key: TextKey | AccidentalKey,
  values: Readonly<Record<string, string | number>> = {},
): string {
  let instance = translations.get(locale);
  if (!instance) {
    instance = createI18n(locale);
    translations.set(locale, instance);
  }
  return instance.t(key, values);
}
function noteName(pitch: Pitch, locale: AppLocale, octave = true): string {
  return pitchName(pitch, {
    system: locale === 'de' ? 'de' : 'intl',
    octave: octave ? (locale === 'de' ? 'helmholtz' : 'scientific') : 'none',
  });
}
export function signatureNoteLabel(note: NoteName, locale: AppLocale): string {
  return noteName({ ...note, octave: 4 }, locale, false);
}
export function pitchInputLabel(pitch: Pitch, locale: AppLocale): string {
  return noteName(pitch, locale);
}
export function choiceLabel(item: ExerciseItem, answer: string, locale: AppLocale): string {
  if (!item.choices.includes(answer)) return translate(locale, 'exercise.unknownAnswer');
  if (isKnowledgeItem(item)) {
    if (item.type === 'ORDER') {
      const value = item.values.find((value) => orderValueId(value) === answer);
      return value ? orderValueLabel(value, locale) : translate(locale, 'exercise.unknownAnswer');
    }
    const fact = knowledgeChoiceFact(item, answer);
    return fact
      ? item.type === 'MATCH'
        ? knowledgeDefinition(fact, locale)
        : knowledgeFactLabel(fact, locale)
      : translate(locale, 'exercise.unknownAnswer');
  }
  if (isRhythmItem(item)) {
    const meter = meterFromId(answer),
      value = {
        ...item,
        score: {
          ...item.score,
          staves: item.score.staves.map((staff) => ({ ...staff, timeSignature: meter })),
        },
      };
    return translate(locale, 'exercise.meterOption', rhythmValues(value, locale));
  }
  if (isChordItem(item)) return chordName(chordFromId(answer), engineLanguage(locale));
  if (isScaleItem(item)) {
    const type = MVP_SCALE_TYPES.find((type) => scaleChoiceId(type) === answer);
    return type
      ? scaleTypeName(type, engineLanguage(locale).language)
      : translate(locale, 'exercise.unknownAnswer');
  }
  if (isKeySignatureItem(item)) return keyName(tonalityFromId(answer), engineLanguage(locale));
  if (item.type !== 'NOTE_NAME')
    return intervalName(parseInterval(answer), { ...engineLanguage(locale), showDirection: false });
  const [letter, alter] = answer.split(':');
  const pitch = { ...item.pitch, letter: letter as Pitch['letter'], alter: Number(alter) };
  return noteName(pitch, locale, false);
}
export function exercisePrompt(item: ExerciseItem, locale: AppLocale): string {
  if (isKnowledgeItem(item))
    return translate(locale, `exercise.question_${item.type}`, knowledgeValues(item, locale));
  if (isRhythmItem(item))
    return translate(locale, `exercise.question_${item.type}`, rhythmValues(item, locale));
  if (isChordItem(item))
    return translate(
      locale,
      item.type === 'CHORD_BUILD'
        ? 'exercise.question_CHORD_BUILD'
        : item.presentation === 'aural'
          ? 'exercise.question_CHORD_AURAL'
          : 'exercise.question_CHORD_IDENTIFY',
      {
        name: chordName(item.chord, engineLanguage(locale)),
        bass: noteName(item.bass, locale),
        root: noteName({ ...item.chord.root, octave: 4 }, locale, false),
      },
    );
  if (isScaleItem(item))
    return translate(locale, `exercise.question_${item.type}`, {
      tonic: noteName(item.tonic, locale),
      type: scaleTypeName(item.scaleType, engineLanguage(locale).language),
      direction: translate(
        locale,
        item.direction === 'ascending' ? 'exercise.scaleAscending' : 'exercise.scaleDescending',
      ),
    });
  if (isKeySignatureItem(item))
    return translate(locale, `exercise.question_${item.type}`, {
      key: keyName(item.key, engineLanguage(locale)),
      mode: translate(locale, item.key.mode === 'major' ? 'glossary:major' : 'glossary:minor'),
    });
  return translate(
    locale,
    item.type === 'KEY_FIND' && item.presentation === 'name'
      ? 'exercise.question_KEY_FIND_name'
      : `exercise.question_${item.type}`,
    'pitch' in item
      ? {
          note: noteName(
            item.pitch,
            locale,
            !(item.type === 'KEY_FIND' && item.presentation === 'name'),
          ),
        }
      : item.type === 'INTERVAL_BUILD'
        ? {
            interval: intervalName(intervalBetween(item.from, item.to), engineLanguage(locale)),
            from: noteName(item.from, locale),
          }
        : {},
  );
}
function reference(item: Exclude<ExerciseItem, KnowledgeExerciseItem>) {
  return item.clef === 'treble'
    ? { pitch: { letter: 'G', alter: 0, octave: 4 } as const, line: 2 }
    : { pitch: { letter: 'F', alter: 0, octave: 3 } as const, line: 4 };
}
function noteExplanation(
  item: Extract<ExerciseItem, { readonly pitch: Pitch }>,
  locale: AppLocale,
): string {
  const anchor = reference(item);
  const distance = diatonicIndex(item.pitch) - diatonicIndex(anchor.pitch);
  const steps =
    distance === 0
      ? translate(locale, 'exercise.atReference')
      : translate(locale, 'exercise.noteSteps', {
          count: Math.abs(distance),
          direction: translate(locale, distance > 0 ? 'exercise.up' : 'exercise.down'),
        });
  return translate(locale, 'exercise.noteExplanation', {
    clef: translate(locale, `glossary:${item.clef === 'treble' ? 'trebleClef' : 'bassClef'}_one`),
    reference: noteName(anchor.pitch, locale),
    line: anchor.line,
    steps,
    alteration: alterationText(item.pitch, locale),
    answer: noteName(item.pitch, locale, false),
  });
}
export function exerciseFeedback(
  item: ExerciseItem,
  result: Evaluation,
  locale: AppLocale,
): ExerciseFeedback {
  let message: string;
  if (isKnowledgeItem(item)) {
    message =
      item.type === 'ORDER'
        ? translate(locale, 'exercise.orderExplanation', knowledgeValues(item, locale))
        : (item.type === 'MATCH' ? item.facts : [item.fact])
            .map((fact) =>
              translate(locale, 'exercise.knowledgeExplanation', {
                term: knowledgeFactLabel(fact, locale),
                definition: knowledgeDefinition(fact, locale),
              }),
            )
            .join('\n');
  } else if (isRhythmItem(item)) {
    if (item.type === 'METER_IDENTIFY')
      message = translate(locale, 'exercise.meterExplanation', rhythmValues(item, locale));
    else {
      const assessment = assessRhythm(item, rhythmAnswerTaps(item, result.answer) ?? []);
      message = translate(locale, 'exercise.rhythmExplanation', {
        matched: assessment.matched,
        total: assessment.targets.length,
        missing: assessment.missing,
        extra: assessment.extras.length,
        tolerance: assessment.toleranceMs,
        pattern: translate(locale, 'exercise.rhythmPattern', {
          times: rhythmOnsets(item).join(', '),
        }),
      });
    }
  } else if (isChordItem(item))
    message = translate(locale, 'exercise.chordExplanation', chordExplanationValues(item, locale));
  else if (isScaleItem(item)) {
    message = translate(locale, 'exercise.scaleExplanation', {
      tonic: noteName(item.tonic, locale),
      type: scaleTypeName(item.scaleType, engineLanguage(locale).language),
      direction: translate(
        locale,
        item.direction === 'ascending' ? 'exercise.scaleAscending' : 'exercise.scaleDescending',
      ),
      notes: scalePitches(item)
        .map((pitch) => noteName(pitch, locale))
        .join(' → '),
      pattern: scalePattern(item),
    });
    if (item.scaleType === 'melodicMinor' && item.direction === 'descending')
      message += ` ${translate(locale, 'exercise.melodicDescending')}`;
  } else if (isKeySignatureItem(item))
    message = translate(locale, 'exercise.signatureExplanation', {
      key: keyName(signatureKey(item), engineLanguage(locale)),
      signature: signatureText(item, locale),
      notes:
        keySignature(signatureKey(item))
          .map((note) => noteName({ ...note, octave: 4 }, locale, false))
          .join(' → ') || translate(locale, 'exercise.signatureEmpty'),
    });
  else if (item.type === 'KEY_FIND')
    message = translate(
      locale,
      item.presentation === 'name' ? 'exercise.keyNameExplanation' : 'exercise.keyExplanation',
      {
        note: noteName(item.pitch, locale, item.presentation !== 'name'),
        natural: noteName({ ...item.pitch, alter: 0 }, locale, item.presentation !== 'name'),
        alteration: alterationText(item.pitch, locale),
      },
    );
  else if ('pitch' in item) {
    message = noteExplanation(item, locale);
    if (item.type === 'NOTE_PLACE')
      message += ` ${translate(locale, 'exercise.writtenPitch', { note: noteName(item.pitch, locale) })}`;
  } else {
    const interval = intervalBetween(item.from, item.to);
    message = translate(locale, 'exercise.intervalExplanation', {
      from: noteName(item.from, locale),
      to: noteName(item.to, locale),
      diatonic: translate(locale, 'exercise.diatonicCount', { count: interval.number }),
      distance: translate(locale, 'exercise.halfSteps', { count: Math.abs(semitones(interval)) }),
      answer: intervalName(interval, { ...engineLanguage(locale), showDirection: false }),
    });
    if (item.type === 'INTERVAL_BUILD')
      message += ` ${translate(locale, 'exercise.writtenPitch', { note: noteName(item.to, locale) })}`;
  }
  return {
    title: translate(locale, result.correct ? 'practice.correctTitle' : 'practice.wrongTitle'),
    message,
  };
}
/** Sprachneutraler Hinweis; erst die Oberfläche wählt die Sprache. Level 3 ist die erklärte Lösung. */
export function exerciseHints(item: ExerciseItem, level: 1 | 2 | 3): ExerciseHint {
  if (level === 3) return { level, key: 'solution', values: {} };
  if (isKnowledgeItem(item))
    return {
      level,
      key:
        level === 2
          ? `exercise.knowledgeHint2_${item.type}`
          : item.type === 'ORDER'
            ? `exercise.knowledgeHint_${item.topic}`
            : `exercise.knowledgeHint_${item.type === 'MATCH' ? (item.facts[0]?.topic ?? 'accidentals') : item.fact.topic}`,
      values: {},
    };
  if (isRhythmItem(item))
    return {
      level,
      key:
        item.type === 'RHYTHM_TAP'
          ? level === 1
            ? 'exercise.rhythmHint1'
            : 'exercise.rhythmHint2'
          : level === 1
            ? 'exercise.meterHint1'
            : 'exercise.meterHint2',
      values: {},
    };
  if (isChordItem(item))
    return {
      level,
      key:
        level === 2
          ? 'exercise.chordHint2'
          : item.type === 'CHORD_IDENTIFY' && item.presentation === 'aural'
            ? 'exercise.chordAuralHint1'
            : 'exercise.chordHint1',
      values: {},
    };
  if (isScaleItem(item))
    return {
      level,
      key: level === 1 ? 'exercise.scaleHint1' : 'exercise.scaleHint2',
      values: { pattern: scalePattern(item) },
    };
  if (isKeySignatureItem(item))
    return {
      level,
      key: level === 1 ? 'exercise.signatureHint1' : 'exercise.signatureHint2',
      values: {},
    };
  if (item.type === 'KEY_FIND')
    return {
      level,
      key:
        level === 1
          ? item.presentation === 'name'
            ? 'exercise.keyNameHint1'
            : 'exercise.keyHint1'
          : 'exercise.keyHint2',
      values: {},
    };
  if ('pitch' in item)
    return {
      level,
      key: level === 1 ? 'exercise.noteHint1' : 'exercise.noteHint2',
      values: level === 1 ? {} : { line: reference(item).line },
    };
  const interval = intervalBetween(item.from, item.to);
  return {
    level,
    key:
      level === 1
        ? item.type === 'INTERVAL_IDENTIFY_AURAL'
          ? 'exercise.auralHint1'
          : 'exercise.visualHint1'
        : item.type === 'INTERVAL_BUILD'
          ? 'exercise.buildHint2'
          : 'exercise.intervalHint2',
    values: level === 1 ? {} : { semitones: Math.abs(semitones(interval)) },
  };
}
export function hintText(item: ExerciseItem, hint: ExerciseHint, locale: AppLocale): string {
  if (hint.level === 3)
    return exerciseFeedback(
      item,
      {
        answer: expectedAnswer(item),
        expected: expectedAnswer(item),
        validAnswer: true,
        correct: true,
      },
      locale,
    ).message;
  if (hint.key === 'solution') return '';
  if (isKnowledgeItem(item)) return translate(locale, hint.key, knowledgeValues(item, locale));
  if (isRhythmItem(item)) return translate(locale, hint.key, rhythmValues(item, locale));
  if (isChordItem(item))
    return translate(
      locale,
      hint.key,
      hint.level === 2 ? chordExplanationValues(item, locale) : {},
    );
  if (isScaleItem(item)) return translate(locale, hint.key, hint.values);
  if (isKeySignatureItem(item))
    return translate(
      locale,
      hint.key,
      hint.level === 1
        ? {
            sharps: SHARP_ORDER.map((note) => noteName({ ...note, octave: 4 }, locale, false)).join(
              ' → ',
            ),
            flats: FLAT_ORDER.map((note) => noteName({ ...note, octave: 4 }, locale, false)).join(
              ' → ',
            ),
          }
        : { signature: signatureText(item, locale) },
    );
  if (item.type === 'KEY_FIND' && hint.level === 2)
    return translate(locale, 'exercise.keyHint2', {
      natural: noteName({ ...item.pitch, alter: 0 }, locale, item.presentation !== 'name'),
      alteration: alterationText(item.pitch, locale),
    });
  if ('pitch' in item && hint.level === 2)
    return translate(locale, hint.key, {
      ...hint.values,
      reference: noteName(reference(item).pitch, locale),
    });
  if (hint.level === 2 && !('pitch' in item))
    return translate(
      locale,
      item.type === 'INTERVAL_BUILD' ? 'exercise.buildHint2' : 'exercise.intervalHint2',
      {
        distance: translate(locale, 'exercise.halfSteps', {
          count: Number(hint.values['semitones']),
        }),
      },
    );
  return translate(locale, hint.key, hint.values);
}

function alterationText(pitch: Pitch, locale: AppLocale): string {
  switch (pitch.alter) {
    case -2:
      return translate(locale, 'exercise.alter_-2');
    case -1:
      return translate(locale, 'exercise.alter_-1');
    case 0:
      return translate(locale, 'exercise.alter_0');
    case 1:
      return translate(locale, 'exercise.alter_1');
    case 2:
      return translate(locale, 'exercise.alter_2');
    default:
      throw new RangeError('Nicht unterstütztes Vorzeichen');
  }
}

/** Positionen statt Tonnamen: Vor dem Prüfen darf der Screenreader die Lösung nicht vorwegnehmen. */
export function exerciseDescription(item: ExerciseItem, locale: AppLocale): string {
  if (isKnowledgeItem(item)) return exercisePrompt(item, locale);
  if (isRhythmItem(item))
    return translate(locale, 'exercise.rhythmDescription', {
      meter: formatTimeSignature(rhythmMeter(item)),
      events: (item.score.staves[0]?.measures[0]?.voices[0]?.events ?? [])
        .map((event, index) =>
          translate(locale, 'exercise.rhythmEvent', {
            index: index + 1,
            kind: translate(
              locale,
              event.kind === 'rest' ? 'exercise.rhythmRest' : 'exercise.rhythmNote',
            ),
            duration: durationName(event.duration, {
              ...engineLanguage(locale),
              kind: event.kind === 'rest' ? 'rest' : 'note',
            }),
          }),
        )
        .join(' '),
    });
  if (isKeySignatureItem(item))
    return translate(locale, 'exercise.signatureDescription', {
      signature: signatureText(item, locale),
      notes:
        keySignature(signatureKey(item))
          .map((note) => noteName({ ...note, octave: 4 }, locale, false))
          .join(' → ') || translate(locale, 'exercise.signatureEmpty'),
    });
  const bottom: Pitch =
    item.clef === 'treble'
      ? { letter: 'E', alter: 0, octave: 4 }
      : { letter: 'G', alter: 0, octave: 2 };
  const pitches = isChordItem(item)
    ? item.type === 'CHORD_BUILD'
      ? [item.bass]
      : item.pitches
    : isScaleItem(item)
      ? item.type === 'SCALE_BUILD'
        ? [item.tonic]
        : item.pitches
      : item.type === 'NOTE_PLACE'
        ? []
        : 'pitch' in item
          ? [item.pitch]
          : item.type === 'INTERVAL_BUILD'
            ? [item.from]
            : [item.from, item.to];
  const notes = pitches
    .map((pitch, index) => {
      const steps = diatonicIndex(pitch) - diatonicIndex(bottom);
      return translate(locale, steps === 0 ? 'exercise.positionBottom' : 'exercise.positionSteps', {
        index: index + 1,
        count: Math.abs(steps),
        alteration: alterationText(pitch, locale),
        steps: translate(locale, 'exercise.noteSteps', {
          count: Math.abs(steps),
          direction: translate(locale, steps > 0 ? 'exercise.up' : 'exercise.down'),
        }),
      });
    })
    .join(' ');
  return translate(locale, 'exercise.notationDescription', {
    clef: translate(
      locale,
      item.clef === 'treble' ? 'glossary:trebleClef_one' : 'glossary:bassClef_one',
    ),
    notes,
  });
}
export function knowledgeFactLabel(fact: KnowledgeFact, locale: AppLocale): string {
  switch (fact.topic) {
    case 'keyboard':
      return translate(locale, `exercise.knowledgeKeyboard_${fact.kind}`);
    case 'accidentals': {
      const keys = [
        'glossary:doubleFlat_one',
        'glossary:flat_one',
        'glossary:natural_one',
        'glossary:sharp_one',
        'glossary:doubleSharp_one',
      ] as const;
      return translate(locale, keys[fact.alter + 2] ?? 'glossary:natural_one');
    }
    case 'noteValues':
      return durationName(fact.duration, engineLanguage(locale));
    case 'intervals':
      return intervalName(fact.interval, { ...engineLanguage(locale), showDirection: false });
    case 'triads':
      return translate(locale, `exercise.knowledgeTriad_${fact.triad}`);
    case 'scales':
      return scaleTypeName(fact.scale, engineLanguage(locale).language);
    case 'meters':
      return fact.meter;
  }
}
export function knowledgeDefinition(fact: KnowledgeFact, locale: AppLocale): string {
  switch (fact.topic) {
    case 'keyboard':
      return translate(locale, `exercise.knowledgeKeyboardDefinition_${fact.kind}`);
    case 'accidentals':
      return translate(
        locale,
        fact.alter === 0
          ? 'exercise.knowledgeNatural'
          : fact.alter > 0
            ? 'exercise.knowledgeRaises'
            : 'exercise.knowledgeLowers',
        { distance: translate(locale, 'exercise.halfSteps', { count: Math.abs(fact.alter) }) },
      );
    case 'noteValues': {
      const value = durationValue(fact.duration);
      return translate(locale, 'exercise.knowledgeDuration', {
        value: `${String(value.num)}/${String(value.den)}`,
      });
    }
    case 'intervals':
      return translate(locale, 'exercise.knowledgeInterval', {
        positions: translate(locale, 'exercise.knowledgePositions', {
          count: fact.interval.number,
        }),
        distance: translate(locale, 'exercise.halfSteps', { count: semitones(fact.interval) }),
      });
    case 'triads':
      return translate(locale, 'exercise.knowledgeTriad', {
        pattern: chordIntervals(fact.triad).map(semitones).join(' – '),
      });
    case 'scales': {
      const offsets = [...scaleIntervals(fact.scale).map(semitones), 12];
      return translate(locale, 'exercise.knowledgeScale', {
        pattern: offsets
          .slice(1)
          .map((value, i) => value - (offsets[i] ?? 0))
          .join(' – '),
      });
    }
    case 'meters': {
      const meter = parseTimeSignature(fact.meter),
        values = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as const;
      const beatValue = beats(meter)[0];
      const beat = values
        .flatMap((value) => [duration(value), duration(value, 1)])
        .find((value) => beatValue && fractionEquals(durationValue(value), beatValue));
      if (!beat) throw new RangeError('Unbekannter Grundschlag');
      return translate(locale, 'exercise.knowledgeMeter', {
        count: beats(meter).length,
        beat: durationName(beat, engineLanguage(locale)),
        groups: meter.grouping.join(' + '),
      });
    }
  }
}
export function orderValueLabel(value: OrderValue, locale: AppLocale): string {
  return value.kind === 'pitch'
    ? noteName(value.pitch, locale)
    : durationName(value.duration, engineLanguage(locale));
}
function knowledgeValues(item: KnowledgeExerciseItem, locale: AppLocale) {
  if (item.type === 'ORDER') {
    const sorted = orderedValues(item).map((value) => orderValueLabel(value, locale));
    return {
      first: sorted[0] ?? '',
      sequence: sorted.join(' → '),
      rule: translate(locale, `exercise.orderRule_${item.topic}`),
      direction: translate(locale, `exercise.order_${item.topic}_${item.direction}`),
    };
  }
  if (item.type === 'MATCH') {
    const fact = item.facts[0];
    return {
      term: fact ? knowledgeFactLabel(fact, locale) : '',
      definition: fact ? knowledgeDefinition(fact, locale) : '',
    };
  }
  const candidates = item.choices
    .filter(
      (id) =>
        id === knowledgeFactId(item.fact) ||
        id === item.choices.find((id) => id !== knowledgeFactId(item.fact)),
    )
    .map((id) => knowledgeChoiceFact(item, id))
    .filter((fact): fact is KnowledgeFact => !!fact);
  return {
    definition: knowledgeDefinition(item.fact, locale),
    candidates: candidates.map((fact) => knowledgeFactLabel(fact, locale)).join(' / '),
  };
}
function rhythmValues(item: RhythmItem, locale: AppLocale) {
  const meter = rhythmMeter(item);
  return {
    meter: formatTimeSignature(meter),
    count: rhythmBeatCount(item),
    beat: durationName(rhythmBeat(item), engineLanguage(locale)),
    bpm: item.bpm,
    groups: meter.grouping.join(' + '),
    division: meter.grouping[0] === 3 ? 3 : 2,
    total: rhythmOnsets(item).length,
    tolerance: rhythmTolerance(item),
  };
}
function chordExplanationValues(item: ChordItem, locale: AppLocale) {
  const value = resolvedChord(item),
    intervals = chordIntervals(value.type),
    third = intervals[1],
    fifth = intervals[2];
  if (!third || !fifth) throw new RangeError('Dreiklangintervalle fehlen');
  return {
    name: chordName(value, engineLanguage(locale)),
    root: noteName({ ...value.root, octave: 4 }, locale, false),
    bass: noteName(
      item.type === 'CHORD_BUILD'
        ? item.bass
        : ([...item.pitches].sort((a, b) => midi(a) - midi(b))[0] ?? item.bass),
      locale,
    ),
    notes: chordTargets(item)
      .map((pitch) => noteName(pitch, locale))
      .join(' · '),
    third: intervalName(third, engineLanguage(locale)),
    fifth: intervalName(fifth, engineLanguage(locale)),
    inversion: inversionName(value.inversion, engineLanguage(locale).language),
  };
}
function scalePattern(item: ScaleItem): string {
  const pitches = scalePitches(item);
  return pitches
    .slice(1)
    .map((pitch, index) => Math.abs(midi(pitch) - midi(pitches[index] ?? item.tonic)))
    .join('–');
}
function signatureText(item: KeySignatureItem, locale: AppLocale): string {
  const notes = keySignature(signatureKey(item));
  const first = notes[0];
  if (!first) return translate(locale, 'exercise.signatureEmpty');
  return translate(locale, 'exercise.signatureCount', {
    count: notes.length,
    sign: translate(
      locale,
      first.alter > 0
        ? notes.length === 1
          ? 'glossary:sharp_one'
          : 'glossary:sharp_other'
        : notes.length === 1
          ? 'glossary:flat_one'
          : 'glossary:flat_other',
    ),
  });
}
