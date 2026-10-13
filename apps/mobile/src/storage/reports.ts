import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { createReportRepository, initializeReportDatabase } from './report-repository.ts';
let repository: Promise<ReturnType<typeof createReportRepository>> | undefined;
export function getReportRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite benötigt Cross-Origin-Isolation');
    const db = await openDatabaseAsync('harmonia-reports.db');
    try {
      await initializeReportDatabase(db);
      return createReportRepository(db);
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
