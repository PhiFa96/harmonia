import { COLLECTIONS, catalogueSchema } from './catalogue-schema.ts';
import type { ContentCatalogue, ContentRecord } from './catalogue-schema.ts';
import { lessonSchema } from './schema.ts';
import type { LessonContent } from './schema.ts';

export interface TextTree {
  readonly [key: string]: string | TextTree;
}
export interface ContentChecks {
  readonly messages: Readonly<Record<'de' | 'en-US' | 'en-GB', TextTree>>;
  /** Notationsparser + Engine-Prüfung, vom Werkzeug injiziert (keine Plattform-Abhängigkeit). */
  readonly validateScore: (source: string) => void;
}
export class ContentValidationError extends Error {
  readonly problems: readonly string[];
  constructor(problems: readonly string[]) {
    super(`Inhalte ungültig:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    this.name = 'ContentValidationError';
    this.problems = problems;
  }
}

export function textAt(tree: TextTree, key: string): string | undefined {
  let value: string | TextTree | undefined = tree;
  for (const part of key.split('.'))
    value = typeof value === 'object' && Object.hasOwn(value, part) ? value[part] : undefined;
  return typeof value === 'string' ? value : undefined;
}

/** Alle Textreferenzen, einschließlich der Notenbeispiel-Beschriftungen. */
export function textKeys(catalogue: ContentCatalogue): string[] {
  const keys = new Set<string>();
  for (const collection of COLLECTIONS)
    for (const record of catalogue[collection]) keys.add(record.titleKey);
  for (const card of catalogue.knowledgeCards) {
    keys.add(card.bodyKey);
    for (const example of card.examples) keys.add(example.captionKey);
  }
  for (const article of catalogue.knowledgeArticles)
    for (const section of article.sections) {
      keys.add(section.headingKey);
      keys.add(section.bodyKey);
      for (const example of section.examples) keys.add(example.captionKey);
    }
  return [...keys].sort();
}

export function parseCatalogue(input: unknown, checks?: ContentChecks): ContentCatalogue {
  const parsed = catalogueSchema.safeParse(input);
  if (!parsed.success)
    throw new ContentValidationError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  const catalogue = parsed.data;
  const problems: string[] = [];
  const all = new Map<string, ContentRecord>();
  for (const collection of COLLECTIONS)
    for (const record of catalogue[collection]) {
      if (all.has(record.id)) problems.push(`${record.id}: ID mehrfach vergeben`);
      all.set(record.id, record);
      if (record.contentVersion > catalogue.contentVersion)
        problems.push(`${record.id}: Version größer als Katalogversion`);
    }
  function reference(owner: ContentRecord, id: string, collection: (typeof COLLECTIONS)[number]) {
    const target = catalogue[collection].find((value) => value.id === id);
    if (!target) problems.push(`${owner.id}: unbekannte Referenz ${id} in ${collection}`);
    else if (owner.status === 'freigegeben' && target.status !== 'freigegeben')
      problems.push(`${owner.id}: freigegebener Inhalt verweist auf ${target.status} ${id}`);
  }
  const levelNumbers = new Set<string>();
  for (const level of catalogue.levels) {
    reference(level, level.areaId, 'areas');
    const key = `${level.areaId}:${String(level.number)}`;
    if (levelNumbers.has(key)) problems.push(`${level.id}: Stufennummer im Bereich doppelt`);
    levelNumbers.add(key);
  }
  for (const unit of catalogue.units) reference(unit, unit.levelId, 'levels');
  for (const skill of catalogue.skills) {
    reference(skill, skill.areaId, 'areas');
    for (const id of skill.prerequisites) reference(skill, id, 'skills');
  }
  for (const record of [
    ...catalogue.exerciseSets,
    ...catalogue.knowledgeCards,
    ...catalogue.knowledgeArticles,
    ...catalogue.lessons,
  ]) {
    for (const id of record.skillIds) reference(record, id, 'skills');
  }
  for (const lesson of catalogue.lessons) {
    reference(lesson, lesson.unitId, 'units');
    for (const id of lesson.introductionCardIds) reference(lesson, id, 'knowledgeCards');
    for (const id of lesson.exerciseSetIds) reference(lesson, id, 'exerciseSets');
    const total = catalogue.exerciseSets
      .filter((set) => lesson.exerciseSetIds.includes(set.id))
      .reduce(
        (sum, set) => sum + set.exercises.reduce((count, entry) => count + entry.count, 0),
        0,
      );
    if (total > 200) problems.push(`${lesson.id}: mehr als 200 Aufgaben`);
    const trained = new Set(lesson.skillIds);
    for (const set of catalogue.exerciseSets.filter((value) =>
      lesson.exerciseSetIds.includes(value.id),
    ))
      for (const id of set.skillIds) {
        if (!trained.has(id)) problems.push(`${lesson.id}: Fähigkeit ${id} des Übungssatzes fehlt`);
      }
  }

  // Iterativer DFS: auch große Fähigkeitsgraphen ohne Rekursionslimit prüfen.
  const skills = new Map(catalogue.skills.map((skill) => [skill.id, skill]));
  const done = new Set<string>();
  const active = new Set<string>();
  for (const root of skills.keys()) {
    const stack: { id: string; exit: boolean }[] = [{ id: root, exit: false }];
    while (stack.length > 0) {
      const frame = stack.pop();
      if (!frame) break;
      if (frame.exit) {
        active.delete(frame.id);
        done.add(frame.id);
        continue;
      }
      if (active.has(frame.id)) {
        problems.push(`${frame.id}: Zyklus im Fähigkeitsgraph`);
        continue;
      }
      if (done.has(frame.id)) continue;
      active.add(frame.id);
      stack.push({ id: frame.id, exit: true });
      for (const id of skills.get(frame.id)?.prerequisites ?? []) stack.push({ id, exit: false });
    }
  }
  if (checks) {
    const knownKeys = new Set(textKeys(catalogue));
    const approvedKeys = new Set(textKeys(releasedOnly(catalogue)));
    for (const key of textKeys(catalogue))
      for (const locale of ['de', 'en-US', 'en-GB'] as const) {
        const text = textAt(checks.messages[locale], key);
        if (!text?.trim()) problems.push(`${key}: Text fehlt oder ist leer (${locale})`);
      }
    for (const key of textKeys(catalogue)) {
      const placeholders = (text: string) =>
        [...text.matchAll(/\{\{\s*([^,}\s]+)/g)]
          .map((match) => match[1])
          .sort()
          .join(',');
      const de = textAt(checks.messages.de, key) ?? '';
      for (const locale of ['en-US', 'en-GB'] as const)
        if (placeholders(de) !== placeholders(textAt(checks.messages[locale], key) ?? ''))
          problems.push(`${key}: Platzhalter unterscheiden sich (${locale})`);
    }
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const nested = new Map<string, string[]>();
      for (const key of knownKeys) {
        const targets = [
          ...(textAt(checks.messages[locale], key) ?? '').matchAll(
            /\$t\(\s*(?:translation:)?(content\.[^,)]+)/g,
          ),
        ].map((match) => match[1]?.trim() ?? '');
        nested.set(key, targets);
        for (const target of targets) {
          if (!knownKeys.has(target))
            problems.push(`${key}: unbekannte Inhalts-Textreferenz ${target} (${locale})`);
          else if (approvedKeys.has(key) && !approvedKeys.has(target))
            problems.push(
              `${key}: freigegebener Text verweist auf ungeprüften Inhalt ${target} (${locale})`,
            );
        }
      }
      const visited = new Set<string>();
      const visiting = new Set<string>();
      for (const root of knownKeys) {
        const stack = [{ id: root, exit: false }];
        while (stack.length > 0) {
          const frame = stack.pop();
          if (!frame) break;
          if (frame.exit) {
            visiting.delete(frame.id);
            visited.add(frame.id);
            continue;
          }
          if (visiting.has(frame.id)) {
            problems.push(`${frame.id}: Zyklus in Inhalts-Textreferenzen (${locale})`);
            continue;
          }
          if (visited.has(frame.id)) continue;
          visiting.add(frame.id);
          stack.push({ id: frame.id, exit: true });
          for (const id of nested.get(frame.id) ?? []) stack.push({ id, exit: false });
        }
      }
    }
    const examples = [
      ...catalogue.knowledgeCards.flatMap((card) => card.examples),
      ...catalogue.knowledgeArticles.flatMap((article) =>
        article.sections.flatMap((section) => section.examples),
      ),
    ];
    for (const example of examples)
      try {
        checks.validateScore(example.score);
      } catch {
        problems.push(`${example.captionKey}: ungültiges Notenbeispiel ${example.score}`);
      }
  }
  if (problems.length > 0) throw new ContentValidationError(problems);
  return catalogue;
}

export function publicCatalogue(catalogue: ContentCatalogue): ContentCatalogue {
  // Freigabeabhängigkeiten müssen geschlossen sein, bevor irgendetwas öffentlich wird.
  parseCatalogue(catalogue);
  return releasedOnly(catalogue);
}

function releasedOnly(catalogue: ContentCatalogue): ContentCatalogue {
  return {
    ...catalogue,
    areas: catalogue.areas.filter((value) => value.status === 'freigegeben'),
    levels: catalogue.levels.filter((value) => value.status === 'freigegeben'),
    units: catalogue.units.filter((value) => value.status === 'freigegeben'),
    skills: catalogue.skills.filter((value) => value.status === 'freigegeben'),
    exerciseSets: catalogue.exerciseSets.filter((value) => value.status === 'freigegeben'),
    knowledgeCards: catalogue.knowledgeCards.filter((value) => value.status === 'freigegeben'),
    knowledgeArticles: catalogue.knowledgeArticles.filter(
      (value) => value.status === 'freigegeben',
    ),
    lessons: catalogue.lessons.filter((value) => value.status === 'freigegeben'),
  };
}

export function resolveLesson(catalogue: ContentCatalogue, id: string): LessonContent | undefined {
  const lesson = catalogue.lessons.find((value) => value.id === id);
  if (!lesson) return undefined;
  const introduction = lesson.introductionCardIds.map((cardId) => {
    const card = catalogue.knowledgeCards.find((value) => value.id === cardId);
    if (!card) throw new ContentValidationError([`${id}: Einführung ${cardId} fehlt`]);
    return { titleKey: card.titleKey, bodyKey: card.bodyKey, examples: card.examples };
  });
  const exercises = lesson.exerciseSetIds.flatMap((setId) => {
    const set = catalogue.exerciseSets.find((value) => value.id === setId);
    if (!set) throw new ContentValidationError([`${id}: Übungssatz ${setId} fehlt`]);
    return set.exercises.flatMap((entry) => Array.from({ length: entry.count }, () => entry.spec));
  });
  return lessonSchema.parse({
    id: lesson.id,
    contentVersion: lesson.contentVersion,
    status: lesson.status,
    titleKey: lesson.titleKey,
    introduction,
    exercises,
  });
}

export function publicMessages(catalogue: ContentCatalogue, source: TextTree): TextTree {
  const result: Record<string, string | TextTree> = {};
  for (const key of textKeys(catalogue)) {
    const text = textAt(source, key);
    if (!text?.trim()) throw new ContentValidationError([`${key}: öffentlicher Text fehlt`]);
    let cursor = result;
    const parts = key.split('.');
    for (const part of parts.slice(0, -1)) {
      const next = cursor[part];
      if (typeof next === 'string')
        throw new ContentValidationError([`${key}: Textpfad kollidiert`]);
      cursor[part] ??= {};
      cursor = cursor[part] as Record<string, string | TextTree>;
    }
    const last = parts.at(-1);
    if (last) cursor[last] = text;
  }
  return result;
}
