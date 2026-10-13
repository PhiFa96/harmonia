import { resolveLesson } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
// Ausschließlich der für diese Build-Variante ausgelieferte Katalog, ohne Fortschrittsfreischaltung.
export const firstLesson = resolveLesson(catalogue, catalogue.lessons[0]?.id ?? '');
export const lessonGroups = catalogue.units
  .map((unit) => {
    const level = catalogue.levels.find((value) => value.id === unit.levelId);
    if (!level) throw new Error('Stufe der Einheit fehlt');
    const lessons = catalogue.lessons
      .filter((lesson) => lesson.unitId === unit.id)
      .map((lesson) => resolveLesson(catalogue, lesson.id))
      .filter((lesson) => lesson !== undefined);
    return { unit, level, lessons };
  })
  .filter((group) => group.lessons.length > 0);

/** Fehlende ID erhält den bisherigen Einstieg; leere, doppelte oder unbekannte IDs nicht. */
export function selectedLesson(id: unknown) {
  if (id === undefined) return firstLesson;
  return typeof id === 'string' && id.length > 0 ? resolveLesson(catalogue, id) : undefined;
}
