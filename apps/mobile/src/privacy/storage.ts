import { useDeviceState } from '@/state/device';
import { createMemoryPrivacyRepository } from './memory.ts';
import { openDatabaseAsync } from 'expo-sqlite';
import { initializePrivacyDatabase, createPrivacyRepository } from './repository.ts';
const memory = createMemoryPrivacyRepository();
let repository: Promise<ReturnType<typeof createPrivacyRepository>> | undefined;
export function getPrivacyRepository(durable = false) {
  if (!durable && useDeviceState.getState().storage === 'memory') return Promise.resolve(memory);
  repository ??= (async () => {
    const db = await openDatabaseAsync('harmonia-privacy.db');
    try {
      await initializePrivacyDatabase(db);
      return createPrivacyRepository(db);
    } catch (e) {
      await db.closeAsync();
      throw e;
    }
  })().catch((e: unknown) => {
    repository = undefined;
    throw e;
  });
  return repository;
}
export async function erasePrivacyScope(scope: string) {
  await memory.erase(scope);
  await (await getPrivacyRepository(true)).erase(scope);
}
