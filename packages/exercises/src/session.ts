import { evaluateExercise } from './evaluate.ts';
import { isAuralExercise } from './chords.ts';
import type { Evaluation, ExerciseItem } from './types.ts';

export interface AnswerRecord {
  readonly index: number;
  readonly result: Evaluation;
  readonly hintLevel: number;
}
export interface ExerciseSession {
  readonly items: readonly ExerciseItem[];
  readonly index: number;
  readonly records: readonly AnswerRecord[];
  readonly skipped: readonly number[];
  readonly skipAural: boolean;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly result?: Evaluation;
}
export function createSession(items: readonly ExerciseItem[]): ExerciseSession {
  if (items.length === 0) throw new RangeError('Ein Übungssatz braucht mindestens eine Aufgabe');
  return { items: [...items], index: 0, records: [], skipped: [], skipAural: false, hintLevel: 0 };
}
export function currentItem(session: ExerciseSession): ExerciseItem | undefined {
  return session.items[session.index];
}
export function answerSession(session: ExerciseSession, answer: string): ExerciseSession {
  const item = currentItem(session);
  if (!item || session.result) return session;
  const result = evaluateExercise(item, answer);
  if (!result.validAnswer) return session;
  return {
    ...session,
    result,
    records: [...session.records, { index: session.index, result, hintLevel: session.hintLevel }],
  };
}
export function revealHint(session: ExerciseSession): ExerciseSession {
  if (!currentItem(session) || session.result || session.hintLevel === 3) return session;
  const hintLevel = (session.hintLevel + 1) as 1 | 2 | 3;
  return { ...session, hintLevel };
}
function advance(session: ExerciseSession, start: number): ExerciseSession {
  let index = start;
  while (index < session.items.length && session.skipped.includes(index)) index++;
  const rest = { ...session };
  delete rest.result;
  return { ...rest, index, hintLevel: 0 };
}
export function nextExercise(session: ExerciseSession): ExerciseSession {
  return session.result ? advance(session, session.index + 1) : session;
}
/** Alle noch unbeantworteten Hörfragen überspringen; keine davon zählt als Fehler. */
export function skipAuralExercises(session: ExerciseSession): ExerciseSession {
  const skipped = new Set(session.skipped);
  for (let index = session.index; index < session.items.length; index++) {
    const item = session.items[index];
    if (item && isAuralExercise(item) && !session.records.some((record) => record.index === index))
      skipped.add(index);
  }
  const next = { ...session, skipped: [...skipped], skipAural: true };
  return skipped.has(session.index) ? advance(next, session.index + 1) : next;
}
export function sessionSummary(session: ExerciseSession) {
  return {
    total: session.items.length,
    answered: session.records.length,
    correct: session.records.filter((record) => record.result.correct).length,
    independentCorrect: session.records.filter(
      (record) => record.result.correct && record.hintLevel === 0,
    ).length,
    assisted: session.records.filter((record) => record.hintLevel > 0).length,
    skipped: session.skipped.length,
  };
}
