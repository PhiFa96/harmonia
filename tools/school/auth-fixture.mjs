// Test-only signing keys. No server or browser imports this module.
import { generateKeyPairSync, sign } from 'node:crypto';
export const epoch = Date.UTC(2026, 10, 2, 12);
export const subject = '00000000-0000-4000-8000-000000000006';
export const issuer = 'https://school-fixture.invalid/auth/v1';
export function keys(type = 'ES256') {
  const pair =
    type === 'ES256'
      ? generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
      : generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = {
    ...pair.publicKey.export({ format: 'jwk' }),
    kid: 'fixture',
    alg: type,
    use: 'sig',
  };
  const token = (claims = {}, header = {}) => {
    const parts = [
      { typ: 'JWT', kid: 'fixture', alg: type, ...header },
      {
        sub: subject,
        iss: issuer,
        aud: 'authenticated',
        iat: epoch / 1000 - 1,
        exp: epoch / 1000 + 60,
        ...claims,
      },
    ].map((value) => Buffer.from(JSON.stringify(value)).toString('base64url'));
    const signature = sign(
      'sha256',
      Buffer.from(parts.join('.')),
      type === 'ES256' ? { key: pair.privateKey, dsaEncoding: 'ieee-p1363' } : pair.privateKey,
    );
    return [...parts, signature.toString('base64url')].join('.');
  };
  return { jwk, token };
}
