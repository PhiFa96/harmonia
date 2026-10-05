import { z } from 'zod';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { ContentValidationError } from './catalogue.ts';
import { contentIdSchema } from './schema.ts';

/** Interner Planungsindex. Reihenfolge und Zuordnung sind keine Fortschritts- oder Bestehensregel. */
export const curriculumPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: z.number().int().positive(),
    scopeLevels: z
      .array(z.number().int().min(1).max(6))
      .nonempty()
      .refine((values) => new Set(values).size === values.length, 'Doppelte Stufe im Plan'),
    units: z
      .array(
        z
          .object({
            unitId: contentIdSchema,
            skillIds: z
              .array(contentIdSchema)
              .nonempty()
              .refine((values) => new Set(values).size === values.length, 'Doppelte Fähigkeit'),
          })
          .strict(),
      )
      .nonempty(),
  })
  .strict();
export type CurriculumPlan = z.infer<typeof curriculumPlanSchema>;
export interface CurriculumSkill {
  readonly skill: ContentCatalogue['skills'][number];
  readonly unit: ContentCatalogue['units'][number];
  readonly level: ContentCatalogue['levels'][number];
  readonly area: ContentCatalogue['areas'][number];
  readonly order: number;
}

/** Jede Fähigkeit genau einer Einheit zuordnen; alle Voraussetzungen liegen vor ihrem Lernziel. */
export function parseCurriculum(input: unknown, catalogue: ContentCatalogue): CurriculumPlan {
  const parsed = curriculumPlanSchema.safeParse(input);
  if (!parsed.success)
    throw new ContentValidationError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  const plan = parsed.data;
  const problems: string[] = [];
  if (plan.contentVersion !== catalogue.contentVersion)
    problems.push('Planversion passt nicht zur Katalogversion');
  const units = new Map(catalogue.units.map((unit) => [unit.id, unit]));
  const levels = new Map(catalogue.levels.map((level) => [level.id, level]));
  const skills = new Map(catalogue.skills.map((skill) => [skill.id, skill]));
  const assignedUnits = new Set<string>();
  const assignedLevels = new Set<string>();
  const placements = new Map<string, { order: number; level: number }>();
  let order = 0;
  let previousLevel = 0;
  for (const entry of plan.units) {
    if (assignedUnits.has(entry.unitId)) problems.push(`${entry.unitId}: Einheit mehrfach im Plan`);
    assignedUnits.add(entry.unitId);
    const unit = units.get(entry.unitId);
    const level = unit ? levels.get(unit.levelId) : undefined;
    if (!unit || !level) {
      problems.push(`${entry.unitId}: unbekannte Einheit oder Stufe im Plan`);
      continue;
    }
    assignedLevels.add(level.id);
    if (!plan.scopeLevels.includes(level.number))
      problems.push(`${unit.id}: Stufe außerhalb des Planumfangs`);
    if (level.number < previousLevel)
      problems.push(`${unit.id}: Einheitenreihenfolge springt auf niedrigere Stufe zurück`);
    previousLevel = level.number;
    for (const id of entry.skillIds) {
      const skill = skills.get(id);
      if (!skill) {
        problems.push(`${unit.id}: unbekannte Fähigkeit ${id}`);
        continue;
      }
      if (skill.areaId !== level.areaId)
        problems.push(`${id}: Fähigkeit und Einheit gehören zu verschiedenen Bereichen`);
      if (placements.has(id)) problems.push(`${id}: Fähigkeit mehrfach zugeordnet`);
      placements.set(id, { order: order++, level: level.number });
    }
  }
  for (const unit of catalogue.units)
    if (!assignedUnits.has(unit.id)) problems.push(`${unit.id}: Einheit fehlt im Plan`);
  for (const level of catalogue.levels)
    if (!assignedLevels.has(level.id)) problems.push(`${level.id}: Stufe ohne geplante Einheit`);
  for (const number of plan.scopeLevels)
    if (!catalogue.levels.some((level) => level.number === number))
      problems.push(`Stufe ${String(number)}: im Planumfang, aber ohne Katalogeintrag`);
  for (const skill of catalogue.skills) {
    const placement = placements.get(skill.id);
    if (!placement) {
      problems.push(`${skill.id}: Fähigkeit fehlt im Plan`);
      continue;
    }
    for (const id of skill.prerequisites) {
      const prerequisite = placements.get(id);
      if (!prerequisite) problems.push(`${skill.id}: Voraussetzung ${id} ist nicht zugeordnet`);
      else {
        if (prerequisite.order >= placement.order)
          problems.push(`${skill.id}: Voraussetzung ${id} kommt erst später im Plan`);
        if (prerequisite.level > placement.level)
          problems.push(`${skill.id}: Voraussetzung ${id} liegt auf einer höheren Stufe`);
      }
    }
  }
  if (problems.length > 0) throw new ContentValidationError(problems);
  return plan;
}

/** Geprüfte, stabile Reihenfolge für Planungswerkzeuge; lädt selbst keine Inhaltsdaten. */
export function curriculumSkills(
  catalogue: ContentCatalogue,
  input: unknown,
): readonly CurriculumSkill[] {
  const plan = parseCurriculum(input, catalogue);
  const result: CurriculumSkill[] = [];
  for (const entry of plan.units) {
    const unit = catalogue.units.find((value) => value.id === entry.unitId);
    const level = catalogue.levels.find((value) => value.id === unit?.levelId);
    const area = catalogue.areas.find((value) => value.id === level?.areaId);
    if (!unit || !level || !area) throw new ContentValidationError(['Katalogzuordnung fehlt']);
    for (const id of entry.skillIds) {
      const skill = catalogue.skills.find((value) => value.id === id);
      if (!skill) throw new ContentValidationError([`${id}: Fähigkeit fehlt`]);
      result.push({ skill, unit, level, area, order: result.length });
    }
  }
  return result;
}
