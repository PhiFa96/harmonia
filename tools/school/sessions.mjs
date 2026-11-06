import { randomBytes } from 'node:crypto';
/** Private fixture sessions with idle expiry, an absolute lifetime and bounded capacity. */
export function createSessions({
  now = Date.now,
  idleMs = 15 * 60 * 1000,
  maxMs = 8 * 60 * 60 * 1000,
  capacity = 128,
} = {}) {
  if (
    !Number.isSafeInteger(idleMs) ||
    idleMs <= 0 ||
    !Number.isSafeInteger(maxMs) ||
    maxMs < idleMs ||
    !Number.isSafeInteger(capacity) ||
    capacity < 1
  )
    throw new Error('Invalid school session limits');
  const sessions = new Map();
  const active = (session) =>
    Boolean(
      session &&
      !session.closed &&
      now() < session.expiresAt &&
      now() - session.lastSeenAt < idleMs,
    );
  const remove = (token) => {
    const session = sessions.get(token);
    if (session) {
      session.closed = true;
      sessions.delete(token);
    }
  };
  const sweep = () => {
    for (const [token, session] of sessions) if (!active(session)) remove(token);
  };
  return {
    active,
    get(token) {
      const session = sessions.get(token);
      if (!active(session)) {
        remove(token);
        return undefined;
      }
      session.lastSeenAt = now();
      return session;
    },
    create(actor, expiresAt = Infinity, identity) {
      sweep();
      if (sessions.size >= capacity || expiresAt <= now()) return null;
      const token = randomBytes(32).toString('hex');
      const session = {
        actor,
        identity: identity ? Object.freeze({ ...identity }) : undefined,
        expiresAt: Math.min(now() + maxMs, expiresAt),
        lastSeenAt: now(),
        closed: false,
      };
      sessions.set(token, session);
      return { token, session };
    },
    remove,
    removeActor(actor) {
      for (const [token, session] of sessions) if (session.actor.id === actor) remove(token);
    },
    close() {
      for (const token of sessions.keys()) remove(token);
    },
  };
}
