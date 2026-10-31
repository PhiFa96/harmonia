import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { evaluateExercise, choiceLabel } from '../../packages/exercises/src/index.ts';
import { asActor } from './database.mjs';
import { SchoolError } from './service.mjs';
import { freezeAssignment, materialDigest, questionView } from './assignment-content.mjs';
const hash = (s) => createHash('sha256').update(s).digest('hex');
const code = () => randomBytes(5).toString('hex').toUpperCase();
function exact(p, keys) {
  if (
    !p ||
    typeof p !== 'object' ||
    Array.isArray(p) ||
    Object.keys(p).sort().join() !== keys.sort().join()
  )
    throw new SchoolError('invalid');
}
function uuid(s) {
  if (
    typeof s !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(s)
  )
    throw new SchoolError('invalid');
}
function language(s) {
  if (!['de', 'en-US', 'en-GB'].includes(s)) throw new SchoolError('invalid');
}
export function createQuizService(pool) {
  const run = (actor, fn) =>
    asActor(pool, actor, async (db) => {
      await db.query('set local role harmonia_school_grader');
      return fn(db);
    }).catch((e) => {
      if (e instanceof SchoolError) throw e;
      if (e.code === '42501') throw new SchoolError('forbidden', 403);
      if (['23503', '23514', '22P02'].includes(e.code)) throw new SchoolError('invalid');
      throw e;
    });
  async function load(db, id, joining = false) {
    let q = (await db.query('select * from school_draft.quizzes where id=$1', [id])).rows[0];
    if (!q) throw new SchoolError('forbidden', 403);
    await db.query('select school_draft.assignment_class_lock($1)', [q.class_id]);
    q = (
      await db.query(
        'select *,school_draft.quiz_allowed(id) as allowed,school_draft.teaches(class_id) as teacher,clock_timestamp() as server_now from school_draft.quizzes where id=$1',
        [id],
      )
    ).rows[0];
    if (!q || (!joining && !q.allowed)) throw new SchoolError('forbidden', 403);
    return q;
  }
  async function expire(db, q) {
    await db.query(
      `update school_draft.quizzes set phase=case when expires_at<=clock_timestamp() then 'cancelled' else 'review' end,revision=revision+1
   where id=$1 and phase not in ('finished','cancelled') and (expires_at<=clock_timestamp() or (phase='question' and due_at<=clock_timestamp()))`,
      [q.id],
    );
    return (
      await db.query(
        'select *,school_draft.teaches(class_id) as teacher,clock_timestamp() as server_now from school_draft.quizzes where id=$1',
        [q.id],
      )
    ).rows[0];
  }
  async function material(db, q) {
    const m = (await db.query('select * from school_draft.quiz_material where quiz_id=$1', [q.id]))
      .rows[0];
    if (!m || m.items.length !== q.task_count || materialDigest(m.items) !== m.digest)
      throw new SchoolError('materialChanged', 409);
    return m.items;
  }
  async function snapshot(db, q, locale, mode) {
    if (mode === 'projector' && !q.teacher) throw new SchoolError('forbidden', 403);
    const counts = (await db.query('select * from school_draft.quiz_counts($1)', [q.id])).rows[0];
    const view = {
      id: q.id,
      classId: q.class_id,
      title: q.title,
      phase: q.phase,
      index: q.round_index,
      total: q.task_count,
      seconds: q.seconds,
      dueAt: q.due_at?.toISOString() ?? null,
      serverNow: q.server_now.toISOString(),
      revision: q.revision,
      teacher: q.teacher,
      mode,
      ...counts,
    };
    const closed = ['review', 'finished'].includes(q.phase);
    if (['question', 'review'].includes(q.phase)) {
      const items = await material(db, q),
        item = items[q.round_index].item;
      view.question = questionView(item, q.round_index, q.task_count, locale);
      if (closed)
        view.solution = choiceLabel(
          item,
          item.choices.find((c) => evaluateExercise(item, c).correct),
          locale,
        );
    }
    view.board = closed
      ? (await db.query('select * from school_draft.quiz_board($1)', [q.id])).rows
      : [];
    let previous = -1,
      rank = 0;
    view.board = view.board.map((entry, index) => {
      if (entry.score !== previous) rank = index + 1;
      previous = entry.score;
      return { ...entry, rank };
    });
    if (!q.teacher) {
      const player = (
        await db.query(
          'select nickname,ranking from school_draft.quiz_players where quiz_id=$1 and actor_id=school_draft.actor()',
          [q.id],
        )
      ).rows[0];
      const answers = (
        await db.query(
          'select round_index,correct from school_draft.quiz_answers where quiz_id=$1 and actor_id=school_draft.actor()',
          [q.id],
        )
      ).rows;
      view.self = { ...player, answered: answers.some((a) => a.round_index === q.round_index) };
      if (closed)
        view.self.result = {
          correct: answers.filter((a) => a.correct).length,
          answered: answers.length,
          total: q.round_index + 1,
        };
    }
    if (q.teacher && mode === 'teacher' && q.phase === 'finished') {
      view.results = (
        await db.query(
          `select m.alias,m.sharing,count(a.quiz_id)::int as answered,count(a.quiz_id) filter(where a.correct)::int as correct
    from school_draft.quiz_players p join school_draft.class_members m on m.class_id=p.class_id and m.actor_id=p.actor_id
    left join school_draft.quiz_answers a on a.quiz_id=p.quiz_id and a.actor_id=p.actor_id
    where p.quiz_id=$1 group by p.actor_id,m.alias,m.sharing order by m.alias`,
          [q.id],
        )
      ).rows.map((r) => ({
        alias: r.alias,
        sharing: r.sharing,
        result: r.sharing
          ? { answered: r.answered, correct: r.correct, total: q.round_index + 1 }
          : null,
      }));
      const included = view.results.filter((r) => r.result);
      view.summary = {
        included: included.length,
        participants: counts.players,
        correct: included.reduce((n, r) => n + r.result.correct, 0),
        total: included.length * (q.round_index + 1),
      };
    }
    return view;
  }
  return {
    async call(actor, action, p) {
      if (action === 'create') {
        exact(p, ['class', 'title', 'seconds', 'blocks']);
        uuid(p.class);
        if (
          typeof p.title !== 'string' ||
          !p.title.trim() ||
          p.title.length > 80 ||
          Array.from(p.title).some((c) => c.charCodeAt(0) < 32) ||
          !Number.isInteger(p.seconds) ||
          p.seconds < 15 ||
          p.seconds > 120
        )
          throw new SchoolError('invalid');
        let frozen;
        try {
          frozen = freezeAssignment(p.blocks);
        } catch {
          throw new SchoolError('invalid');
        }
        if (frozen.items.length > 20) throw new SchoolError('invalid');
        return run(actor, async (db) => {
          await db.query('select school_draft.assignment_class_lock($1)', [p.class]);
          const id = randomUUID(),
            joinCode = code();
          await db.query(
            'insert into school_draft.quizzes(id,class_id,title,task_count,seconds,content_version) values($1,$2,$3,$4,$5,$6)',
            [id, p.class, p.title.trim(), frozen.items.length, p.seconds, frozen.contentVersion],
          );
          await db.query('insert into school_draft.quiz_material values($1,$2,$3,$4)', [
            id,
            hash(joinCode),
            frozen.digest,
            JSON.stringify(frozen.items),
          ]);
          return { id, code: joinCode };
        });
      }
      if (action === 'list') {
        exact(p, ['class']);
        uuid(p.class);
        return run(actor, async (db) => {
          await db.query('select school_draft.assignment_class_lock($1)', [p.class]);
          return {
            quizzes: (
              await db.query(
                'select id,title,phase from school_draft.quizzes where class_id=$1 and school_draft.quiz_allowed(id) order by expires_at desc',
                [p.class],
              )
            ).rows,
          };
        });
      }
      if (action === 'join') {
        exact(p, ['code', 'ranking']);
        if (
          typeof p.code !== 'string' ||
          !/^[A-Fa-f0-9]{10}$/.test(p.code) ||
          typeof p.ranking !== 'boolean'
        )
          throw new SchoolError('invalid');
        return run(actor, async (db) => {
          const id = (
            await db.query('select school_draft.quiz_code($1) as id', [hash(p.code.toUpperCase())])
          ).rows[0].id;
          if (!id) throw new SchoolError('invalidCode');
          const q = await load(db, id, true);
          // Recheck after the class lock; starting and code rotation race with joining.
          if (
            q.phase !== 'lobby' ||
            q.expires_at <= q.server_now ||
            !(
              await db.query('select school_draft.quiz_code($1) as id', [
                hash(p.code.toUpperCase()),
              ])
            ).rows[0].id
          )
            throw new SchoolError('invalidCode');
          const old = (
            await db.query(
              'select 1 from school_draft.quiz_players where quiz_id=$1 and actor_id=school_draft.actor()',
              [id],
            )
          ).rowCount;
          if (!old) {
            // The authorized server aggregate becomes available after membership in this quiz.
            const size = (await db.query('select school_draft.quiz_player_count($1) as n', [id]))
              .rows[0].n;
            if (size >= 30) throw new SchoolError('quizFull', 409);
            await db.query(
              'insert into school_draft.quiz_players values($1,$2,school_draft.actor(),$3,$4)',
              [id, q.class_id, 'Q-' + randomBytes(4).toString('hex').toUpperCase(), p.ranking],
            );
          }
          return { id };
        });
      }
      if (
        ![
          'view',
          'rotate',
          'start',
          'reveal',
          'next',
          'finish',
          'cancel',
          'answer',
          'ranking',
        ].includes(action)
      )
        throw new SchoolError('invalid');
      const keys =
        action === 'view'
          ? ['id', 'locale', 'mode']
          : action === 'answer'
            ? ['id', 'index', 'answer']
            : action === 'ranking'
              ? ['id', 'enabled']
              : action === 'rotate'
                ? ['id']
                : ['id', 'index'];
      exact(p, keys);
      uuid(p.id);
      if (action === 'view') {
        language(p.locale);
        if (!['teacher', 'learner', 'projector'].includes(p.mode)) throw new SchoolError('invalid');
      }
      if (
        ['start', 'reveal', 'next', 'finish', 'cancel', 'answer'].includes(action) &&
        (!Number.isInteger(p.index) || p.index < -1 || p.index > 19)
      )
        throw new SchoolError('invalid');
      if (action === 'answer' && (typeof p.answer !== 'string' || p.answer.length > 100))
        throw new SchoolError('invalid');
      if (action === 'ranking' && typeof p.enabled !== 'boolean') throw new SchoolError('invalid');
      return run(actor, async (db) => {
        let q = await load(db, p.id);
        q = await expire(db, q);
        if (action === 'view') return snapshot(db, q, p.locale, p.mode);
        if (action === 'ranking') {
          if (q.teacher) throw new SchoolError('forbidden', 403);
          await db.query(
            'update school_draft.quiz_players set ranking=$2 where quiz_id=$1 and actor_id=school_draft.actor()',
            [q.id, p.enabled],
          );
          return { ok: true };
        }
        if (action === 'answer') {
          if (q.teacher) throw new SchoolError('forbidden', 403);
          const prior = (
            await db.query(
              'select answer from school_draft.quiz_answers where quiz_id=$1 and actor_id=school_draft.actor() and round_index=$2',
              [q.id, p.index],
            )
          ).rows[0];
          if (prior) {
            if (prior.answer !== p.answer) throw new SchoolError('answerConflict', 409);
            return { ok: true };
          }
          if (q.phase !== 'question' || q.round_index !== p.index)
            throw new SchoolError('quizRoundClosed', 409);
          const item = (await material(db, q))[p.index].item;
          if (!item.choices.includes(p.answer)) throw new SchoolError('invalid');
          const evaluation = evaluateExercise(item, p.answer);
          if (!evaluation.validAnswer) throw new SchoolError('invalid');
          const saved = await db.query(
            'insert into school_draft.quiz_answers(quiz_id,actor_id,round_index,answer,correct) select $1,school_draft.actor(),$2,$3,$4 where clock_timestamp()<$5',
            [q.id, p.index, p.answer, evaluation.correct, q.due_at],
          );
          if (!saved.rowCount) throw new SchoolError('quizRoundClosed', 409);
          return { ok: true };
        }
        if (!q.teacher) throw new SchoolError('forbidden', 403);
        if (action === 'rotate') {
          if (q.phase !== 'lobby') throw new SchoolError('quizRoundClosed', 409);
          const joinCode = code();
          await db.query('update school_draft.quiz_material set code_hash=$2 where quiz_id=$1', [
            q.id,
            hash(joinCode),
          ]);
          return { code: joinCode };
        }
        if (['finished', 'cancelled'].includes(q.phase) || p.index !== q.round_index)
          return { ok: true };
        if (action === 'cancel')
          await db.query(
            "update school_draft.quizzes set phase='cancelled',revision=revision+1 where id=$1",
            [q.id],
          );
        else if (action === 'finish') {
          if (q.round_index < 0) throw new SchoolError('invalid');
          await db.query(
            "update school_draft.quizzes set phase='finished',revision=revision+1 where id=$1",
            [q.id],
          );
        } else if (action === 'reveal' && q.phase === 'question')
          await db.query(
            "update school_draft.quizzes set phase='review',revision=revision+1 where id=$1",
            [q.id],
          );
        else if (
          (action === 'start' && q.phase === 'lobby') ||
          (action === 'next' && q.phase === 'review')
        ) {
          if (
            !(await db.query('select * from school_draft.quiz_counts($1)', [q.id])).rows[0].players
          )
            throw new SchoolError('quizEmpty');
          await material(db, q);
          const final = q.round_index + 1 >= q.task_count;
          await db.query(
            `update school_draft.quizzes set phase=$2,round_index=round_index+$3,due_at=clock_timestamp()+seconds*interval '1 second',revision=revision+1 where id=$1`,
            [q.id, final ? 'finished' : 'question', final ? 0 : 1],
          );
        }
        return { ok: true };
      });
    },
  };
}
