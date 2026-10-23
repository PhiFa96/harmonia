import { createHash, randomBytes } from 'node:crypto';
import { asActor } from './database.mjs';

export class SchoolError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
export const hashCode = (code) => createHash('sha256').update(code).digest('hex');
const uuid = (value) =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const name = (value) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= 80 &&
  Array.from(value).every((character) => character.charCodeAt(0) >= 32);
const fields = {
  createOrg: { label: name },
  createClass: { org: uuid, label: name },
  invite: {
    org: uuid,
    class: (value) => value === null || uuid(value),
    kind: (value) => ['teacher', 'learner'].includes(value),
    uses: (value) => Number.isInteger(value) && value >= 1 && value <= 30,
  },
  revokeInvites: { org: uuid, class: (value) => value === null || uuid(value) },
  join: { code: (value) => typeof value === 'string' && value.length <= 64 },
  setTeacher: { class: uuid, actor: uuid, enabled: (value) => typeof value === 'boolean' },
  removeTeacher: { org: uuid, actor: uuid },
  sharing: { class: uuid, enabled: (value) => typeof value === 'boolean' },
  leave: { class: uuid },
  removeLearner: { class: uuid, actor: uuid },
  archive: { class: uuid },
  deleteClass: { class: uuid },
};
function validate(action, payload) {
  const shape = Object.hasOwn(fields, action) ? fields[action] : undefined;
  if (
    !shape ||
    !payload ||
    Array.isArray(payload) ||
    typeof payload !== 'object' ||
    Object.keys(payload).sort().join() !== Object.keys(shape).sort().join() ||
    Object.entries(shape).some(([key, check]) => !check(payload[key]))
  )
    throw new SchoolError('invalid');
}
export function createSchoolService(pool) {
  async function run(actor, work) {
    try {
      return await asActor(pool, actor, work);
    } catch (error) {
      if (error instanceof SchoolError) throw error;
      if (error.code === '42501') throw new SchoolError('forbidden', 403);
      if (['22023', '23503', '23514', '22P02', '23505'].includes(error.code))
        throw new SchoolError(error.message === 'invalidCode' ? 'invalidCode' : 'invalid');
      throw error;
    }
  }
  return {
    async state(actor) {
      return run(actor, async (db) => ({
        organizations: (
          await db.query(
            'select o.*,m.role from school_draft.organizations o join school_draft.org_members m on m.org_id=o.id where m.actor_id=school_draft.actor() order by o.label,o.id',
          )
        ).rows,
        colleagues: (
          await db.query('select * from school_draft.org_members order by org_id,actor_id')
        ).rows,
        classes: (
          await db.query(
            'select c.*,school_draft.teaches(c.id) as teaches from school_draft.classes c order by c.label,c.id',
          )
        ).rows,
        teachers: (
          await db.query('select * from school_draft.class_teachers order by class_id,actor_id')
        ).rows,
        memberships: (
          await db.query(
            'select * from school_draft.class_members where actor_id=school_draft.actor() order by class_id',
          )
        ).rows,
      }));
    },
    async report(actor, classId) {
      if (!uuid(classId)) throw new SchoolError('invalid');
      return run(actor, async (db) => {
        // A single statement sees membership, sharing and evidence in the same DB snapshot.
        const result = await db.query(
          `select c.id,c.label,
          coalesce((select jsonb_agg(jsonb_build_object('actor',m.actor_id,'alias',m.alias,'sharing',m.sharing,
            'areas',case when m.sharing then (select coalesce(jsonb_agg(x),'[]'::jsonb) from (
              select e.area,sum(e.correct)::int as correct,sum(e.total)::int as total,sum(e.completed)::int as completed,max(e.at) as at
              from school_draft.sample_evidence e where e.actor_id=m.actor_id group by e.area order by e.area
            ) x) else '[]'::jsonb end) order by m.alias)
            from school_draft.class_members m where m.class_id=c.id),'[]'::jsonb) as learners
          from school_draft.classes c where c.id=$1 and school_draft.teaches(c.id)`,
          [classId],
        );
        if (!result.rowCount) throw new SchoolError('forbidden', 403);
        return result.rows[0];
      });
    },
    async act(actor, action, payload) {
      validate(action, payload);
      return run(actor, async (db) => {
        const p = payload;
        const call = async (sql, values) => {
          const r = await db.query(sql, values);
          return r.rows[0]?.result ?? null;
        };
        switch (action) {
          case 'createOrg':
            return { id: await call('select school_draft.create_org($1) as result', [p.label]) };
          case 'createClass':
            return {
              id: await call('select school_draft.create_class($1,$2) as result', [p.org, p.label]),
            };
          case 'invite': {
            const code = 'SCHOOL-' + randomBytes(12).toString('hex').toUpperCase();
            await call('select school_draft.issue_invite($1,$2,$3,$4,$5)', [
              p.org,
              p.class,
              p.kind,
              hashCode(code),
              p.uses,
            ]);
            return { code, expiresInHours: 24, uses: p.uses };
          }
          case 'join': {
            const code = p.code.trim().toUpperCase();
            if (!/^SCHOOL-[A-F0-9]{24}$/.test(code)) throw new SchoolError('invalidCode');
            return {
              id: await call('select school_draft.join_code($1) as result', [hashCode(code)]),
            };
          }
          case 'revokeInvites':
            await call('select school_draft.revoke_invites($1,$2)', [p.org, p.class]);
            break;
          case 'setTeacher':
            await call('select school_draft.set_teacher($1,$2,$3)', [p.class, p.actor, p.enabled]);
            break;
          case 'removeTeacher':
            await call('select school_draft.remove_teacher($1,$2)', [p.org, p.actor]);
            break;
          case 'sharing':
            await call('select school_draft.set_sharing($1,$2)', [p.class, p.enabled]);
            break;
          case 'leave':
            await call('select school_draft.leave_class($1)', [p.class]);
            break;
          case 'removeLearner':
            await call('select school_draft.remove_learner($1,$2)', [p.class, p.actor]);
            break;
          case 'archive':
            await call('select school_draft.archive_class($1)', [p.class]);
            break;
          case 'deleteClass':
            await call('select school_draft.delete_class($1)', [p.class]);
            break;
        }
        return { ok: true };
      });
    },
  };
}
