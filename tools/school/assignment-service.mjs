import { randomUUID } from 'node:crypto';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
import { asActor } from './database.mjs';
import { SchoolError } from './service.mjs';
import {
  freezeAssignment,
  materialDigest,
  questionView,
  assignmentBank,
} from './assignment-content.mjs';

const uuid = (value) =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
function exact(value, keys) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== keys.sort().join()
  )
    throw new SchoolError('invalid');
}
function locale(value) {
  if (!['de', 'en-US', 'en-GB'].includes(value)) throw new SchoolError('invalid');
  return value;
}
function id(value) {
  if (!uuid(value)) throw new SchoolError('invalid');
  return value;
}
const metadata = (a) => ({
  id: a.id,
  classId: a.class_id,
  title: a.title,
  dueAt: a.due_at.toISOString(),
  closedAt: a.closed_at?.toISOString() ?? null,
  total: a.task_count,
  contentVersion: a.content_version,
  blocks: a.blocks,
});
export function createAssignmentService(pool) {
  const run = (actor, work) =>
    asActor(pool, actor, async (db) => {
      await db.query('set local role harmonia_school_grader');
      return work(db);
    }).catch((error) => {
      if (error instanceof SchoolError) throw error;
      if (error.code === '42501') throw new SchoolError('forbidden', 403);
      if (
        ['23503', '23514', '22P02', '22007', '22008'].includes(error.code) ||
        error instanceof RangeError
      )
        throw new SchoolError('invalid');
      throw error;
    });
  async function load(db, assignmentId) {
    let a = (await db.query('select * from school_draft.assignments where id=$1', [assignmentId]))
      .rows[0];
    if (!a) throw new SchoolError('forbidden', 403);
    await db.query('select school_draft.assignment_class_lock($1)', [a.class_id]);
    a = (
      await db.query(
        'select *,school_draft.teaches(class_id) as teacher,clock_timestamp() as server_now from school_draft.assignments where id=$1',
        [assignmentId],
      )
    ).rows[0];
    if (!a) throw new SchoolError('forbidden', 403);
    return a;
  }
  const deadline = (a) => Math.min(a.due_at.getTime(), a.closed_at?.getTime() ?? Infinity);
  async function attempt(db, a) {
    let row = (
      await db.query(
        'select * from school_draft.assignment_attempts where assignment_id=$1 and actor_id=school_draft.actor() for update',
        [a.id],
      )
    ).rows[0];
    if (row && !row.finished_at && a.server_now.getTime() >= deadline(a)) {
      row = (
        await db.query(
          'update school_draft.assignment_attempts set finished_at=$2,reason=$3 where assignment_id=$1 and actor_id=school_draft.actor() returning *',
          [
            a.id,
            new Date(deadline(a)),
            a.closed_at && a.closed_at <= a.due_at ? 'closed' : 'deadline',
          ],
        )
      ).rows[0];
    }
    return row;
  }
  async function material(db, a) {
    const m = (
      await db.query('select * from school_draft.assignment_material where assignment_id=$1', [
        a.id,
      ])
    ).rows[0];
    if (!m || m.items.length !== a.task_count || materialDigest(m.items) !== m.digest)
      throw new SchoolError('materialChanged', 409);
    return m.items;
  }
  async function view(db, a) {
    const row = await attempt(db, a),
      base = { ...metadata(a), serverNow: a.server_now.toISOString() };
    if (row?.finished_at) {
      const items = await material(db, a);
      return {
        ...base,
        phase: 'finished',
        result: {
          answered: row.answered,
          correct: row.correct,
          total: a.task_count,
          reason: row.reason,
          finishedAt: row.finished_at.toISOString(),
          areas: ['theory', 'aural'].map((area) => ({
            area,
            total: items.filter((i) => i.area === area).length,
            correct: row.answers.filter((r, index) => r.correct && items[index].area === area)
              .length,
          })),
        },
      };
    }
    if (a.server_now.getTime() >= deadline(a))
      return { ...base, phase: a.closed_at ? 'closed' : 'expired' };
    if (!row) return { ...base, phase: 'ready' };
    const items = await material(db, a);
    return {
      ...base,
      phase: 'active',
      question: questionView(items[row.answered].item, row.answered, a.task_count, a.locale),
    };
  }
  return {
    async call(actor, action, p) {
      if (action === 'catalog') {
        exact(p, ['locale']);
        return { bank: assignmentBank(locale(p.locale)) };
      }
      if (action === 'create') {
        exact(p, ['class', 'title', 'dueAt', 'blocks']);
        id(p.class);
        if (
          typeof p.title !== 'string' ||
          !p.title.trim() ||
          p.title.length > 80 ||
          Array.from(p.title).some((c) => c.charCodeAt(0) < 32) ||
          typeof p.dueAt !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.dueAt) ||
          !Number.isFinite(Date.parse(p.dueAt))
        )
          throw new SchoolError('invalid');
        let frozen;
        try {
          frozen = freezeAssignment(p.blocks);
        } catch {
          throw new SchoolError('invalid');
        }
        return run(actor, async (db) => {
          await db.query('select school_draft.assignment_class_lock($1)', [p.class]);
          const assignmentId = randomUUID();
          await db.query(
            'insert into school_draft.assignments(id,class_id,title,due_at,content_version,task_count,blocks) values($1,$2,$3,$4,$5,$6,$7)',
            [
              assignmentId,
              p.class,
              p.title.trim(),
              p.dueAt,
              frozen.contentVersion,
              frozen.items.length,
              JSON.stringify(p.blocks),
            ],
          );
          await db.query('insert into school_draft.assignment_material values($1,$2,$3)', [
            assignmentId,
            frozen.digest,
            JSON.stringify(frozen.items),
          ]);
          const targets = await db.query(
            'insert into school_draft.assignment_targets select $1,class_id,actor_id from school_draft.class_members where class_id=$2 returning actor_id',
            [assignmentId, p.class],
          );
          if (!targets.rowCount) throw new SchoolError('noRecipients');
          return { id: assignmentId, recipients: targets.rowCount };
        });
      }
      if (action === 'list') {
        exact(p, ['class']);
        id(p.class);
        return run(actor, async (db) => {
          await db.query('select school_draft.assignment_class_lock($1)', [p.class]);
          return {
            assignments: (
              await db.query(
                'select * from school_draft.assignments where class_id=$1 order by created_at desc,id',
                [p.class],
              )
            ).rows.map(metadata),
          };
        });
      }
      if (!['view', 'start', 'answer', 'finish', 'close', 'report'].includes(action))
        throw new SchoolError('invalid');
      exact(
        p,
        action === 'answer'
          ? ['id', 'locale', 'index', 'answer']
          : ['close', 'report'].includes(action)
            ? ['id']
            : ['id', 'locale'],
      );
      id(p.id);
      if (!['close', 'report'].includes(action)) locale(p.locale);
      if (
        action === 'answer' &&
        (!Number.isInteger(p.index) ||
          p.index < 0 ||
          p.index > 39 ||
          typeof p.answer !== 'string' ||
          p.answer.length > 100)
      )
        throw new SchoolError('invalid');
      return run(actor, async (db) => {
        const a = await load(db, p.id);
        a.locale = p.locale;
        if (action === 'close') {
          if (!a.teacher) throw new SchoolError('forbidden', 403);
          await db.query(
            'update school_draft.assignments set closed_at=coalesce(closed_at,clock_timestamp()) where id=$1',
            [a.id],
          );
          return { ok: true };
        }
        if (action === 'report') {
          if (!a.teacher) throw new SchoolError('forbidden', 403);
          const learners = (
            await db.query(
              `select m.alias,m.sharing,t.actor_id as actor,r.answered,r.correct,r.finished_at,r.reason
            from school_draft.assignment_targets t join school_draft.class_members m on m.class_id=t.class_id and m.actor_id=t.actor_id
            left join school_draft.assignment_attempts r on r.assignment_id=t.assignment_id and r.actor_id=t.actor_id
            where t.assignment_id=$1 order by m.alias`,
              [a.id],
            )
          ).rows.map((row) => ({
            actor: row.actor,
            alias: row.alias,
            sharing: row.sharing,
            result:
              row.sharing && row.correct !== null
                ? {
                    correct: row.correct,
                    answered: row.answered,
                    total: a.task_count,
                    reason:
                      row.reason ??
                      (a.closed_at && a.closed_at <= a.due_at ? 'closed' : 'deadline'),
                  }
                : null,
          }));
          const included = learners.filter((l) => l.result);
          return {
            ...metadata(a),
            learners,
            summary: {
              recipients: learners.length,
              shared: learners.filter((l) => l.sharing).length,
              submitted: included.length,
              correct: included.reduce((n, l) => n + l.result.correct, 0),
              total: included.length * a.task_count,
            },
          };
        }
        if (
          a.teacher ||
          !(await db.query('select school_draft.assignment_target($1) as allowed', [a.id])).rows[0]
            .allowed
        )
          throw new SchoolError('forbidden', 403);
        let row = await attempt(db, a);
        if (action === 'start' && !row) {
          if (a.server_now.getTime() >= deadline(a)) return view(db, a);
          await material(db, a);
          await db.query(
            'insert into school_draft.assignment_attempts(assignment_id,class_id,actor_id) select $1,$2,school_draft.actor() where clock_timestamp()<$3',
            [a.id, a.class_id, a.due_at],
          );
          a.server_now = (await db.query('select clock_timestamp() as now')).rows[0].now;
        }
        if (action === 'finish' && row && !row.finished_at) {
          await db.query(
            "update school_draft.assignment_attempts set finished_at=least(clock_timestamp(),$2),reason=case when clock_timestamp()>=$2 then 'deadline' else 'submitted' end where assignment_id=$1 and actor_id=school_draft.actor()",
            [a.id, a.due_at],
          );
        }
        if (action === 'answer' && row) {
          const previous = row.answers[p.index];
          if (previous) {
            if (previous.answer !== p.answer) throw new SchoolError('answerConflict', 409);
            return view(db, a);
          }
          if (row.finished_at) return view(db, a);
          if (row.answered !== p.index) throw new SchoolError('answerConflict', 409);
          const items = await material(db, a),
            item = items[p.index].item;
          if (!item.choices.includes(p.answer)) throw new SchoolError('invalid');
          const evaluated = evaluateExercise(item, p.answer);
          if (!evaluated.validAnswer) throw new SchoolError('invalid');
          const answers = [...row.answers, { answer: p.answer, correct: evaluated.correct }];
          const done = answers.length === a.task_count;
          await db.query(
            `update school_draft.assignment_attempts set answers=$2,correct=correct+$3,
            finished_at=case when $4 then clock_timestamp() else null end,reason=case when $4 then 'completed' else null end
            where assignment_id=$1 and actor_id=school_draft.actor() and clock_timestamp()<$5 and $6::timestamptz is null`,
            [a.id, JSON.stringify(answers), evaluated.correct ? 1 : 0, done, a.due_at, a.closed_at],
          );
          a.server_now = (await db.query('select clock_timestamp() as now')).rows[0].now;
        } else if (action === 'answer' && !row) throw new SchoolError('invalid');
        return view(db, a);
      });
    },
  };
}
