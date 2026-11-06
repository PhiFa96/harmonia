import { SchoolError } from './errors.mjs';

/** A fresh authoritative lookup for every request and before each SSE emission. */
export function createIdentitySource(pool) {
  return async ({ subject, sessionId }) => {
    let client;
    try {
      client = await pool.connect();
      await client.query('begin');
      await client.query('set local role harmonia_school_backend');
      const result = await client.query('select * from school_draft.resolve_identity($1,$2)', [
        subject,
        sessionId,
      ]);
      await client.query('commit');
      return result.rows[0];
    } catch {
      await client?.query('rollback').catch(() => {});
      // Availability failures never fall back to a cached identity or fixture account.
      throw new SchoolError('error', 503);
    } finally {
      client?.release();
    }
  };
}
