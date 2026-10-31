/** SSE snapshots are authorized anew on every refresh, including quiet rooms. */
export function createQuizStreams(service) {
  const clients = new Set();
  async function pump(c) {
    if (c.closed) return;
    if (c.busy) {
      c.again = true;
      return;
    }
    c.busy = true;
    try {
      if (c.session.actor.id !== c.actor) throw new Error('forbidden');
      const value = await service.call(c.actor, 'view', c.payload);
      if (c.closed) return;
      if (c.session.actor.id !== c.actor) throw new Error('forbidden');
      const signature = JSON.stringify({ ...value, serverNow: undefined });
      if (signature !== c.signature || Date.now() - c.sentAt >= 15000) {
        c.signature = signature;
        c.sentAt = Date.now();
        if (!c.res.write(`event: snapshot\ndata: ${JSON.stringify(value)}\n\n`)) c.close();
      }
    } catch {
      if (!c.closed) {
        c.res.write('event: unavailable\ndata: {}\n\n');
        c.close();
      }
    } finally {
      c.busy = false;
      if (c.again && !c.closed) {
        c.again = false;
        queueMicrotask(() => void pump(c));
      }
    }
  }
  const timer = setInterval(() => {
    for (const c of clients) void pump(c);
  }, 1000);
  timer.unref();
  return {
    async open(req, res, session, payload) {
      if (clients.size >= 128 || [...clients].filter((c) => c.session === session).length >= 4)
        return false;
      const actor = session.actor.id;
      // Fail before starting an SSE response when the current account lacks access.
      await service.call(actor, 'view', payload);
      if (res.destroyed) return true;
      if (
        session.actor.id !== actor ||
        clients.size >= 128 ||
        [...clients].filter((c) => c.session === session).length >= 4
      )
        return false;
      const c = {
        res,
        session,
        actor,
        payload,
        closed: false,
        busy: false,
        again: false,
        signature: '',
        sentAt: 0,
      };
      c.close = () => {
        if (c.closed) return;
        c.closed = true;
        clients.delete(c);
        res.end();
      };
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write('retry: 1000\n\n');
      res.on('close', c.close);
      clients.add(c);
      void pump(c);
      return true;
    },
    wake() {
      for (const c of clients) void pump(c);
    },
    close() {
      clearInterval(timer);
      for (const c of clients) c.close();
    },
  };
}
