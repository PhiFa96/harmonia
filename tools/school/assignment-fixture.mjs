// Test-only access to the private fixture material; never used by a server route.
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
export async function fixtureAssignmentAnswers(pool, id) {
  const { items } = (
    await pool.query('select items from school_draft.assignment_material where assignment_id=$1', [
      id,
    ])
  ).rows[0];
  return items.map(({ item }) => ({
    right: item.choices.find((answer) => evaluateExercise(item, answer).correct),
    wrong: item.choices.find((answer) => !evaluateExercise(item, answer).correct),
  }));
}
