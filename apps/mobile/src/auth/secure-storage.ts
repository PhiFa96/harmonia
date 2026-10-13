import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/** Session-JSON kann die SecureStore-Einzelwertgröße überschreiten. Erst die vollständigen neuen Teile, dann den Manifest-Zeiger schreiben. */
export function createSecureAuthStorage(
  store: Pick<
    typeof SecureStore,
    'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'
  > = SecureStore,
  id: () => string = randomUUID,
) {
  async function manifest(key: string): Promise<{ version: string; count: number } | null> {
    const raw = await store.getItemAsync(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      !('count' in value) ||
      typeof value.version !== 'string' ||
      !/^[\w-]+$/.test(value.version) ||
      typeof value.count !== 'number' ||
      !Number.isInteger(value.count) ||
      value.count < 1 ||
      value.count > 1024
    )
      throw new Error('Ungültige sichere Sitzung');
    return { version: value.version, count: value.count };
  }
  const part = (key: string, version: string, index: number) =>
    `${key}-${version}-${String(index)}`;
  return {
    async getItem(key: string): Promise<string | null> {
      const m = await manifest(key);
      if (!m) return null;
      const parts = await Promise.all(
        Array.from({ length: m.count }, (_, index) =>
          store.getItemAsync(part(key, m.version, index)),
        ),
      );
      if (parts.some((p) => p === null)) throw new Error('Unvollständige sichere Sitzung');
      return parts.join('');
    },
    async setItem(key: string, value: string): Promise<void> {
      const old = await manifest(key),
        version = id();
      // Höchstens 450 UTF-16-Einheiten: auch nichtlateinisches JSON passt unter 2 KiB.
      const characters = Array.from(value);
      const parts = Array.from(
        { length: Math.max(1, Math.ceil(characters.length / 450)) },
        (_, index) => characters.slice(index * 450, (index + 1) * 450).join(''),
      );
      if (parts.length > 1024) throw new Error('Sitzung zu groß');
      try {
        await Promise.all(
          parts.map((p, index) => store.setItemAsync(part(key, version, index), p)),
        );
        await store.setItemAsync(key, JSON.stringify({ version, count: parts.length }));
      } catch (error) {
        await Promise.allSettled(
          parts.map((_, index) => store.deleteItemAsync(part(key, version, index))),
        );
        throw error;
      }
      if (old)
        await Promise.allSettled(
          Array.from({ length: old.count }, (_, index) =>
            store.deleteItemAsync(part(key, old.version, index)),
          ),
        );
    },
    async removeItem(key: string): Promise<void> {
      const old = await manifest(key);
      await store.deleteItemAsync(key);
      if (old)
        await Promise.allSettled(
          Array.from({ length: old.count }, (_, index) =>
            store.deleteItemAsync(part(key, old.version, index)),
          ),
        );
    },
  };
}
