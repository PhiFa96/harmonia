import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { initializeAccessDatabase, createAccessRepository } from './repository.ts';
import { useDeviceState } from '@/state/device';
import { createMemoryAccessRepository } from './memory.ts';
const temporaryRepository = createMemoryAccessRepository();
let repository: Promise<ReturnType<typeof createAccessRepository>> | undefined;
export function getAccessRepository(durable = false) {
  if (!durable && useDeviceState.getState().storage === 'memory')
    return Promise.resolve(temporaryRepository);
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('Access SQLite isolation');
    const db = await openDatabaseAsync('harmonia-access.db');
    try {
      await initializeAccessDatabase(db);
      return createAccessRepository(db);
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
export async function eraseAccessScope(scope: string) {
  await temporaryRepository.eraseScope(scope);
  await (await getAccessRepository(true)).eraseScope(scope);
}
