import { layoutScore } from '@harmonia/notation';
import type { TextLocale, Messages } from '@harmonia/i18n';
import { createI18n, engineLanguage, textLocale, notationSystem } from '@harmonia/i18n';
import {
  intervalName,
  diatonicIndex,
  durationName,
  key,
  keyName,
  parseInterval,
  parseNoteName,
  parsePitch,
  pitchName,
} from '@harmonia/theory';
import type { ContextItem } from './context.ts';
import { contextAnswer } from './context.ts';
const engines = new Map<string, ReturnType<typeof createI18n>>();
function t(
  locale: TextLocale,
  k: `exercise.${keyof Messages['exercise']}` | 'glossary:trebleClef_one' | 'glossary:bassClef_one',
  values: Record<string, string | number> = {},
) {
  let i = engines.get(textLocale(locale));
  if (!i) {
    i = createI18n(textLocale(locale));
    engines.set(textLocale(locale), i);
  }
  const translate = i.t as unknown as (
    key: string,
    values: Record<string, string | number>,
  ) => string;
  return translate(k, values);
}
const named = (name: string, locale: TextLocale, octave = true) =>
  pitchName(parsePitch(name), {
    system: notationSystem(locale),
    octave: octave ? (notationSystem(locale) === 'de' ? 'helmholtz' : 'scientific') : 'none',
  });
export function contextValues(
  item: ContextItem,
  locale: TextLocale,
): Record<string, string | number> {
  const source = item.source;
  if (source.kind === 'score')
    return {
      target: (source.target ?? 0) + 1,
      focus: source.focus
        ? named(
            `${source.focus.letter}${source.focus.alter === 1 ? '#' : source.focus.alter === -1 ? 'b' : ''}${String(source.focus.octave)}`,
            locale,
          )
        : '',
      role: t(locale, `exercise.contextRole_${source.role ?? 'root'}`),
    };
  if (source.kind === 'key')
    return {
      key: keyName(source.key, engineLanguage(locale)),
      degree: source.degree ?? 1,
      direction: t(locale, source.direction === -1 ? 'exercise.down' : 'exercise.up'),
    };
  return {
    year: source.year,
    secondYear: source.secondYear ?? source.year,
    feature: t(locale, `exercise.contextFeature_${source.feature}`),
    medium: t(locale, `exercise.contextMedium_${source.medium}`),
  };
}
export function contextPrompt(item: ContextItem, locale: TextLocale) {
  return t(locale, `exercise.contextQuestion_${item.topic}`, contextValues(item, locale));
}
export function contextSourceText(item: ContextItem, locale: TextLocale) {
  const source = item.source;
  if (item.topic === 'jazz-roots' && source.kind === 'document')
    return t(
      locale,
      `exercise.contextSocial_${source.socialContext ?? 'neighbourhood'}`,
      contextValues(item, locale),
    );
  return t(
    locale,
    source.kind === 'score'
      ? 'exercise.contextScore'
      : source.kind === 'key'
        ? 'exercise.contextKey'
        : item.topic === 'period-context'
          ? 'exercise.contextDossier'
          : item.topic === 'source-comparison'
            ? `exercise.contextComparison_${source.relation ?? 'same-event'}`
            : 'exercise.contextDocument',
    contextValues(item, locale),
  );
}
export function contextChoiceLabel(item: ContextItem, answer: string, locale: TextLocale): string {
  if (!item.choices.includes(answer)) return t(locale, 'exercise.unknownAnswer');
  const parts = answer.split(':'),
    kind = parts[0],
    value = parts[1] ?? '';
  if (kind === 'pitch') return named(value, locale);
  if (kind === 'note')
    return pitchName(
      { ...parseNoteName(value), octave: 4 },
      { system: notationSystem(locale), octave: 'none' },
    );
  if (kind === 'interval')
    return intervalName(parseInterval(value), { ...engineLanguage(locale), showDirection: false });
  if (kind === 'quarters') return t(locale, 'exercise.contextFraction', { fraction: value });
  if (kind === 'pattern')
    return t(locale, 'exercise.contextPattern', { pattern: value.replaceAll(',', '–') });
  if (kind === 'degree') return t(locale, 'exercise.contextDegree', { count: Number(value) });
  if (kind === 'key')
    return keyName(
      key(parseNoteName(parts[2] ?? ''), value === 'major' ? 'major' : 'minor'),
      engineLanguage(locale),
    );
  if (kind === 'triad')
    return t(
      locale,
      `exercise.knowledgeTriad_${value as 'major' | 'minor' | 'diminished' | 'augmented'}`,
    );
  const labels: Readonly<Record<string, `exercise.${keyof Messages['exercise']}`>> = {
    'social:neighbourhood': 'exercise.contextSocialOption_neighbourhood',
    'social:migration': 'exercise.contextSocialOption_migration',
    'social:recording-business': 'exercise.contextSocialOption_recording-business',
    'boolean:yes': 'exercise.contextYes',
    'boolean:no': 'exercise.contextNo',
    'period:medieval': 'exercise.knowledgeHistory_periods_medieval',
    'period:renaissance': 'exercise.knowledgeHistory_periods_renaissance',
    'period:baroque': 'exercise.knowledgeHistory_periods_baroque',
    'period:classical': 'exercise.knowledgeHistory_periods_classical',
    'period:romantic': 'exercise.knowledgeHistory_periods_romantic',
    'period:since1900': 'exercise.knowledgeHistory_periods_since1900',
    'form:aba': 'exercise.contextOption_form-aba',
    'form:abc': 'exercise.contextOption_form-abc',
    'figure:5-3': 'exercise.contextOption_figure-5-3',
    'figure:6-3': 'exercise.contextOption_figure-6-3',
    'figure:6-4': 'exercise.contextOption_figure-6-4',
    ...(Object.fromEntries(
      [
        'recorded-performance',
        'advertised-event',
        'reported-view',
        'mediated-distribution',
        'invented-origin',
        'universal-style',
        'different-date-roles',
        'intention-performance',
        'unresolved-conflict',
        'agreement-not-proof',
      ].map((v) => [
        `${['different-date-roles', 'intention-performance', 'unresolved-conflict', 'agreement-not-proof'].includes(v) ? 'comparison' : 'evidence'}:${v}`,
        `exercise.contextOption_${v}`,
      ]),
    ) as Record<string, `exercise.${keyof Messages['exercise']}`>),
  };
  const label = labels[answer];
  return label ? t(locale, label) : t(locale, 'exercise.unknownAnswer');
}
export function contextExplanation(item: ContextItem, locale: TextLocale) {
  return t(locale, 'exercise.contextResult', {
    explanation: t(locale, `exercise.contextExplain_${item.topic}`, contextValues(item, locale)),
    answer: contextChoiceLabel(item, contextAnswer(item), locale),
  });
}
export function contextHint(item: ContextItem, level: 1 | 2, locale: TextLocale) {
  return t(
    locale,
    `exercise.contextHint${String(level) as '1' | '2'}_${item.topic}`,
    contextValues(item, locale),
  );
}

/** Beschreibt die gedruckten Zeichen und Positionen, ohne die Zieltonnamen vorwegzunehmen. */
export function contextNotationDescription(item: ContextItem, locale: TextLocale): string {
  if (item.source.kind !== 'score') return contextSourceText(item, locale);
  const score = item.source.score,
    staff = score.staves[0];
  if (!staff) throw new RangeError('System fehlt');
  const layout = layoutScore(score),
    bottom = parsePitch(
      staff.clef === 'bass'
        ? 'G2'
        : staff.clef === 'alto'
          ? 'F3'
          : staff.clef === 'tenor'
            ? 'D3'
            : 'E4',
    );
  const notes = staff.measures
    .flatMap((m, measure) =>
      m.voices.flatMap((v) =>
        v.events.map((e, event) => {
          const pitches =
            e.kind === 'note' ? [e.pitch] : e.kind === 'chord' ? e.notes.map((n) => n.pitch) : [];
          const positions = pitches
            .map((p, index) => {
              const printed = layout.items.find(
                (i) =>
                  i.kind === 'glyph' &&
                  i.role === 'accidental' &&
                  i.ref?.measure === measure &&
                  i.ref.event === event &&
                  (i.ref.note ?? 0) === index,
              );
              const names: Readonly<
                Record<string, 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat'>
              > = {
                accidentalSharp: 'sharp',
                accidentalFlat: 'flat',
                accidentalNatural: 'natural',
                accidentalDoubleSharp: 'doubleSharp',
                accidentalDoubleFlat: 'doubleFlat',
              };
              const sign = printed?.kind === 'glyph' ? (names[printed.glyph] ?? 'none') : 'none';
              return t(locale, 'exercise.contextPosition', {
                index: index + 1,
                steps: diatonicIndex(p) - diatonicIndex(bottom),
                sign: t(locale, `exercise.contextSign_${sign}`),
              });
            })
            .join(' ');
          return t(locale, 'exercise.contextEvent', {
            measure: measure + 1,
            index: event + 1,
            duration: durationName(e.duration, {
              ...engineLanguage(locale),
              kind: e.kind === 'rest' ? 'rest' : 'note',
            }),
            positions,
          });
        }),
      ),
    )
    .join(' ');
  return t(locale, 'exercise.notationDescription', {
    clef: t(locale, staff.clef === 'bass' ? 'glossary:bassClef_one' : 'glossary:trebleClef_one'),
    notes,
  });
}
