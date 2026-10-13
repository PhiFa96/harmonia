import type { LessonSession } from '@harmonia/exercises';
import { lessonProgress } from './learning-evidence.ts';
/** Regelversion 1. Erneutes Bestehen derselben Inhaltsversion verwendet die Wiederholungsbasis. */
export function lessonReward(session: LessonSession, repeat: boolean) {
  const progress = lessonProgress(session);
  if (!progress.passed) return 0;
  const records = session.initial.records;
  const weight = records.reduce((sum, r) => sum + (r.hintLevel === 3 ? 0 : 10 - r.hintLevel), 0);
  const base = Math.floor(((repeat ? 5 : 10) * weight) / (progress.total * 10));
  const accurate = progress.eligibleCorrect * 100 >= progress.total * 90 ? 5 : 0;
  const independent =
    records.length === progress.total && records.every((r) => r.hintLevel === 0) ? 3 : 0;
  return base + accurate + independent;
}
export interface LessonRewardReceipt {
  readonly amount: number;
  readonly date: string;
}
export function lessonDay(time: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(time);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
/** Tagesmenge statt Abschlusszählung: zwei Geräte/Versuche an einem Tag erhöhen die Serie nicht. */
export function lessonStreak(days: readonly string[], today: string) {
  const unique = new Set(days);
  const yesterday = (day: string) =>
    new Date(Date.parse(`${day}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
  let day = unique.has(today) ? today : yesterday(today),
    current = 0;
  while (unique.has(day)) {
    current++;
    day = yesterday(day);
  }
  return current;
}
