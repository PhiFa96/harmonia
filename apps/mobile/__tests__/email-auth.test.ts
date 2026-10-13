import { parseAuthConfig } from '@/auth/config';
import { createSecureAuthStorage } from '@/auth/secure-storage';
const jwt = (role: string) => 'eyJ0eXAiOiJKV1QifQ.' + btoa(JSON.stringify({ role })) + '.signature';
describe('Öffentliche Auth-Konfiguration', () => {
  it('erlaubt Publishable-/Anon-Schlüssel und lokale HTTP-Tests, aber keine Service-Schlüssel', () => {
    expect(parseAuthConfig(undefined, undefined)).toBeNull();
    expect(
      parseAuthConfig('https://project.supabase.co', 'sb_publishable_' + 'a'.repeat(32))?.url,
    ).toBe('https://project.supabase.co');
    expect(parseAuthConfig('http://127.0.0.1:54321', jwt('anon'))?.url).toBe(
      'http://127.0.0.1:54321',
    );
    for (const value of [
      'sb_secret_' + 'a'.repeat(32),
      jwt('service_role'),
      jwt('authenticated'),
      'invalid',
    ])
      expect(() => parseAuthConfig('https://project.supabase.co', value)).toThrow();
  });
  it.each([
    'http://project.supabase.co',
    'https://user:password@project.supabase.co',
    'https://project.supabase.co/?token=x',
    'https://project.supabase.co/#x',
    'https://project.supabase.co/path',
  ])('weist unsichere URL %s zurück', (url) => {
    expect(() => parseAuthConfig(url, jwt('anon'))).toThrow();
  });
});
function secureStore() {
  const values = new Map<string, string>();
  const store = {
    getItemAsync: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      values.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      values.delete(key);
      return Promise.resolve();
    }),
  };
  let id = 0;
  return {
    store,
    values,
    storage: createSecureAuthStorage(store, () => 'version-' + String(id++)),
  };
}
describe('Native Sitzung in SecureStore', () => {
  it('bewahrt große Sitzungen einschließlich Emoji an Teilgrenzen und entfernt alle Teile beim Abmelden', async () => {
    const { storage, values } = secureStore(),
      value = 'a'.repeat(449) + '🎼'.repeat(900) + '\nsecret';
    await storage.setItem('auth', value);
    expect(await storage.getItem('auth')).toBe(value);
    for (const part of values.values())
      expect(new TextEncoder().encode(part).length).toBeLessThan(2048);
    await storage.setItem('auth', 'next');
    expect(await storage.getItem('auth')).toBe('next');
    expect(values.size).toBe(2);
    await storage.removeItem('auth');
    expect(values.size).toBe(0);
    expect(await storage.getItem('auth')).toBeNull();
  });
  it('ein fehlgeschlagener neuer Teil zerstört nicht die bisherige Sitzung', async () => {
    const { storage, store } = secureStore();
    await storage.setItem('auth', 'old');
    store.setItemAsync.mockRejectedValueOnce(new Error('locked'));
    await expect(storage.setItem('auth', 'new')).rejects.toThrow();
    expect(await storage.getItem('auth')).toBe('old');
  });
  it('unvollständige oder fremde Manifeste sind kein stiller Gast-Login', async () => {
    const { storage, values } = secureStore();
    values.set('auth', '{"version":"missing","count":1}');
    await expect(storage.getItem('auth')).rejects.toThrow();
    values.set('auth', '{"version":"../other","count":1}');
    await expect(storage.getItem('auth')).rejects.toThrow();
  });
});
