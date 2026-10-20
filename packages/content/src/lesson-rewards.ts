export { lessonDay } from './calendar.ts';
import { DEFAULT_REWARD_RULE } from './motivation.ts';
import type { RewardRule } from './motivation.ts';
import type { LessonSession } from '@harmonia/exercises';
import { lessonProgress } from './learning-evidence.ts';
import { isPracticeLesson } from './lesson-flow.ts';
/** Regelversion 1. Erneutes Bestehen derselben Inhaltsversion verwendet die Wiederholungsbasis. */
export function lessonReward(
  session: LessonSession,
  repeat: boolean,
  rule: RewardRule = DEFAULT_REWARD_RULE,
) {
  const progress = lessonProgress(session);
  if (!progress.passed || isPracticeLesson(session.lesson.id)) return 0;
  const records = session.initial.records;
  const weight = records.reduce((sum, r) => sum + (rule.hintWeights[r.hintLevel] ?? 0), 0);
  const base = Math.floor(((repeat ? rule.repeat : rule.lesson) * weight) / (progress.total * 100));
  const accurate =
    progress.eligibleCorrect * 100 >= progress.total * rule.accuracyPercent
      ? rule.accuracyBonus
      : 0;
  const independent =
    records.length === progress.total && records.every((r) => r.hintLevel === 0)
      ? rule.independentBonus
      : 0;
  return base + accurate + independent;
}
export interface LessonRewardReceipt {
  readonly amount: number;
  readonly date: string;
  readonly coins?: number | undefined;
  readonly qualified?: boolean | undefined;
  readonly ruleVersion?: number | undefined;
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
