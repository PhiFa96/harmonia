import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { createDeviceRepository, initializeDeviceDatabase } from './device-repository.ts';
let repository: Promise<ReturnType<typeof createDeviceRepository>> | undefined;
export function getDeviceRepository() {
  repository ??= (async () => {
    if (Platform.OS === 'web' && !globalThis.crossOriginIsolated)
      throw new Error('SQLite im Web benötigt Cross-Origin-Isolation');
    const db = await openDatabaseAsync('harmonia-device.db');
    try {
      await initializeDeviceDatabase(db);
      return createDeviceRepository(db);
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
