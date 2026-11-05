import { createPublicKey, verify } from 'node:crypto';
import { SchoolError } from './errors.mjs';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const unauthorized = () => new SchoolError('forbidden', 401);
/** Explicit trusted issuer/audience/public keys; never trusts a token-supplied key URL. */
export function createIdentityVerifier({
  issuer,
  audience = 'authenticated',
  jwks,
  now = Date.now,
}) {
  if (
    typeof issuer !== 'string' ||
    !issuer ||
    typeof audience !== 'string' ||
    !audience ||
    !Array.isArray(jwks?.keys) ||
    !jwks.keys.length ||
    jwks.keys.length > 10
  )
    throw new Error('A trusted school JWT issuer, audience and public JWKS are required');
  const keys = new Map();
  for (const jwk of jwks.keys) {
    if (
      !jwk ||
      typeof jwk.kid !== 'string' ||
      !jwk.kid ||
      jwk.kid.length > 128 ||
      keys.has(jwk.kid) ||
      !['ES256', 'RS256'].includes(jwk.alg) ||
      jwk.d ||
      (jwk.use && jwk.use !== 'sig') ||
      (jwk.key_ops && (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes('verify')))
    )
      throw new Error('Invalid school JWT public key configuration');
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    if (
      (jwk.alg === 'ES256' &&
        (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails.namedCurve !== 'prime256v1')) ||
      (jwk.alg === 'RS256' &&
        (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048))
    )
      throw new Error('Unsupported school JWT public key');
    keys.set(jwk.kid, { key, alg: jwk.alg });
  }
  return (token) => {
    try {
      if (typeof token !== 'string' || token.length > 8192) throw unauthorized();
      const parts = token.split('.');
      if (parts.length !== 3 || !parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p)))
        throw unauthorized();
      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
      const key = keys.get(header.kid);
      if (!key || key.alg !== header.alg || header.crit || (header.typ && header.typ !== 'JWT'))
        throw unauthorized();
      const signature = Buffer.from(encodedSignature, 'base64url');
      if (
        !verify(
          'sha256',
          Buffer.from(`${encodedHeader}.${encodedPayload}`),
          header.alg === 'ES256' ? { key: key.key, dsaEncoding: 'ieee-p1363' } : key.key,
          signature,
        )
      )
        throw unauthorized();
      const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      const seconds = now() / 1000;
      if (
        claims.iss !== issuer ||
        !uuid.test(claims.sub) ||
        !(
          claims.aud === audience ||
          (Array.isArray(claims.aud) && claims.aud.length <= 5 && claims.aud.includes(audience))
        ) ||
        !Number.isSafeInteger(claims.exp) ||
        claims.exp <= seconds ||
        claims.exp > Number.MAX_SAFE_INTEGER / 1000 ||
        (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > seconds)) ||
        (claims.iat !== undefined &&
          (!Number.isSafeInteger(claims.iat) || claims.iat > seconds || claims.iat >= claims.exp))
      )
        throw unauthorized();
      return { subject: claims.sub.toLowerCase(), expiresAt: claims.exp * 1000 };
    } catch {
      throw unauthorized();
    }
  };
}
