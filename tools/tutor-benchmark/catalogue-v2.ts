import { catalogue as course } from '../../packages/content/src/authoring.ts';
import { resolveLesson } from '../../packages/content/src/index.ts';
import {
  createLessonSession,
  expectedAnswer,
  evaluateExercise,
  exercisePrompt,
} from '../../packages/exercises/src/index.ts';
import { buildBenchmarkCatalogue, wrongAnswer } from './catalogue.ts';
import { summarizeLearner } from '../../supabase/functions/_shared/tutor-learner.ts';
import { executeTutorTool } from '../../supabase/functions/_shared/tutor-tools.ts';
import { contentMessages } from '../../packages/i18n/src/authoring-content-messages.ts';
import { tutorRequestSchema } from '../../packages/content/src/index.ts';
import { catalogueSchema, LOCALES } from './schema.ts';
import type { BenchmarkCase, BenchmarkCatalogue } from './schema.ts';

/** P2.18 remains frozen; P3.18 adds level-three/four task probes in a separate catalogue. */
export function buildBenchmarkCatalogueV2(): BenchmarkCatalogue {
  const base = buildBenchmarkCatalogue();
  const first = base.cases[0];
  if (!first) throw Error('Missing base benchmark case');
  const cases: BenchmarkCase[] = [...base.cases];
  const request = tutorRequestSchema.parse({
    id: '00000000-0000-4000-8000-000000000001',
    conversationId: '00000000-0000-4000-8000-000000000002',
    message: 'study plan',
    locale: 'de',
    noteNaming: 'de',
    mode: 'chat',
    hintLevel: null,
    context: null,
  });
  const starter = course.lessons[0];
  if (!starter) throw Error('Missing starter lesson');
  const learner = summarizeLearner(
    course,
    contentMessages,
    request,
    [{ skill_id: starter.skillIds[0] ?? '', rating: 1370, rating_deviation: 90, attempts: 6 }],
    {
      passed: [{ lessonId: starter.id, contentVersion: starter.contentVersion }],
      testedUnitIds: [],
    },
  );
  for (const [name, questions] of [
    [
      'get_learner_summary',
      {
        de: 'Welche belegten Stärken und Übungsfelder habe ich?',
        'en-US': 'What supported strengths and practice needs do I have?',
        'en-GB': 'What supported strengths and practice needs do I have?',
      },
    ],
    [
      'analyze_progression',
      {
        de: 'Schlage mir anhand meines Fortschritts einen kurzen Wochenplan vor.',
        'en-US': 'Suggest a short weekly plan based on my progress.',
        'en-GB': 'Suggest a short weekly plan based on my progress.',
      },
    ],
  ] as const) {
    cases.push({
      id: 'p3_' + name,
      status: 'entwurf',
      category: 'facts',
      questions,
      scope: first.scope,
      exerciseType: null,
      calls: [{ name, input: {} }],
      expectedFacts: executeTutorTool(
        name,
        {},
        request,
        null,
        learner,
      ) as BenchmarkCase['expectedFacts'],
      learnerFixture: learner,
      sourceArticles: [],
      exampleRequired: false,
      reviewNotes:
        'Synthetic, account-free learner fixture. Check that ratings are not overstated, the plan uses open lessons and no personal data is claimed.',
    });
  }
  for (const level of [3, 4]) {
    const unitIds = new Set(
      course.units
        .filter((unit) =>
          course.levels.some((entry) => entry.id === unit.levelId && entry.number === level),
        )
        .map((unit) => unit.id),
    );
    const lessons = course.lessons.filter((lesson) => unitIds.has(lesson.unitId)).slice(0, 3);
    if (lessons.length !== 3) throw Error('Missing upper-level benchmark lessons');
    for (const [number, record] of lessons.entries()) {
      const lesson = resolveLesson(course, record.id);
      if (!lesson) throw Error('Missing benchmark lesson');
      const seed = 'tutor-catalogue-v2';
      const item = createLessonSession(lesson, seed).initial.items[0];
      if (!item) throw Error('Missing benchmark exercise');
      const wrong = wrongAnswer(item);
      for (const mode of ['hint1', 'explain', 'solution'] as const) {
        const action = mode === 'hint1' ? 'hint' : mode;
        cases.push({
          id: `p3_level${String(level)}_${String(number + 1)}_${mode}`,
          status: 'entwurf',
          category: 'task',
          questions: Object.fromEntries(
            LOCALES.map((locale) => [
              locale,
              exercisePrompt(item, locale) +
                (locale === 'de'
                  ? action === 'hint'
                    ? ' Gib einen Hinweis ohne die Antwort zu verraten.'
                    : action === 'explain'
                      ? ` Meine bewertete Antwort war ${wrong}. Erkläre den konkreten Fehler.`
                      : ' Erkläre die geprüfte Lösung.'
                  : action === 'hint'
                    ? ' Give one hint without the answer.'
                    : action === 'explain'
                      ? ` My checked answer was ${wrong}. Explain the specific error.`
                      : ' Explain the verified solution.'),
            ]),
          ) as BenchmarkCase['questions'],
          scope: {
            ...first.scope,
            mode: action,
            hintLevel: action === 'hint' ? 1 : null,
            context: {
              source: {
                kind: 'lesson',
                lessonId: lesson.id,
                contentVersion: lesson.contentVersion,
                seed,
                round: 'initial',
                index: 0,
              },
              answer: wrong,
              checked: action === 'explain',
            },
          },
          exerciseType: item.type,
          calls: [{ name: 'get_exercise_context', input: {} }],
          expectedFacts: JSON.parse(
            JSON.stringify({
              solution: expectedAnswer(item),
              wrongAnswer: wrong,
              evaluation: evaluateExercise(item, wrong),
            }),
          ) as BenchmarkCase['expectedFacts'],
          sourceArticles: [],
          exampleRequired: false,
          reviewNotes:
            'Stage 3/4 draft: separately verify the prompt, valid wrong answer, hint boundary and musical explanation in all three locales.',
        });
      }
    }
  }
  return catalogueSchema.parse({ schemaVersion: 1, version: 2, cases });
}
