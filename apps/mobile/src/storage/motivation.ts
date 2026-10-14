import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  initializeMotivationDatabase,
  createMotivationRepository,
} from './motivation-repository.ts';
let repository: Promise<ReturnType<typeof createMotivationRepository>> | undefined;
export function getMotivationRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite benötigt Cross-Origin-Isolation');
    const db = await openDatabaseAsync('harmonia-motivation.db');
    try {
      await initializeMotivationDatabase(db);
      return createMotivationRepository(db);
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
