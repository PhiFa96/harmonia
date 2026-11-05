import { asActor } from './database.mjs';
import { SchoolError } from './errors.mjs';
export function createPrivacyService(pool) {
  return {
    async call(actor, action, payload) {
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        Object.keys(payload).length ||
        !['export', 'delete', 'purge'].includes(action)
      )
        throw new SchoolError('invalid');
      try {
        return await asActor(pool, actor, async (db) => {
          if (action === 'export')
            return (await db.query('select school_draft.export_actor() as result')).rows[0].result;
          if (action === 'purge')
            return (await db.query('select school_draft.purge_expired() as result')).rows[0].result;
          await db.query('select school_draft.delete_actor()');
          return { ok: true };
        });
      } catch (error) {
        if (error.code === '42501') throw new SchoolError('forbidden', 403);
        if (error.code === 'P0001' && error.message === 'adminTransferRequired')
          throw new SchoolError('adminTransferRequired', 409);
        throw error;
      }
    },
  };
}
