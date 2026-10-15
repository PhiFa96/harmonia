import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { initializeProfileDatabase, createProfileRepository } from './profile-repository.ts';
let repository: Promise<ReturnType<typeof createProfileRepository>> | undefined;
export function getProfileRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite isolation required');
    const db = await openDatabaseAsync('harmonia-settings.db');
    try {
      await initializeProfileDatabase(db);
      return createProfileRepository(db);
    } catch (error) {
      await db.closeAsync();
      throw error;
    }
  })().catch((error: unknown) => {
    repository = undefined;
    throw error;
  });
  return repository;
}
