import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { createLessonRepository, initializeLessonDatabase } from './lesson-repository';
let repository: Promise<ReturnType<typeof createLessonRepository>> | undefined;
export function getLessonRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite im Web benötigt Cross-Origin-Isolation');
    const db = await openDatabaseAsync('harmonia-lessons.db');
    try {
      await initializeLessonDatabase(db);
      return createLessonRepository(db);
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
