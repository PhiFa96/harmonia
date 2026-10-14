import { DEFAULT_CONSENTS, consentEventSchema } from '@harmonia/content';
import { assertPrivacyWrite } from './guard.ts';
import type { ConsentEvent } from '@harmonia/content';
import type { createPrivacyRepository } from './repository.ts';
export function createMemoryPrivacyRepository(): ReturnType<typeof createPrivacyRepository> {
  const records = new Map<string, { event: ConsentEvent; acked: boolean }[]>(),
    meta = new Map<string, string>();
  return {
    pendingDeletions: () =>
      Promise.resolve(
        [...meta]
          .filter(([key]) => key.startsWith('delete:'))
          .map(([key, id]) => ({ scope: key.slice(7), id })),
      ),
    list: (scope) => Promise.resolve(records.get(scope) ?? []),
    choices: (scope) => {
      const choices = { ...DEFAULT_CONSENTS } as {
        push: boolean;
        analytics: boolean;
        marketing: boolean;
      };
      for (const row of records.get(scope) ?? []) choices[row.event.purpose] = row.event.granted;
      return Promise.resolve(choices);
    },
    save(scope, event) {
      assertPrivacyWrite(scope, event.id);
      event = consentEventSchema.parse(event);
      const rows = records.get(scope) ?? [];
      const previous = rows.find((row) => row.event.id === event.id);
      if (previous && JSON.stringify(previous.event) !== JSON.stringify(event))
        return Promise.reject(new Error('Consent conflict'));
      if (!rows.some((row) => row.event.id === event.id)) rows.push({ event, acked: false });
      records.set(scope, rows);
      return Promise.resolve();
    },
    acknowledge(scope, id) {
      for (const row of records.get(scope) ?? []) if (row.event.id === id) row.acked = true;
      return Promise.resolve();
    },
    meta: (id) => Promise.resolve(meta.get(id) ?? null),
    putMeta(id, value) {
      meta.set(id, value);
      return Promise.resolve();
    },
    clearDeleteMeta(scope) {
      meta.delete('delete:' + scope);
      return Promise.resolve();
    },
    erase(scope) {
      records.delete(scope);
      return Promise.resolve();
    },
  };
}
