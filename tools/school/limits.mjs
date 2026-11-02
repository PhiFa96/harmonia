import { asActor } from './database.mjs';
import { SchoolError } from './errors.mjs';

/** Separate committed transaction: a failed lookup must not roll back its attempt. */
export async function limitJoin(pool, actor, kind) {
  const allowed = await asActor(
    pool,
    actor,
    async (db) =>
      (await db.query('select school_draft.consume_join($1) as allowed', [kind])).rows[0].allowed,
  ).catch((error) => {
    if (error.code === '42501') throw new SchoolError('forbidden', 403);
    throw error;
  });
  if (!allowed) throw new SchoolError('rateLimited', 429);
}

/** PostgreSQL aborts a transaction after a unique violation; retry only inside a savepoint. */
export async function retryUnique(db, work, constraints) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await db.query('savepoint school_collision');
    try {
      const value = await work();
      await db.query('release savepoint school_collision');
      return value;
    } catch (error) {
      await db.query('rollback to savepoint school_collision');
      await db.query('release savepoint school_collision');
      if (error.code !== '23505' || !constraints.includes(error.constraint)) throw error;
    }
  }
  throw new SchoolError('codeConflict', 409);
}
