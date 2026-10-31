import { createHash, randomUUID } from 'node:crypto';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { lessonExerciseSources, textAt } from '../../packages/content/src/catalogue.ts';
import { contentMessages } from '../../packages/i18n/src/authoring-content-messages.ts';
import {
  createRng,
  generateExercise,
  exercisePrompt,
  exerciseDescription,
  choiceLabel,
  isAuralExercise,
} from '../../packages/exercises/src/index.ts';
import { layoutScore, layoutToSvg, scoreTimeline } from '../../packages/notation/src/index.ts';
import { assignmentText } from '../../packages/i18n/src/school-assignments.ts';

const lessons = [
  'notation.l1.staff.anchor',
  'notation.l1.staff.positions',
  'intervals.l1.size.numbers',
  'intervals.l1.size.direction',
];
const blocks = [
  { key: 'notes', label: 'notesBlock', lesson: 'notation.l1.staff.positions', index: 0 },
  { key: 'intervals', label: 'intervalBlock', lesson: 'intervals.l1.size.numbers', index: 0 },
  { key: 'hearing', label: 'hearingBlock', lesson: 'aural.l1.pitch-intervals.intervals', index: 6 },
];
export function assignmentBank(locale) {
  return [
    ...lessons.map((id) => {
      const lesson = catalogue.lessons.find((l) => l.id === id);
      return {
        key: id,
        kind: 'lesson',
        label: textAt({ content: contentMessages[locale] }, lesson.titleKey),
        tasks: lessonExerciseSources(catalogue, id).length,
      };
    }),
    ...blocks.map((b) => ({
      key: b.key,
      kind: 'exercise',
      label: assignmentText(locale, b.label),
      tasks: 1,
    })),
  ];
}
export function freezeAssignment(selections) {
  if (!Array.isArray(selections) || selections.length < 1 || selections.length > 6)
    throw new RangeError('invalid');
  const rng = createRng(randomUUID()),
    items = [];
  for (const selection of selections) {
    if (
      !selection ||
      Object.keys(selection).sort().join() !== 'count,key' ||
      !Number.isInteger(selection.count) ||
      selection.count < 1 ||
      selection.count > 10
    )
      throw new RangeError('invalid');
    const full = lessons.includes(selection.key),
      block = blocks.find((b) => b.key === selection.key);
    if ((!full && !block) || (full && selection.count !== 1)) throw new RangeError('invalid');
    const id = full ? selection.key : block.lesson;
    const sources = lessonExerciseSources(catalogue, id);
    const chosen = full
      ? sources
      : Array.from({ length: selection.count }, () => sources[block.index]);
    for (const source of chosen) {
      const item = generateExercise(source.spec, rng);
      if (!['NOTE_NAME', 'INTERVAL_IDENTIFY_VISUAL', 'INTERVAL_IDENTIFY_AURAL'].includes(item.type))
        throw new RangeError('invalid');
      items.push({
        item,
        lessonId: id,
        sourceVersion: source.contentVersion,
        area: isAuralExercise(item) ? 'aural' : 'theory',
      });
    }
  }
  if (items.length > 40) throw new RangeError('invalid');
  return { items, digest: materialDigest(items), contentVersion: catalogue.contentVersion };
}
// jsonb changes object key order; a canonical digest preserves arrays but sorts object keys.
export function materialDigest(value) {
  function canonical(v) {
    return Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, canonical(v[k])]),
          )
        : v;
  }
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}
export function questionView(item, index, total, locale) {
  const aural = isAuralExercise(item);
  return {
    index,
    total,
    prompt: exercisePrompt(item, locale),
    choices: item.choices.map((id) => ({ id, label: choiceLabel(item, id, locale) })),
    svg: aural ? null : layoutToSvg(layoutScore(item.score)),
    description: aural ? null : exerciseDescription(item, locale),
    audio: aural
      ? scoreTimeline(item.score, { bpm: 90, beat: { value: 'quarter', dots: 0 } })
      : null,
  };
}
