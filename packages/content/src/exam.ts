import {
  answerSession,
  createRng,
  createSession,
  currentItem,
  generateExercise,
  nextExercise,
  skipAuralExercises,
} from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { lessonExerciseSources } from './catalogue.ts';
import type { ContentCatalogue } from './catalogue-schema.ts';

export type ExamArea = 'theory' | 'aural';
export type ExamTemplateId = 'foundation' | 'advanced';
export interface ExamQuestion {
  readonly lessonId: string;
  readonly sourceIndex: number;
  readonly area: ExamArea;
}
export interface ExamTemplate {
  readonly id: ExamTemplateId;
  readonly minutes: number;
  readonly pointsPerQuestion: number;
  readonly questions: readonly ExamQuestion[];
}

export interface ExamRun {
  readonly template: ExamTemplate;
  readonly contentVersion: number;
  readonly seed: string | number;
  readonly startedAt: number;
  readonly deadlineAt: number;
  readonly session: ExerciseSession;
  readonly endedAt?: number;
  readonly endReason?: 'completed' | 'submitted' | 'timeout';
}

/** A template is available only if every source lesson survived publication. */
export function availableExamTemplates(
  catalogue: ContentCatalogue,
  templates: readonly ExamTemplate[],
): readonly ExamTemplate[] {
  return templates.filter((template) =>
    template.questions.every(
      (question) => lessonExerciseSources(catalogue, question.lessonId)?.[question.sourceIndex],
    ),
  );
}

export function createExamRun(
  catalogue: ContentCatalogue,
  templates: readonly ExamTemplate[],
  templateId: ExamTemplateId,
  seed: string | number,
  now: number,
): ExamRun {
  const template = availableExamTemplates(catalogue, templates).find(
    (entry) => entry.id === templateId,
  );
  if (!template || !Number.isFinite(now)) throw new RangeError('Prüfungsvorlage nicht verfügbar');
  const rng = createRng(`${String(seed)}:exam:${template.id}:${String(catalogue.contentVersion)}`);
  const items = template.questions.map(({ lessonId, sourceIndex }) => {
    const source = lessonExerciseSources(catalogue, lessonId)?.[sourceIndex];
    if (!source) throw new RangeError('Prüfungsaufgabe fehlt');
    return generateExercise(source.spec, rng);
  });
  return {
    template,
    contentVersion: catalogue.contentVersion,
    seed,
    startedAt: now,
    deadlineAt: now + template.minutes * 60_000,
    session: createSession(items),
  };
}

export function finishExam(run: ExamRun, now: number): ExamRun {
  if (run.endedAt !== undefined) return run;
  return {
    ...run,
    endedAt: Math.min(Math.max(now, run.startedAt), run.deadlineAt),
    endReason:
      now >= run.deadlineAt ? 'timeout' : currentItem(run.session) ? 'submitted' : 'completed',
  };
}

export function answerExam(run: ExamRun, answer: string, now: number): ExamRun {
  if (run.endedAt !== undefined) return run;
  if (now >= run.deadlineAt) return finishExam(run, now);
  const answered = answerSession(run.session, answer);
  if (answered === run.session) return run;
  const advanced = nextExercise(answered);
  const next = { ...run, session: advanced };
  return currentItem(advanced) ? next : finishExam(next, now);
}

export function skipExamAural(run: ExamRun, now: number): ExamRun {
  if (run.endedAt !== undefined) return run;
  if (now >= run.deadlineAt) return finishExam(run, now);
  const next = { ...run, session: skipAuralExercises(run.session) };
  return currentItem(next.session) ? next : finishExam(next, now);
}

/** Abschlusstext nach tatsächlichem Verlauf: „alle bearbeitet“ nur ohne übersprungene Fragen. */
export function examEndKey(
  run: ExamRun,
  result: Pick<ReturnType<typeof examResult>, 'skipped'>,
): 'completed' | 'skippedAural' | 'submitted' | 'timeout' {
  if (run.endReason === 'timeout') return 'timeout';
  if (run.endReason === 'completed') return result.skipped > 0 ? 'skippedAural' : 'completed';
  return 'submitted';
}

export function examResult(run: ExamRun) {
  const areas = (['theory', 'aural'] as const).map((area) => {
    const indices = run.template.questions.flatMap((question, index) =>
      question.area === area ? [index] : [],
    );
    const correct = run.session.records.filter(
      (record) => indices.includes(record.index) && record.result.correct,
    ).length;
    return {
      area,
      total: indices.length,
      answered: run.session.records.filter((record) => indices.includes(record.index)).length,
      correct,
      points: correct * run.template.pointsPerQuestion,
      maxPoints: indices.length * run.template.pointsPerQuestion,
    };
  });
  const misses = new Map<string, number>();
  for (const [index, question] of run.template.questions.entries())
    if (!run.session.records.some((record) => record.index === index && record.result.correct))
      misses.set(question.lessonId, (misses.get(question.lessonId) ?? 0) + 1);
  return {
    areas,
    /** Wegen Hörproblemen übersprungene Fragen (ohne Antwort, null Punkte). */
    skipped: run.session.skipped.length,
    /** Fragen ohne Antwort: übersprungen, nicht erreicht oder bei Abgabe offen. */
    unanswered: run.template.questions.length - run.session.records.length,
    points: areas.reduce((sum, area) => sum + area.points, 0),
    maxPoints: areas.reduce((sum, area) => sum + area.maxPoints, 0),
    recommendations: [...misses]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id),
  };
}
