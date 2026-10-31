import { asActor } from './database.mjs';
import { SchoolError } from './service.mjs';
import { freezeAssignment, materialDigest, questionView } from './assignment-content.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
import {
  accessStatusSchema,
  DEFAULT_ACCESS_POLICY,
  guestAccessStatus,
} from '../../packages/content/src/access.ts';
function exact(p, keys) {
  if (
    !p ||
    typeof p !== 'object' ||
    Array.isArray(p) ||
    Object.keys(p).sort().join() !== keys.sort().join()
  )
    throw new SchoolError('invalid');
}
function uuid(v) {
  if (
    typeof v !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v)
  )
    throw new SchoolError('invalid');
}
function locale(v) {
  if (!['de', 'en-US', 'en-GB'].includes(v)) throw new SchoolError('invalid');
}
export function createLicenseService(pool) {
  const run = (actor, fn) =>
    asActor(pool, actor, fn).catch((e) => {
      if (e instanceof SchoolError) throw e;
      if (e.code === '42501') throw new SchoolError('forbidden', 403);
      if (e.code === '23505') throw new SchoolError('licenseConflict', 409);
      if (
        e.code === 'P0001' &&
        ['licenseConflict', 'licenseState', 'licenseFull'].includes(e.message)
      )
        throw new SchoolError(e.message, 409);
      if (['23503', '23514', '22023', '22P02', '22007', '22008'].includes(e.code))
        throw new SchoolError('invalid');
      throw e;
    });
  async function access(db) {
    const r = (
      await db.query('select school_draft.license_access() as grants,clock_timestamp() as now')
    ).rows[0];
    const status = guestAccessStatus(DEFAULT_ACCESS_POLICY, null, r.now.getTime());
    return {
      grants: r.grants,
      status: accessStatusSchema.parse(
        r.grants.length ? { ...status, tier: 'premium', remaining: null } : status,
      ),
    };
  }
  async function premium(db) {
    if (!(await access(db)).grants.length) throw new SchoolError('licenseRequired', 403);
    await db.query('set local role harmonia_school_grader');
  }
  const invoice = (r) => ({
    id: r.id,
    org: r.org_id,
    organization: r.organization,
    reference: r.reference,
    seats: r.seats,
    unitCents: r.unit_cents,
    totalCents: r.total_cents,
    currency: r.currency,
    startsAt: r.starts_at.toISOString(),
    endsAt: r.ends_at.toISOString(),
    state: r.state,
    createdAt: r.created_at.toISOString(),
    used: r.used,
  });
  async function practiceView(db, id, lang) {
    const row = (
      await db.query(
        'select *,clock_timestamp() as now from school_draft.license_practice where id=$1 and actor_id=school_draft.actor() for update',
        [id],
      )
    ).rows[0];
    if (!row) throw new SchoolError('forbidden', 403);
    if (row.now - row.created_at >= 3600000) throw new SchoolError('practiceExpired', 409);
    if (materialDigest(row.item) !== row.digest) throw new SchoolError('materialChanged', 409);
    return {
      id: row.id,
      source: row.source,
      question: questionView(row.item, 0, 1, lang),
      result: row.answer === null ? null : { correct: row.correct, total: 1 },
    };
  }
  return {
    async call(actor, action, p) {
      if (action === 'status') {
        exact(p, []);
        return run(actor, access);
      }
      if (action === 'overview') {
        exact(p, []);
        return run(actor, async (db) => {
          const operator = (await db.query('select school_draft.license_operator() as allowed'))
            .rows[0].allowed;
          const invoices = (
            await db.query(
              'select *,school_draft.license_usage(id) as used from school_draft.license_invoices order by created_at desc,id',
            )
          ).rows.map(invoice);
          const organizations = operator
            ? (await db.query('select * from school_draft.license_orgs()')).rows
            : (
                await db.query(
                  'select o.id,o.label from school_draft.organizations o where school_draft.is_admin(o.id) order by o.label',
                )
              ).rows;
          const candidates = [];
          if (!operator)
            for (const org of organizations)
              for (const a of (
                await db.query('select * from school_draft.license_candidates($1)', [org.id])
              ).rows)
                candidates.push({ ...a, org: org.id });
          const seats = operator
            ? []
            : (
                await db.query(
                  'select invoice_id as invoice,actor_id as actor from school_draft.license_seats',
                )
              ).rows;
          const events = (
            await db.query(
              'select invoice_id as invoice,kind,at from school_draft.license_events order by id',
            )
          ).rows;
          return {
            operator,
            organizations,
            invoices,
            candidates,
            seats,
            events,
            ...(await access(db)),
          };
        });
      }
      if (action === 'invoice') {
        exact(p, ['id']);
        uuid(p.id);
        return run(actor, async (db) => {
          const r = (
            await db.query(
              'select *,school_draft.license_usage(id) as used from school_draft.license_invoices where id=$1',
              [p.id],
            )
          ).rows[0];
          if (!r) throw new SchoolError('forbidden', 403);
          return invoice(r);
        });
      }
      if (action === 'create') {
        exact(p, ['id', 'org', 'seats', 'unitCents', 'days', 'startsAt']);
        uuid(p.id);
        uuid(p.org);
        if (
          !Number.isInteger(p.seats) ||
          p.seats < 1 ||
          p.seats > 1000 ||
          !Number.isInteger(p.unitCents) ||
          p.unitCents < 1 ||
          p.unitCents > 100000 ||
          ![30, 90, 365].includes(p.days) ||
          !(
            p.startsAt === null ||
            (typeof p.startsAt === 'string' &&
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.startsAt) &&
              Number.isFinite(Date.parse(p.startsAt)) &&
              new Date(p.startsAt).toISOString() === p.startsAt)
          )
        )
          throw new SchoolError('invalid');
        return run(actor, async (db) => ({
          id: (
            await db.query('select school_draft.license_create($1,$2,$3,$4,$5,$6) as id', [
              p.id,
              p.org,
              p.seats,
              p.unitCents,
              p.days,
              p.startsAt,
            ])
          ).rows[0].id,
        }));
      }
      if (['pay', 'void'].includes(action)) {
        exact(p, ['id']);
        uuid(p.id);
        return run(actor, async (db) => {
          await db.query('select school_draft.license_transition($1,$2)', [
            p.id,
            action === 'pay' ? 'paid' : 'void',
          ]);
          return { ok: true };
        });
      }
      if (action === 'assign') {
        exact(p, ['id', 'actor', 'enabled']);
        uuid(p.id);
        uuid(p.actor);
        if (typeof p.enabled !== 'boolean') throw new SchoolError('invalid');
        return run(actor, async (db) => {
          await db.query('select school_draft.license_assign($1,$2,$3)', [
            p.id,
            p.actor,
            p.enabled,
          ]);
          return { ok: true };
        });
      }
      if (!['practice', 'practice-view', 'practice-answer'].includes(action))
        throw new SchoolError('invalid');
      exact(
        p,
        action === 'practice'
          ? ['id', 'source', 'locale']
          : action === 'practice-view'
            ? ['id', 'locale']
            : ['id', 'answer', 'locale'],
      );
      uuid(p.id);
      locale(p.locale);
      if (action === 'practice' && !['notes', 'intervals', 'hearing'].includes(p.source))
        throw new SchoolError('invalid');
      if (action === 'practice-answer' && (typeof p.answer !== 'string' || p.answer.length > 100))
        throw new SchoolError('invalid');
      return run(actor, async (db) => {
        await premium(db);
        if (action === 'practice') {
          // Request ID is stable across network retries. An existing question never changes.
          const frozen = freezeAssignment([{ key: p.source, count: 1 }]),
            item = frozen.items[0].item;
          await db.query(
            'insert into school_draft.license_practice(id,actor_id,source,item,digest) values($1,school_draft.actor(),$2,$3,$4) on conflict(id) do nothing',
            [p.id, p.source, JSON.stringify(item), materialDigest(item)],
          );
          const old = (
            await db.query('select source from school_draft.license_practice where id=$1', [p.id])
          ).rows[0];
          if (!old) throw new SchoolError('forbidden', 403);
          if (old.source !== p.source) throw new SchoolError('licenseConflict', 409);
        }
        const view = await practiceView(db, p.id, p.locale);
        if (action === 'practice-answer') {
          const row = (
            await db.query('select * from school_draft.license_practice where id=$1', [p.id])
          ).rows[0];
          if (row.answer !== null) {
            if (row.answer !== p.answer) throw new SchoolError('answerConflict', 409);
            return view;
          }
          if (!row.item.choices.includes(p.answer)) throw new SchoolError('invalid');
          const evaluation = evaluateExercise(row.item, p.answer);
          if (!evaluation.validAnswer) throw new SchoolError('invalid');
          const changed = await db.query(
            "update school_draft.license_practice set answer=$2,correct=$3 where id=$1 and clock_timestamp()<created_at+interval '1 hour' and jsonb_array_length(school_draft.license_access())>0",
            [p.id, p.answer, evaluation.correct],
          );
          if (!changed.rowCount) throw new SchoolError('licenseRequired', 403);
        }
        return practiceView(db, p.id, p.locale);
      });
    },
  };
}
