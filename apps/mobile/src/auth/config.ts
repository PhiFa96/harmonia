export interface AuthConfig {
  readonly url: string;
  readonly key: string;
}
/** Nur öffentliche Projektdaten: insbesondere niemals einen Service-/Secret-Schlüssel in die App bauen. */
export function parseAuthConfig(url: unknown, key: unknown): AuthConfig | null {
  if (!url && !key) return null;
  if (typeof url !== 'string' || typeof key !== 'string' || !url || !key)
    throw new Error('Unvollständige öffentliche Auth-Konfiguration');
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Ungültige öffentliche Auth-URL');
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/' ||
    (parsed.protocol !== 'https:' &&
      !(
        parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]', '10.0.2.2'].includes(parsed.hostname)
      ))
  )
    throw new Error('Ungültige öffentliche Auth-URL');
  if (!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) {
    const payload = key.split('.')[1];
    if (!payload || key.split('.').length !== 3)
      throw new Error('Öffentlicher Auth-Schlüssel erwartet');
    let decoded: unknown;
    try {
      decoded = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/')));
    } catch {
      throw new Error('Öffentlicher Auth-Schlüssel erwartet');
    }
    if (!decoded || typeof decoded !== 'object' || !('role' in decoded) || decoded.role !== 'anon')
      throw new Error('Nur Anon-/Publishable-Schlüssel erlaubt');
  }
  return { url: parsed.origin, key };
}
export function configuredAuth(): AuthConfig | null {
  // Expo ersetzt ausschließlich diese direkten EXPO_PUBLIC-Zugriffe beim Export.
  const url: unknown = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishable: unknown = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key: unknown =
    publishable === ''
      ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : (publishable ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  return parseAuthConfig(url, key);
}
