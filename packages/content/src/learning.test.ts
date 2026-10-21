import { choirAnswer, choirAnswerId } from '@harmonia/exercises';
import { describe, expect, it } from 'vitest';
import { catalogue, firstLesson } from './authoring.ts';
import { catalogue as publishedCatalogue } from './published.ts';
import { resolveLesson } from './catalogue.ts';
import {
  EvidenceError,
  learningEventSchema,
  lessonEvent,
  lessonProgress,
  legacyLessonEvent,
  validateLearningEvent,
} from './learning-evidence.ts';
import { learningPath } from './learning-path.ts';
import type { LessonProgress } from './learning-evidence.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  satbAnswerId,
  evaluateExercise,
  isAuralExercise,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import type { ExerciseItem, LessonDefinition } from '@harmonia/exercises';

function wrongAnswer(item: ExerciseItem): string {
  if (item.type === 'CHOIR_PART')
    return choirAnswerId(
      (choirAnswer(item, expectedAnswer(item)) ?? []).map((row) =>
        row.map((n) => (n === null ? null : n + 200)),
      ),
    );
  if (item.type === 'VOICE_LEADING') {
    const voice = item.params.mode === 'soprano' ? 'alto' : 'soprano';
    return satbAnswerId(
      item.example.map((slice, i) =>
        i === 1 ? { ...slice, [voice]: { letter: 'C', alter: 1, octave: 7 } } : slice,
      ),
    );
  }
  const expected = expectedAnswer(item);
  const candidates = [
    ...item.choices.filter((v) => v !== expected),
    'C4',
    'D4',
    'E4',
    'taps:',
    `key:${String(Number(expected.slice(4)) + 1)}`,
  ];
  if (expected.startsWith('notes:') || expected.startsWith('chord-notes:')) {
    const prefix = expected.startsWith('notes:') ? 'notes:' : 'chord-notes:';
    const parts = expected.slice(prefix.length).split(',');
    parts[parts.length - 1] = parts[0] ?? 'C4';
    candidates.push(prefix + parts.join(','));
  }
  if (expected.startsWith('match:') || expected.startsWith('order:'))
    candidates.push(expected.slice(0, 6) + expected.slice(6).split(',').reverse().join(','));
  if (expected.startsWith('voice:'))
    candidates.push(
      expected.replace(
        /^voice:(\d+)/,
        (_, first: string) => `voice:${String(Number(first) + 600)}`,
      ),
    );
  if (expected.startsWith('dictation:')) {
    const values = expected.slice('dictation:'.length).split(',');
    values[0] =
      item.type === 'MELODY_DICTATION'
        ? values[0] === 'C4'
          ? 'D4'
          : 'C4'
        : values[0] === 'quarter'
          ? 'half'
          : 'quarter';
    candidates.push(`dictation:${values.join(',')}`);
  }
  const wrong = candidates.find((answer) => {
    const evaluation = evaluateExercise(item, answer);
    return evaluation.validAnswer && !evaluation.correct;
  });
  if (!wrong) throw new Error(`Falsche Antwort fehlt: ${item.type}`);
  return wrong;
}
function completed(
  definition: LessonDefinition,
  correct = definition.exercises.length,
  hint = 0,
  skip = false,
) {
  let lesson = createLessonSession(definition, 'learning-tests');
  while (lesson.phase !== 'complete') {
    if (lesson.phase === 'review-intro') {
      lesson = startLessonReview(lesson);
      continue;
    }
    if (lesson.initial.records.length + (lesson.review?.records.length ?? 0) > 400)
      throw new Error('Schleifenlimit');
    const active = activeLessonSession(lesson),
      item = active && currentItem(active);
    if (!active || !item) throw new Error('Aufgabe fehlt');
    if (skip && isAuralExercise(item)) {
      lesson = skipLessonAural(lesson);
      continue;
    }
    for (let i = 0; i < hint && lesson.phase === 'initial'; i++) lesson = revealLessonHint(lesson);
    lesson = nextLessonExercise(
      answerLesson(
        lesson,
        lesson.phase === 'review' || active.index < correct
          ? expectedAnswer(item)
          : wrongAnswer(item),
      ),
    );
  }
  return lesson;
}
function receipt(lessonId: string, passed = true): LessonProgress {
  return {
    lessonId,
    contentVersion: catalogue.lessons.find((l) => l.id === lessonId)?.contentVersion ?? 1,
    passed,
    eligibleCorrect: passed ? 10 : 0,
    total: 10,
  };
}
function lessonStatus(path: ReturnType<typeof learningPath>, id: string) {
  return path.flatMap((u) => u.lessons).find((l) => l.id === id)?.status;
}

describe('Erstversuch als geprüfter Lernnachweis', () => {
  it.each([
    [8, 6, false],
    [8, 7, true],
    [10, 7, false],
    [10, 8, true],
    [12, 9, false],
    [12, 10, true],
  ])('%i Aufgaben, %i richtig: Bestehen %s', (length, correct, passed) => {
    const source = catalogue.lessons.find(
      (l) => resolveLesson(catalogue, l.id)?.exercises.length === length,
    );
    if (!source) throw new Error('Lektion fehlt');
    const definition = resolveLesson(catalogue, source.id);
    if (!definition) throw new Error('Lektionsauflösung fehlt');
    const session = completed(definition, correct);
    const event = lessonEvent('test', session, 1000, 2000);
    expect(validateLearningEvent(catalogue, event).lesson).toMatchObject({
      passed,
      eligibleCorrect: correct,
      total: length,
    });
    expect(session.review?.records.every((r) => r.result.correct) ?? true).toBe(true);
  });
  it.each([0, 1, 2, 3])('Hinweisstufe %i wird fachlich passend gezählt', (hint) => {
    const session = completed(firstLesson, 10, hint);
    expect(
      validateLearningEvent(catalogue, lessonEvent('hint', session, 1, 2)).lesson?.passed,
    ).toBe(hint < 3);
  });
  it('ausgelassene Hörfragen bleiben im Nenner und sind keine richtigen Antworten', () => {
    const session = completed(firstLesson, 10, 0, true);
    expect(session.initial.skipped.length).toBeGreaterThan(0);
    const progress = validateLearningEvent(catalogue, lessonEvent('skip', session, 1, 2)).lesson;
    expect(progress?.total).toBe(firstLesson.exercises.length);
    expect(progress?.eligibleCorrect).toBe(
      firstLesson.exercises.length - session.initial.skipped.length,
    );
  });
  it('eine unvollständige Runde und eine fehlende Fehlerwiederholung werden abgelehnt', () => {
    expect(() => lessonEvent('partial', createLessonSession(firstLesson, 1), 1, 2)).toThrow(
      EvidenceError,
    );
    const event = lessonEvent('review', completed(firstLesson, 0), 1, 2);
    expect(() => validateLearningEvent(catalogue, { ...event, review: null })).toThrow(
      EvidenceError,
    );
  });
  it('Items, Ergebnisflags und Summary aus alten Payloads liefern keine Gutschrift', () => {
    const session = completed(firstLesson, 0);
    const altered = {
      ...session,
      initial: {
        ...session.initial,
        records: session.initial.records.map((r) => ({
          ...r,
          result: { ...r.result, correct: true },
        })),
      },
    };
    const event = legacyLessonEvent({
      id: 'legacy',
      schemaVersion: 1,
      startedAt: new Date(1).toISOString(),
      finishedAt: new Date(2).toISOString(),
      session: altered,
      summary: { correct: 10 },
    });
    expect(validateLearningEvent(catalogue, event).lesson?.passed).toBe(false);
    expect(JSON.stringify(event)).not.toContain('correct');
  });
  it('abgewandelte Indizes, zusätzliche Felder und nicht erfüllte Hörpausen werden abgelehnt', () => {
    const event = lessonEvent('forgery', completed(firstLesson), 1, 2);
    if (event.kind !== 'lesson') throw new Error('Typ');
    expect(() => learningEventSchema.parse({ ...event, passed: true })).toThrow();
    expect(() =>
      validateLearningEvent(catalogue, {
        ...event,
        initial: {
          ...event.initial,
          answers: event.initial.answers.map((r) => ({ ...r, index: 199 })),
        },
      }),
    ).toThrow();
    expect(() =>
      validateLearningEvent(catalogue, { ...event, initial: { answers: [], skipped: [0] } }),
    ).toThrow();
    expect(() => validateLearningEvent(catalogue, { ...event, finishedAt: 0 })).toThrow();
  });
  it('alte Inhaltsversionen und leere veröffentlichte Kataloge vergeben keine Gutschrift', () => {
    const event = lessonEvent('version', completed(firstLesson), 1, 2);
    expect(() =>
      validateLearningEvent(catalogue, {
        ...event,
        contentVersion: firstLesson.contentVersion + 1,
      }),
    ).toThrow('changed');
    expect(() => validateLearningEvent(publishedCatalogue, event)).toThrow('changed');
    expect(learningPath(publishedCatalogue, [])).toEqual([]);
  });
  it.each(catalogue.lessons.map((l) => l.id))(
    'reproduziert echte Aufgaben und Wiederholungen in %s',
    (id) => {
      const definition = resolveLesson(catalogue, id);
      if (!definition) throw new Error('Lektion fehlt');
      const session = completed(definition, Math.floor(definition.exercises.length / 2));
      expect(validateLearningEvent(catalogue, lessonEvent(id, session, 1, 2)).lesson).toEqual(
        lessonProgress(session),
      );
    },
  );
});

describe('Lernpfad aus Fähigkeiten und bestandenen Versuchen', () => {
  it('ordnet alle Einheiten nach ihren Voraussetzungen und öffnet nur den Einstieg', () => {
    const path = learningPath(catalogue, []);
    expect(path).toHaveLength(57);
    expect(path.flatMap((u) => u.lessons)).toHaveLength(170);
    expect(lessonStatus(path, firstLesson.id)).toBe('open');
    expect(path.some((u) => u.status === 'locked')).toBe(true);
    expect(path.some((u) => u.status === 'completed' || u.status === 'tested')).toBe(false);
    for (const unit of path)
      for (const dependency of unit.prerequisiteUnitIds)
        expect(path.findIndex((u) => u.id === dependency)).toBeLessThan(path.indexOf(unit));
  });
  it('öffnet die nächste Lektion, erhält bestandene Wiederholungen und ignoriert veraltete Versionen', () => {
    const first = learningPath(catalogue, []).find(
      (u) => u.status === 'open' && u.lessons.length > 1,
    );
    const second = first?.lessons[1];
    if (!second) throw new Error('Zweite Lektion fehlt');
    expect(lessonStatus(learningPath(catalogue, []), second.id)).toBe('locked');
    const passed = receipt(first.lessons[0]?.id ?? '');
    expect(
      lessonStatus(learningPath(catalogue, [passed, receipt(firstLesson.id, false)]), second.id),
    ).toBe('open');
    expect(
      lessonStatus(
        learningPath(catalogue, [{ ...passed, contentVersion: passed.contentVersion + 1 }]),
        second.id,
      ),
    ).toBe('locked');
  });
  it('schaltet den Graphen erst mit allen benötigten Lektionen frei, auch zwischen Bereichen', () => {
    const all = catalogue.lessons.map((l) => receipt(l.id));
    expect(learningPath(catalogue, all).every((u) => u.status === 'completed')).toBe(true);
    const initial = learningPath(catalogue, []);
    const cross = initial.find((u) =>
      u.prerequisiteUnitIds.some((id) => initial.find((p) => p.id === id)?.areaId !== u.areaId),
    );
    if (!cross) throw new Error('Bereichsübergreifende Voraussetzung fehlt');
    const missing = cross.prerequisiteUnitIds[0];
    const withoutPrerequisite = all.filter(
      (p) =>
        catalogue.lessons.find((l) => l.id === p.lessonId)?.unitId !== missing &&
        catalogue.lessons.find((l) => l.id === p.lessonId)?.unitId !== cross.id,
    );
    expect(
      learningPath(catalogue, withoutPrerequisite).find((u) => u.id === cross.id)?.status,
    ).toBe('locked');
  });
  it('getestete Einheiten bleiben freiwillig zugänglich, zählen aber nicht als bestandene Lektionen', () => {
    const tested = catalogue.units.map((u) => u.id);
    const path = learningPath(catalogue, [], tested);
    expect(
      path.every(
        (u) =>
          u.status === 'tested' &&
          u.completed === 0 &&
          u.lessons.every((l) => l.status === 'tested'),
      ),
    ).toBe(true);
    const repeated = learningPath(catalogue, [receipt(firstLesson.id)], tested);
    expect(lessonStatus(repeated, firstLesson.id)).toBe('completed');
    expect(repeated.find((u) => u.lessons.some((l) => l.id === firstLesson.id))?.completed).toBe(1);
  });
  it('eine isolierte Einstufung ohne Voraussetzungen schaltet keine höhere Einheit frei', () => {
    const locked = learningPath(catalogue, []).find((u) => u.prerequisiteUnitIds.length > 0);
    if (!locked) throw new Error('Voraussetzung fehlt');
    expect(learningPath(catalogue, [], [locked.id]).find((u) => u.id === locked.id)?.status).toBe(
      'locked',
    );
    expect(learningPath(catalogue, [], ['invented'])).toEqual(learningPath(catalogue, []));
  });
});
