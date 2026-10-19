import { timeZoneSchema } from './calendar.ts';
export { timeZoneSchema } from './calendar.ts';
import { z } from 'zod';
import { resolveLesson, lessonExerciseSources } from './catalogue.ts';
import type { ContentCatalogue } from './catalogue-schema.ts';
import type { LessonContent } from './schema.ts';
import {
  answerLesson,
  createLessonSession,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  skipLessonVoice,
  startLessonReview,
  adaptiveOrder,
  candidateProbability,
  ratingBucket,
} from '@harmonia/exercises';
import type { LessonSession, RatingSnapshot } from '@harmonia/exercises';

export const WEAKNESS_LESSON_ID = 'practice.weakness';
export const REVIEW_LESSON_ID = 'practice.review';
export const isPracticeLesson = (id: string) =>
  id === WEAKNESS_LESSON_ID || id === REVIEW_LESSON_ID;

function repetitionSources(catalogue: ContentCatalogue, id: string) {
  const record = catalogue.lessons.find((l) => l.id === id);
  if (!record) return [];
  const prerequisites = new Set<string>();
  const visit = (skillId: string) => {
    for (const prior of catalogue.skills.find((s) => s.id === skillId)?.prerequisites ?? []) {
      if (prerequisites.has(prior)) continue;
      prerequisites.add(prior);
      visit(prior);
    }
  };
  record.skillIds.forEach(visit);
  const siblings = catalogue.lessons.filter((l) => l.unitId === record.unitId);
  const earlier = siblings.slice(
    0,
    siblings.findIndex((l) => l.id === id),
  );
  return catalogue.lessons.filter(
    (l) => l.id !== id && (earlier.includes(l) || l.skillIds.every((s) => prerequisites.has(s))),
  );
}

/** Wiederholung ausschließlich aus früheren Lektionen und der Voraussetzungshülle. Feste Altpläne bleiben reproduzierbar. */
function fixedLessonPlan(catalogue: ContentCatalogue, id: string) {
  const content = resolveLesson(catalogue, id);
  const record = catalogue.lessons.find((l) => l.id === id);
  if (!content || !record) return undefined;
  const origins = lessonExerciseSources(catalogue, id);
  if (!origins) throw new Error('Aufgabenherkunft fehlt');
  const sources = repetitionSources(catalogue, id);
  const count = Math.max(
    0,
    Math.min(
      15 - content.exercises.length,
      sources.length ? 2 + Math.floor(sources.length / 3) : 0,
      5,
    ),
  );
  const repeats = Array.from({ length: count }, (_, i) => {
    const source = sources[sources.length - 1 - (i % sources.length)];
    if (!source) throw new Error('Wiederholungsquelle fehlt');
    const lesson = resolveLesson(catalogue, source.id);
    const index = i % (lesson?.exercises.length ?? 1);
    const spec = lesson?.exercises[index];
    if (!spec) throw new Error('Wiederholungsaufgabe fehlt');
    const origin = lessonExerciseSources(catalogue, source.id)?.[index];
    if (!origin) throw new Error('Wiederholungsherkunft fehlt');
    return { source, index, spec, origin };
  });
  const exercises: LessonContent['exercises'][number][] = [];
  const repetitionIndices: number[] = [];
  const exerciseSources: typeof origins = [];
  let repeat = 0;
  content.exercises.forEach((spec, index) => {
    exercises.push(spec);
    const origin = origins[index];
    if (!origin) throw new Error('Aufgabenherkunft fehlt');
    exerciseSources.push(origin);
    if (
      repeat < repeats.length &&
      index + 1 >= Math.ceil(((repeat + 1) * content.exercises.length) / (count + 1))
    ) {
      const entry = repeats[repeat++];
      if (entry) {
        repetitionIndices.push(exercises.length);
        exercises.push(entry.spec);
        exerciseSources.push(entry.origin);
      }
    }
  });
  const planKey = JSON.stringify([
    'flow:1',
    content.id,
    content.contentVersion,
    repeats.map((r) => [r.source.id, r.source.contentVersion, r.index]),
  ]);
  return {
    ...content,
    exercises,
    planKey,
    repetitionIndices,
    newCount: content.exercises.length,
    repetitionCount: count,
    exerciseSources,
  };
}

const referenceSchema = z.tuple([
  z.string().min(1).max(128),
  z.number().int().positive(),
  z.number().int().min(0).max(199),
]);
type Reference = z.infer<typeof referenceSchema>;
function candidates(catalogue: ContentCatalogue, ids: readonly string[]) {
  return ids.flatMap((id) => {
    const lesson = catalogue.lessons.find((l) => l.id === id);
    if (!lesson) return [];
    return (lessonExerciseSources(catalogue, id) ?? []).map((origin, index) => ({
      ...origin,
      bucketId: ratingBucket(origin.spec, origin.contentVersion),
      ref: [id, lesson.contentVersion, index] as Reference,
    }));
  });
}
function dereference(catalogue: ContentCatalogue, ref: Reference) {
  const lesson = catalogue.lessons.find((l) => l.id === ref[0]);
  const origin = lessonExerciseSources(catalogue, ref[0])?.[ref[2]];
  return lesson?.contentVersion === ref[1] && origin ? origin : undefined;
}
const adaptiveKeySchema = z.tuple([
  z.literal('flow:2'),
  z.string(),
  z.number().int().positive(),
  z.array(z.number().int().min(0).max(199)).max(200),
  z.array(referenceSchema).max(5),
]);
const weaknessKeySchema = z.tuple([
  z.literal('weak:1'),
  z.number().int().positive(),
  z.array(referenceSchema).length(10),
]);
const reviewKeySchema = z.tuple([
  z.literal('review:1'),
  z.number().int().positive(),
  z.array(referenceSchema).min(1).max(10),
]);
export function practiceSourceLessons(key: string): string[] {
  const parsed = z.union([weaknessKeySchema, reviewKeySchema]).parse(JSON.parse(key) as unknown);
  return [...new Set(parsed[2].map((ref) => ref[0]))];
}
export function weaknessSourceLessons(key: string): string[] {
  return [...new Set(weaknessKeySchema.parse(JSON.parse(key) as unknown)[2].map((ref) => ref[0]))];
}
/** Only source references are persisted. Ratings never become evidence or permissions. */
export function lessonPlan(catalogue: ContentCatalogue, id: string, key?: string) {
  if (key === undefined) return fixedLessonPlan(catalogue, id);
  const fixed = fixedLessonPlan(catalogue, id);
  if (key === fixed?.planKey) return fixed;
  if (key.length > 4096) return undefined;
  try {
    const input: unknown = JSON.parse(key);
    if (isPracticeLesson(id)) {
      const parsed = (id === REVIEW_LESSON_ID ? reviewKeySchema : weaknessKeySchema).parse(input);
      if (parsed[1] !== catalogue.contentVersion || JSON.stringify(parsed) !== key)
        return undefined;
      const origins = parsed[2].map((ref) => dereference(catalogue, ref));
      const first = resolveLesson(catalogue, parsed[2][0]?.[0] ?? '');
      if (!first || origins.some((source) => !source)) return undefined;
      const exerciseSources = origins.filter((source) => source !== undefined);
      return {
        ...first,
        id,
        contentVersion: catalogue.contentVersion,
        introduction: [],
        exercises: exerciseSources.map((source) => source.spec),
        exerciseSources,
        planKey: key,
        newCount: 0,
        repetitionCount: exerciseSources.length,
        repetitionIndices: Array.from({ length: exerciseSources.length }, (_, i) => i),
      };
    }
    const parsed = adaptiveKeySchema.parse(input);
    if (
      !fixed ||
      parsed[1] !== id ||
      parsed[2] !== fixed.contentVersion ||
      JSON.stringify(parsed) !== key ||
      parsed[3].length !== fixed.newCount ||
      new Set(parsed[3]).size !== fixed.newCount ||
      parsed[3].some((index) => index >= fixed.newCount) ||
      parsed[4].length !== fixed.repetitionCount
    )
      return undefined;
    const allowed = new Set(repetitionSources(catalogue, id).map((l) => l.id));
    if (parsed[4].some((ref) => !allowed.has(ref[0]))) return undefined;
    const original = lessonExerciseSources(catalogue, id);
    const repeats = parsed[4].map((ref) => dereference(catalogue, ref));
    if (!original || repeats.some((source) => !source)) return undefined;
    const exerciseSources: typeof original = [];
    const repetitionIndices: number[] = [];
    let repeat = 0;
    parsed[3].forEach((index, position) => {
      const source = original[index];
      if (!source) throw new Error('Missing authored source');
      exerciseSources.push(source);
      if (
        repeat < repeats.length &&
        position + 1 >= Math.ceil(((repeat + 1) * original.length) / (repeats.length + 1))
      ) {
        const next = repeats[repeat++];
        if (next) {
          repetitionIndices.push(exerciseSources.length);
          exerciseSources.push(next);
        }
      }
    });
    return {
      ...fixed,
      planKey: key,
      exerciseSources,
      repetitionIndices,
      exercises: exerciseSources.map((source) => source.spec),
    };
  } catch {
    return undefined;
  }
}

/** Freeze the selection at start: offline replay never depends on later global ratings. */
export function adaptiveLessonPlan(
  catalogue: ContentCatalogue,
  id: string,
  snapshot: RatingSnapshot,
  at: number,
) {
  const fixed = fixedLessonPlan(catalogue, id);
  if (!fixed || !Object.keys(snapshot.skills).length) return fixed;
  const authored = candidates(catalogue, [id]);
  if (!authored.some((source) => candidateProbability(snapshot, source, at) !== null)) return fixed;
  const ordered = adaptiveOrder(authored, snapshot, at);
  const pool = adaptiveOrder(
    candidates(
      catalogue,
      repetitionSources(catalogue, id).map((l) => l.id),
    ),
    snapshot,
    at,
  );
  // Distinct profiles before duplicate source positions; a lesson must not become five copies of one question.
  const profiles = new Set<string>();
  const diverse = pool.filter((candidate) => {
    if (profiles.has(candidate.bucketId)) return false;
    profiles.add(candidate.bucketId);
    return true;
  });
  const repeats = Array.from(
    { length: fixed.repetitionCount },
    (_, i) => (diverse[i % diverse.length] ?? pool[i % pool.length])?.ref,
  );
  if (repeats.some((ref) => !ref)) return fixed;
  return lessonPlan(
    catalogue,
    id,
    JSON.stringify(['flow:2', id, fixed.contentVersion, ordered.map((c) => c.ref[2]), repeats]),
  );
}

export function weakestSkills(snapshot: RatingSnapshot, eligible: ReadonlySet<string>) {
  return Object.entries(snapshot.skills)
    .filter(([id, state]) => eligible.has(id) && state.attempts >= 2)
    .sort((a, b) => a[1].rating - b[1].rating || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([id]) => id);
}
/** Caller limits the pool to reached lessons. This mode grants no course progress or XP. */
export function weaknessPlan(
  catalogue: ContentCatalogue,
  snapshot: RatingSnapshot,
  lessonIds: readonly string[],
  at: number,
) {
  const pool = candidates(catalogue, lessonIds);
  const skills = weakestSkills(snapshot, new Set(pool.flatMap((c) => c.skillIds)));
  if (!skills.length) return undefined;
  const groups = skills.map((id) =>
    adaptiveOrder(
      pool.filter((c) => c.skillIds.includes(id)),
      snapshot,
      at,
    ),
  );
  const used = new Set<string>();
  const refs = Array.from({ length: 10 }, (_, i) => {
    const group = groups[i % groups.length] ?? [];
    const candidate = group.find((c) => !used.has(JSON.stringify(c.ref))) ?? group[0];
    if (!candidate) throw new Error('Missing weakness source');
    used.add(JSON.stringify(candidate.ref));
    return candidate.ref;
  });
  return lessonPlan(
    catalogue,
    WEAKNESS_LESSON_ID,
    JSON.stringify(['weak:1', catalogue.contentVersion, refs]),
  );
}

export function reviewSkillPlan(
  catalogue: ContentCatalogue,
  skillIds: readonly string[],
  lessonIds: readonly string[],
) {
  const pool = candidates(catalogue, lessonIds);
  const refs = [...new Set(skillIds)].slice(0, 10).flatMap((id) => {
    const candidate = pool.find((c) => c.skillIds.includes(id));
    return candidate ? [candidate.ref] : [];
  });
  return refs.length
    ? lessonPlan(
        catalogue,
        REVIEW_LESSON_ID,
        JSON.stringify(['review:1', catalogue.contentVersion, refs]),
      )
    : undefined;
}

export const lessonActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('answer'), answer: z.string().min(1).max(4096) }).strict(),
  ...(['hint', 'next', 'skip', 'skipVoice', 'review'] as const).map((type) =>
    z.object({ type: z.literal(type) }).strict(),
  ),
]);
export type LessonAction = z.infer<typeof lessonActionSchema>;
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const lessonDraftSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    lessonId: z.string().min(1).max(128),
    contentVersion: z.number().int().positive(),
    planKey: z.string().min(1).max(4096),
    selectionGroup: z.enum(['control', 'adaptive']).optional(),
    selectionExperiment: z.literal('p302-beta-v1').optional(),
    seed: z.union([z.string().min(1).max(128), time]),
    startedAt: time,
    finishedAt: time.nullable(),
    timeZone: timeZoneSchema,
    introCard: z.number().int().min(0).max(199),
    started: z.boolean(),
    actions: z.array(lessonActionSchema).max(1600),
    answer: z.string().max(4096).nullable(),
  })
  .strict();
export type LessonDraft = z.infer<typeof lessonDraftSchema>;
export function applyLessonAction(session: LessonSession, action: LessonAction): LessonSession {
  switch (action.type) {
    case 'answer':
      return answerLesson(session, action.answer);
    case 'hint':
      return revealLessonHint(session);
    case 'next':
      return nextLessonExercise(session);
    case 'skip':
      return skipLessonAural(session);
    case 'skipVoice':
      return skipLessonVoice(session);
    case 'review':
      return startLessonReview(session);
  }
}
/** Nur beim Laden nachrechnen; laufende Audio-/Rhythmusobjekte bleiben identisch. */
export function restoreLessonDraft(catalogue: ContentCatalogue, input: unknown) {
  const draft = lessonDraftSchema.parse(input);
  const plan = lessonPlan(catalogue, draft.lessonId, draft.planKey);
  if (plan?.contentVersion !== draft.contentVersion || plan.planKey !== draft.planKey)
    throw new Error('Lektionsinhalt wurde geändert');
  if (
    draft.introCard >= Math.max(1, plan.introduction.length) ||
    (!draft.started && draft.actions.length)
  )
    throw new Error('Ungültige Einführung');
  let session = createLessonSession(plan, draft.seed);
  for (const action of draft.actions) {
    const next = applyLessonAction(session, action);
    if (next === session) throw new Error('Ungültiger Lektionsübergang');
    session = next;
  }
  if (
    (session.phase === 'complete') !== (draft.finishedAt !== null) ||
    (draft.finishedAt !== null && draft.finishedAt < draft.startedAt)
  )
    throw new Error('Ungültiger Abschluss');
  return { draft, session: draft.started ? session : null, plan };
}
