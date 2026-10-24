// Test-only synthetic accounts. The regular preview retains its eight-account picker.
import { FIXTURE_ACTORS, seedSchoolFixtures } from './database.mjs';
import { createSchoolService } from './service.mjs';
export async function quizFixture(pool, count = 2) {
  await pool.query(
    'truncate school_draft.organizations,school_draft.actors restart identity cascade',
  );
  await seedSchoolFixtures(pool);
  const ids = Object.fromEntries(FIXTURE_ACTORS.map((a) => [a.key, a.id]));
  const school = createSchoolService(pool);
  const act = (who, action, p) => school.act(ids[who], action, p);
  const org = (await act('adminA', 'createOrg', { label: 'Live quiz fixture' })).id;
  const invite = await act('adminA', 'invite', { org, class: null, kind: 'teacher', uses: 2 });
  for (const who of ['teacherA', 'teacherB']) await act(who, 'join', { code: invite.code });
  const classId = (await act('teacherA', 'createClass', { org, label: 'Quiz class' })).id;
  const actors = [...FIXTURE_ACTORS],
    learners = [];
  for (let i = 0; i < count; i++) {
    let actor = FIXTURE_ACTORS[5 + i];
    if (!actor) {
      actor = {
        id: `90000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        key: `load${i}`,
        kind: 'learner',
      };
      actors.push(actor);
      await pool.query('insert into school_draft.actors values($1,$2,$3)', [
        actor.id,
        actor.key,
        actor.kind,
      ]);
    }
    learners.push(actor);
    await pool.query(
      'insert into school_draft.class_members(class_id,actor_id,alias) values($1,$2,$3)',
      [classId, actor.id, `Fixture ${i + 1}`],
    );
  }
  return { ids, actors, learners, school, act, org, classId };
}
