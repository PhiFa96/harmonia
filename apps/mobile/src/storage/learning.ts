import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { createLearningRepository, initializeLearningDatabase } from './learning-repository.ts';
let repository: Promise<ReturnType<typeof createLearningRepository>> | undefined;
export function getLearningRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite benötigt Cross-Origin-Isolation');
    const db = await openDatabaseAsync('harmonia-learning.db');
    try {
      await initializeLearningDatabase(db);
      return createLearningRepository(db);
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
