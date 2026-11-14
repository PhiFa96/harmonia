import { randomUUID } from 'node:crypto';
import { DraftError, exact, identifier } from './errors.mjs';

export const PURCHASE_POLICY = 'certificate-test-purchase-v1';

/** Local payment simulation only. There is no price, provider, webhook or real entitlement. */
export function certificatePurchases(db, { now, profileFor }) {
  db.exec(`create table if not exists certificate_purchases (
    id text primary key, owner text not null, request_id text not null,
    profile text not null, policy text not null,
    status text not null check(status in ('pending','paid','cancelled','refunded')),
    created integer not null, updated integer not null,
    attempt_id text unique, unique(owner,request_id)
  ); create index if not exists purchase_owner on certificate_purchases(owner,created);`);
  const view = (row) => ({
    id: row.id,
    profile: row.profile,
    policy: row.policy,
    status: row.status,
    createdAt: row.created,
    updatedAt: row.updated,
    attemptId: row.attempt_id,
    simulated: true,
  });
  function owned(owner, id) {
    identifier(id);
    const row = db
      .prepare('select * from certificate_purchases where owner=? and id=?')
      .get(owner, id);
    if (!row) throw new DraftError('notFound', 404);
    return row;
  }
  return {
    list: (owner, cutoff) =>
      db
        .prepare(
          'select * from certificate_purchases p where owner=? and (created>=? or exists(select 1 from certificate_drafts d where d.id=p.attempt_id and d.owner=p.owner and d.started>=?)) order by created desc,id desc',
        )
        .all(owner, cutoff, cutoff)
        .map(view),
    order(owner, payload) {
      exact(payload, ['profile', 'requestId']);
      profileFor(payload.profile);
      identifier(payload.requestId);
      const previous = db
        .prepare('select * from certificate_purchases where owner=? and request_id=?')
        .get(owner, payload.requestId);
      if (previous) {
        if (previous.profile !== payload.profile) throw new DraftError('conflict', 409);
        return view(previous);
      }
      if (
        db.prepare('select count(*) as n from certificate_purchases where owner=?').get(owner).n >=
          40 ||
        db.prepare('select count(*) as n from certificate_purchases').get().n >= 10000
      )
        throw new DraftError('limit', 429);
      const id = randomUUID(),
        at = now();
      db.prepare(
        "insert into certificate_purchases(id,owner,request_id,profile,policy,status,created,updated) values(?,?,?,?,?,'pending',?,?)",
      ).run(id, owner, payload.requestId, payload.profile, PURCHASE_POLICY, at, at);
      return view(owned(owner, id));
    },
    settle(owner, payload) {
      exact(payload, ['id', 'outcome']);
      if (!['paid', 'cancelled'].includes(payload.outcome)) throw new DraftError('invalid');
      const row = owned(owner, payload.id);
      if (row.status !== 'pending' && row.status !== payload.outcome)
        throw new DraftError('conflict', 409);
      if (row.status === 'pending')
        db.prepare('update certificate_purchases set status=?,updated=? where id=?').run(
          payload.outcome,
          now(),
          row.id,
        );
      return view(owned(owner, row.id));
    },
    requirePaid(owner, id, profile) {
      const row = owned(owner, id);
      if (row.status !== 'paid' || row.policy !== PURCHASE_POLICY)
        throw new DraftError('purchaseRequired', 403);
      if (row.profile !== profile) throw new DraftError('conflict', 409);
      return row;
    },
    bind(owner, id, attempt) {
      const row = owned(owner, id);
      if (row.attempt_id && row.attempt_id !== attempt)
        throw new DraftError('purchaseConsumed', 409);
      db.prepare('update certificate_purchases set attempt_id=?,updated=? where id=?').run(
        attempt,
        now(),
        id,
      );
    },
    refund(owner, payload) {
      exact(payload, ['id']);
      const row = owned(owner, payload.id);
      if (!['paid', 'refunded'].includes(row.status)) throw new DraftError('conflict', 409);
      if (row.status === 'paid')
        db.prepare("update certificate_purchases set status='refunded',updated=? where id=?").run(
          now(),
          row.id,
        );
      // Withdrawing the simulated entitlement also withdraws the sample code.
      db.prepare(
        'update certificate_drafts set revoked=coalesce(revoked,?),invalidated=case when finished is null then coalesce(invalidated,?) else invalidated end where owner=? and purchase_id=?',
      ).run(now(), now(), owner, row.id);
      return view(owned(owner, row.id));
    },
    refunded: (row) =>
      Boolean(
        row.purchase_id &&
        db
          .prepare(
            "select 1 from certificate_purchases where id=? and owner=? and status='refunded'",
          )
          .get(row.purchase_id, row.owner),
      ),
    authorized: (row) =>
      Boolean(
        row.purchase_id &&
        db
          .prepare(
            "select 1 from certificate_purchases where id=? and owner=? and profile=? and attempt_id=? and policy=? and status='paid'",
          )
          .get(row.purchase_id, row.owner, row.profile, row.id, PURCHASE_POLICY),
      ),
  };
}
