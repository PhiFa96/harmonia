import { catalogue } from '../packages/content/src/authoring.ts';
import {
  applyReviewEvent,
  emptyReviewState,
  scheduleReview,
  reviewGrade,
  serializeReviewCard,
  REVIEW_PARAMETERS,
} from '../packages/content/src/review.ts';
import { lessonPlan, reviewSkillPlan } from '../packages/content/src/lesson-flow.ts';
import { lessonEvent } from '../packages/content/src/learning-evidence.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '../packages/exercises/src/index.ts';
import { createEmptyCard, fsrs } from 'ts-fsrs';
function assert(ok: boolean, label: string) {
  if (!ok) throw new Error(label);
}
let tasks = 0;
for (const record of catalogue.lessons) {
  const plan = lessonPlan(catalogue, record.id);
  if (!plan) throw Error('Missing plan');
  let session = createLessonSession(plan, record.id);
  for (const item of session.initial.items)
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  const state = applyReviewEvent(
    catalogue,
    emptyReviewState(),
    lessonEvent(record.id, session, 1000, 2000),
  );
  assert(
    Object.values(state.skills).every((c) => c.reps === 1),
    'Each skill scheduled once per original attempt',
  );
  assert(
    !!reviewSkillPlan(catalogue, Object.keys(state.skills), [record.id]),
    'Due skill source resolves',
  );
  tasks += plan.newCount;
}
assert(tasks === 1866, 'Every authored exercise covered');
const engine = fsrs(REVIEW_PARAMETERS);
for (const grade of [1, 2, 3, 4] as const)
  assert(
    JSON.stringify(scheduleReview(undefined, grade, 2000)) ===
      JSON.stringify(
        serializeReviewCard(
          engine.next(createEmptyCard(new Date(2000)), new Date(2000), reviewGrade(grade)).card,
        ),
      ),
    'Deno matches pinned engine',
  );
console.log(
  `FSRS Deno: ${String(tasks)} authored tasks, all source plans and four initial grades passed.`,
);
