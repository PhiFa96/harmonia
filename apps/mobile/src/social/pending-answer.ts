/** One answer waiting for a server refresh. Further clicks leave the first intact. */
export function pendingAnswer() {
  let waiting: { send: () => Promise<void>; resolve: () => void } | undefined;
  return {
    hold(send: () => Promise<void>) {
      if (waiting) return Promise.resolve();
      return new Promise<void>((resolve) => {
        waiting = { send, resolve };
      });
    },
    clear() {
      waiting?.resolve();
      waiting = undefined;
    },
    async send() {
      const next = waiting;
      waiting = undefined;
      if (!next) return;
      try {
        await next.send();
      } finally {
        next.resolve();
      }
    },
  };
}
