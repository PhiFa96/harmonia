import type { PlacementBank, PlacementCheckpoint, PlacementEstimate } from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';

/** Ausschließlich injizierte Auslieferungsdaten; kein Zugriff auf Entwurfskatalog oder Planungsindex. */
export function placementBank(catalogue: ContentCatalogue): PlacementBank {
  const areas = catalogue.areas.flatMap((area) => {
    const levels = catalogue.levels
      .filter((level) => level.areaId === area.id && level.number <= 2)
      .sort((a, b) => a.number - b.number);
    const sources: PlacementCheckpoint[] = levels
      .flatMap((level) =>
        catalogue.units
          .filter((unit) => unit.levelId === level.id)
          .flatMap((unit) =>
            catalogue.lessons
              .filter((lesson) => lesson.unitId === unit.id)
              .map((lesson) => ({
                id: lesson.id,
                unitId: unit.id,
                lessonId: lesson.id,
                level: level.number,
                specs: catalogue.exerciseSets
                  .filter((set) => lesson.exerciseSetIds.includes(set.id))
                  .flatMap((set) => set.exercises.map((entry) => entry.spec)),
              })),
          ),
      )
      .filter((source) => source.specs.length > 0);
    if (sources.length < 4) return [];
    return [
      {
        id: area.id,
        titleKey: area.titleKey,
        checkpoints: [0, 1, 2, 3]
          .map((tier) => sources[Math.floor((tier * (sources.length - 1)) / 3)])
          .filter((source) => source !== undefined),
      },
    ];
  });
  // Versions-/Parameterwechsel invalidiert ein Replay, Sprach- und Designwechsel nicht.
  const input = JSON.stringify([catalogue.contentVersion, areas]);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++)
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619) >>> 0;
  return { key: `placement-1:${hash.toString(16)}`, areas };
}

export function ratingPlacementBank(catalogue: ContentCatalogue): PlacementBank {
  const previous = placementBank(catalogue);
  return {
    ...previous,
    key: previous.key.replace('placement-1:', 'placement-2:'),
    algorithm: 'glicko2-v1',
    previous,
  };
}
export function placementBankForKey(catalogue: ContentCatalogue, key: string) {
  const current = ratingPlacementBank(catalogue);
  if (current.key === key) return current;
  if (current.previous?.key === key) return current.previous;
  return undefined;
}

export interface PlacementRecommendation {
  readonly areaId: string;
  readonly level: number | null;
  readonly lessonId: string;
  readonly unitId: string;
  /** Geschätzt übersprungene Einheiten, weder abgeschlossene Lektionen noch nachgewiesene Einzel-Skills. */
  readonly testedUnitIds: readonly string[];
  readonly prerequisiteUnitIds: readonly string[];
}
export function placementRecommendations(
  catalogue: ContentCatalogue,
  bank: PlacementBank,
  estimates: readonly PlacementEstimate[],
  complete: boolean,
): PlacementRecommendation[] {
  const recommendations = bank.areas.flatMap((area) => {
    const estimate = estimates.find((e) => e.areaId === area.id);
    const confirmed = complete && !estimate?.uncertain ? estimate?.confirmedTier : null;
    const start =
      area.checkpoints[
        confirmed === null || confirmed === undefined ? 0 : Math.min(3, confirmed + 1)
      ];
    if (!start || !catalogue.lessons.some((lesson) => lesson.id === start.lessonId)) return [];
    const areaLevels = catalogue.levels.filter((level) => level.areaId === area.id);
    const units = catalogue.units.filter((unit) =>
      areaLevels.some((level) => level.id === unit.levelId),
    );
    const testedUnitIds =
      complete && confirmed !== null && confirmed !== undefined && confirmed >= 0
        ? units
            .slice(
              0,
              Math.max(
                0,
                units.findIndex((unit) => unit.id === start.unitId),
              ),
            )
            .map((unit) => unit.id)
        : [];
    const first = catalogue.lessons.find((lesson) => lesson.unitId === start.unitId);
    if (!first) return [];
    return [
      {
        areaId: area.id,
        level:
          confirmed === null || confirmed === undefined
            ? null
            : confirmed < 0
              ? 0
              : (area.checkpoints[confirmed]?.level ?? null),
        lessonId: first.id,
        unitId: start.unitId,
        testedUnitIds,
        prerequisiteUnitIds: [] as string[],
      },
    ];
  });
  const skillUnit = new Map(
    catalogue.lessons.flatMap((lesson) =>
      lesson.skillIds.map((id) => [id, lesson.unitId] as const),
    ),
  );
  const unitSkills = (id: string) =>
    catalogue.lessons.filter((lesson) => lesson.unitId === id).flatMap((lesson) => lesson.skillIds);
  const tested = new Set(recommendations.flatMap((r) => r.testedUnitIds));
  // Auch geschätzt übersprungene Einheiten müssen eine geschlossene Voraussetzungskette haben.
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of tested) {
      const missing = unitSkills(id).some((skillId) =>
        catalogue.skills
          .find((s) => s.id === skillId)
          ?.prerequisites.some((p) => {
            const unit = skillUnit.get(p);
            return unit !== undefined && unit !== id && !tested.has(unit);
          }),
      );
      if (missing) {
        tested.delete(id);
        changed = true;
      }
    }
  }
  return recommendations.map((r) => {
    const prerequisites = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      for (const p of catalogue.skills.find((s) => s.id === id)?.prerequisites ?? []) {
        const unit = skillUnit.get(p);
        if (unit !== undefined && unit !== r.unitId && !tested.has(unit)) prerequisites.add(unit);
        visit(p);
      }
    };
    for (const skill of unitSkills(r.unitId)) visit(skill);
    return {
      ...r,
      testedUnitIds: r.testedUnitIds.filter((id) => tested.has(id)),
      prerequisiteUnitIds: catalogue.units.filter((u) => prerequisites.has(u.id)).map((u) => u.id),
    };
  });
}

/** Der erste Schritt berücksichtigt Lücken auch in anderen Bereichen; kein mittlerer Gesamtwert. */
export function placementFirstLesson(
  catalogue: ContentCatalogue,
  recommendations: readonly PlacementRecommendation[],
): string | undefined {
  const units = new Set(recommendations.flatMap((r) => [...r.prerequisiteUnitIds, r.unitId]));
  const levelNumber = (id: string) =>
    catalogue.levels.find((l) => l.id === catalogue.units.find((u) => u.id === id)?.levelId)
      ?.number ?? 1;
  const first = catalogue.units
    .filter((u) => units.has(u.id))
    .sort((a, b) => levelNumber(a.id) - levelNumber(b.id))[0];
  return catalogue.lessons.find((lesson) => lesson.unitId === first?.id)?.id;
}
