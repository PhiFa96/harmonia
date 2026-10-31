import type { Evidence, Learner } from './protocol.ts';

/** Combine answer counts, never percentages. Unshared/missing data contributes no zeroes. */
export function summarizeClass(learners: readonly Learner[]): Evidence[] {
  const result = new Map<Evidence['area'], Evidence>();
  for (const learner of learners) {
    if (!learner.sharing) continue;
    for (const entry of learner.areas) {
      const existing = result.get(entry.area);
      result.set(entry.area, {
        area: entry.area,
        correct: (existing?.correct ?? 0) + entry.correct,
        total: (existing?.total ?? 0) + entry.total,
        completed: (existing?.completed ?? 0) + entry.completed,
        at: existing && existing.at > entry.at ? existing.at : entry.at,
      });
    }
  }
  return [...result.values()].sort((a, b) => a.area.localeCompare(b.area));
}
