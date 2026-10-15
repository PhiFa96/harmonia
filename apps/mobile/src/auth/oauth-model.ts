export interface OAuthAttempt {
  readonly id: string;
  readonly expiresAt: number;
  readonly redirect: string;
  readonly provider?: 'apple' | 'google';
}
export function oauthWebOrigin(value: unknown): string | null {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error('OAuth origin');
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
  )
    throw new Error('OAuth origin');
  return url.origin;
}
export function oauthCode(input: string, pending: OAuthAttempt, now: number): string {
  const url = new URL(input),
    expected = new URL(pending.redirect);
  if (
    !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(pending.id) ||
    !Number.isSafeInteger(pending.expiresAt) ||
    now >= pending.expiresAt ||
    pending.expiresAt - now > 10 * 60 * 1000 ||
    url.username ||
    url.password ||
    url.hash ||
    ['protocol', 'hostname', 'port', 'pathname'].some(
      (key) => Reflect.get(url, key) !== Reflect.get(expected, key),
    ) ||
    url.searchParams.getAll('attempt').length !== 1 ||
    url.searchParams.get('attempt') !== pending.id ||
    url.searchParams.getAll('code').length !== 1 ||
    url.searchParams.has('error') ||
    [...url.searchParams.keys()].some((key) => !['attempt', 'code'].includes(key))
  )
    throw new Error('Invalid OAuth callback');
  const code = url.searchParams.get('code');
  if (!code || code.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(code))
    throw new Error('Invalid OAuth code');
  return code;
}
