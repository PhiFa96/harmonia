import { DatabaseSync } from 'node:sqlite';
import { CERTIFICATE_PROFILES } from './profiles.ts';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { createExamRun } from '../../packages/content/src/exam.ts';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';

/** Test-only oracle reads the private fixture DB; no answer/seed endpoint exists. */
export function fixtureAnswers(filename, id) {
  const db = new DatabaseSync(filename);
  const row = db.prepare('select * from certificate_drafts where id=?').get(id);
  db.close();
  const profile = CERTIFICATE_PROFILES.find((p) => p.id === row.profile);
  const run = createExamRun(catalogue, [profile.template], profile.id, row.seed, row.started);
  return run.session.items.map((item) => ({
    right: item.choices.find((c) => evaluateExercise(item, c).correct),
    wrong: item.choices.find((c) => !evaluateExercise(item, c).correct),
    aural: item.type === 'INTERVAL_IDENTIFY_AURAL' || item.presentation === 'aural',
  }));
}
