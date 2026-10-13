import type { ContentCatalogue } from './catalogue-schema.ts';
import type { LessonProgress } from './learning-evidence.ts';

export type PathStatus = 'locked' | 'open' | 'completed' | 'tested';
export interface PathLesson {
  readonly id: string;
  readonly titleKey: `content.${string}`;
  readonly contentVersion: number;
  readonly status: PathStatus;
  readonly prerequisiteUnitIds: readonly string[];
}
export interface PathUnit {
  readonly id: string;
  readonly titleKey: `content.${string}`;
  readonly areaId: string;
  readonly level: number;
  readonly status: PathStatus;
  readonly completed: number;
  readonly lessons: readonly PathLesson[];
  readonly prerequisiteUnitIds: readonly string[];
}
/** Status ist ein abgeleiteter Stand; misslungene Wiederholungen löschen keinen bereits bestandenen Versuch. */
export function learningPath(
  catalogue: ContentCatalogue,
  progress: readonly LessonProgress[],
  testedUnitIds: readonly string[] = [],
): PathUnit[] {
  const passed = new Set(
    progress
      .filter(
        (p) =>
          p.passed &&
          catalogue.lessons.some(
            (l) => l.id === p.lessonId && l.contentVersion === p.contentVersion,
          ),
      )
      .map((p) => p.lessonId),
  );
  const units = catalogue.units.filter((u) => catalogue.lessons.some((l) => l.unitId === u.id));
  const tested = new Set(testedUnitIds.filter((id) => units.some((u) => u.id === id)));
  const skillLessons = (id: string) => catalogue.lessons.filter((l) => l.skillIds.includes(id));
  const skillUnit = (id: string) => skillLessons(id)[0]?.unitId;
  const mastered = new Set<string>();
  for (let pass = 0; pass <= catalogue.skills.length; pass++) {
    let changed = false;
    for (const skill of catalogue.skills) {
      const lessons = skillLessons(skill.id);
      if (
        !mastered.has(skill.id) &&
        lessons.length > 0 &&
        lessons.every((l) => passed.has(l.id) || tested.has(l.unitId)) &&
        skill.prerequisites.every((id) => mastered.has(id))
      ) {
        mastered.add(skill.id);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const result = units.map((unit): PathUnit => {
    const level = catalogue.levels.find((l) => l.id === unit.levelId);
    if (!level) throw new Error('Pfadstufe fehlt');
    const lessons = catalogue.lessons.filter((l) => l.unitId === unit.id);
    const unmet = new Set(
      lessons
        .flatMap((l) => l.skillIds)
        .flatMap((id) => catalogue.skills.find((s) => s.id === id)?.prerequisites ?? [])
        .filter((id) => skillUnit(id) !== unit.id && !mastered.has(id)),
    );
    const prerequisiteUnitIds = [
      ...new Set([...unmet].map(skillUnit).filter((id) => id !== undefined)),
    ];
    const testedHere = tested.has(unit.id) && prerequisiteUnitIds.length === 0;
    const pathLessons = lessons.map((lesson, index): PathLesson => ({
      id: lesson.id,
      titleKey: lesson.titleKey,
      contentVersion: lesson.contentVersion,
      status: passed.has(lesson.id)
        ? 'completed'
        : testedHere
          ? 'tested'
          : prerequisiteUnitIds.length === 0 &&
              lessons.slice(0, index).every((l) => passed.has(l.id))
            ? 'open'
            : 'locked',
      prerequisiteUnitIds,
    }));
    const completed = pathLessons.filter((l) => l.status === 'completed').length;
    return {
      id: unit.id,
      titleKey: unit.titleKey,
      areaId: level.areaId,
      level: level.number,
      completed,
      status:
        completed === lessons.length
          ? 'completed'
          : testedHere
            ? 'tested'
            : pathLessons.some((l) => l.status === 'open' || l.status === 'completed')
              ? 'open'
              : 'locked',
      lessons: pathLessons,
      prerequisiteUnitIds,
    };
  });
  // Stabile topologische Reihenfolge der Einheiten, innerhalb einer Stufe aus dem Katalog.
  const ordered: PathUnit[] = [],
    remaining = [...result].sort((a, b) => a.level - b.level);
  while (remaining.length) {
    const i = remaining.findIndex((u) =>
      catalogue.lessons
        .filter((l) => l.unitId === u.id)
        .flatMap((l) => l.skillIds)
        .flatMap((id) => catalogue.skills.find((s) => s.id === id)?.prerequisites ?? [])
        .every((id) => {
          const dependency = skillUnit(id);
          return (
            dependency === undefined ||
            dependency === u.id ||
            ordered.some((r) => r.id === dependency)
          );
        }),
    );
    if (i < 0) throw new Error('Einheiten erzeugen einen zyklischen Pfad');
    const next = remaining.splice(i, 1)[0];
    if (next) ordered.push(next);
  }
  return ordered;
}
