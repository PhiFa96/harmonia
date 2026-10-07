import type { AppLocale, Messages } from '@harmonia/i18n';
import { createI18n, engineLanguage } from '@harmonia/i18n';
import type { Pitch } from '@harmonia/theory';
import {
  diatonicIndex,
  intervalBetween,
  intervalName,
  parseInterval,
  pitchName,
  semitones,
} from '@harmonia/theory';
import { expectedAnswer } from './evaluate.ts';
import type { Evaluation, ExerciseFeedback, ExerciseHint, ExerciseItem } from './types.ts';

const translations = new Map<AppLocale, ReturnType<typeof createI18n>>();
type TextKey =
  | `exercise.${keyof Messages['exercise']}`
  | 'exercise.noteSteps'
  | 'exercise.halfSteps'
  | 'exercise.diatonicCount'
  | 'practice.correctTitle'
  | 'practice.wrongTitle'
  | 'glossary:trebleClef_one'
  | 'glossary:bassClef_one';
function translate(
  locale: AppLocale,
  key: TextKey,
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
export function choiceLabel(item: ExerciseItem, answer: string, locale: AppLocale): string {
  if (!item.choices.includes(answer)) return translate(locale, 'exercise.unknownAnswer');
  if (item.type !== 'NOTE_NAME')
    return intervalName(parseInterval(answer), { ...engineLanguage(locale), showDirection: false });
  const [letter, alter] = answer.split(':');
  const pitch = { ...item.pitch, letter: letter as Pitch['letter'], alter: Number(alter) };
  return noteName(pitch, locale, false);
}
export function exercisePrompt(item: ExerciseItem, locale: AppLocale): string {
  return translate(
    locale,
    `exercise.question_${item.type}`,
    'pitch' in item
      ? { note: noteName(item.pitch, locale) }
      : item.type === 'INTERVAL_BUILD'
        ? {
            interval: intervalName(intervalBetween(item.from, item.to), engineLanguage(locale)),
            from: noteName(item.from, locale),
          }
        : {},
  );
}
function reference(item: ExerciseItem) {
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
  if (item.type === 'KEY_FIND')
    message = translate(locale, 'exercise.keyExplanation', {
      note: noteName(item.pitch, locale),
      natural: noteName({ ...item.pitch, alter: 0 }, locale),
      alteration: alterationText(item.pitch, locale),
    });
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
  if (item.type === 'KEY_FIND')
    return {
      level,
      key: level === 1 ? 'exercise.keyHint1' : 'exercise.keyHint2',
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
  if (item.type === 'KEY_FIND' && hint.level === 2)
    return translate(locale, 'exercise.keyHint2', {
      natural: noteName({ ...item.pitch, alter: 0 }, locale),
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
  const bottom: Pitch =
    item.clef === 'treble'
      ? { letter: 'E', alter: 0, octave: 4 }
      : { letter: 'G', alter: 0, octave: 2 };
  const pitches =
    item.type === 'NOTE_PLACE'
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
