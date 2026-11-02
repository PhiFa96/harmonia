import { createHash, randomBytes } from 'node:crypto';

export const SESSION_IDLE_MS = 30 * 60_000;
export const SESSION_MAX_MS = 7 * 86400000;
const digest = (value) => createHash('sha256').update(value).digest('hex');

/** Restart-safe, revocable local test sessions. These are never verified person identities. */
export function certificateSessions(db, now) {
  db.exec(
    'create table if not exists certificate_sessions(owner text primary key,created integer not null,seen integer not null)',
  );
  function purge() {
    db.prepare('delete from certificate_sessions where created<=? or seen<=?').run(
      now() - SESSION_MAX_MS,
      now() - SESSION_IDLE_MS,
    );
  }
  return {
    issue() {
      purge();
      if (db.prepare('select count(*) as n from certificate_sessions').get().n >= 5000) return null;
      const token = randomBytes(32).toString('hex'),
        at = now();
      db.prepare('insert into certificate_sessions(owner,created,seen) values(?,?,?)').run(
        digest(token),
        at,
        at,
      );
      return token;
    },
    resolve(token) {
      purge();
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
      const owner = digest(token);
      if (!db.prepare('select 1 from certificate_sessions where owner=?').get(owner)) return null;
      db.prepare('update certificate_sessions set seen=? where owner=?').run(now(), owner);
      return owner;
    },
    revoke: (owner) => db.prepare('delete from certificate_sessions where owner=?').run(owner),
  };
}
