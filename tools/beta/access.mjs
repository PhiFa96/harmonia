// Individual, high-entropy bearer secrets over HTTP Basic, behind an HTTPS reverse proxy.
// Only hashes are kept in the verifier. No email/address/account identity is collected here.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, statSync, realpathSync, renameSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
export const testerId = /^bt-[a-f\d]{16}$/;
export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
export function validInstant(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
export function validateAccess(input) {
  if (input?.version !== 1 || !Array.isArray(input.testers) || input.testers.length > 100)
    throw Error('Invalid beta access file');
  const ids = new Set();
  for (const tester of input.testers) {
    if (
      !testerId.test(tester.id) ||
      ids.has(tester.id) ||
      !/^[a-f\d]{64}$/.test(tester.tokenHash) ||
      !validInstant(tester.expiresAt) ||
      typeof tester.revoked !== 'boolean' ||
      Object.keys(tester).sort().join() !==
        ['id', 'tokenHash', 'expiresAt', 'revoked'].sort().join()
    )
      throw Error('Invalid or duplicate beta access entry');
    ids.add(tester.id);
  }
}
export function readPrivateJson(file) {
  const info = statSync(file);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 2 * 1024 * 1024)
    throw Error('Private beta files require mode 0600 and a bounded size');
  return JSON.parse(readFileSync(file, 'utf8'));
}
export function savePrivateJson(file, value) {
  // New name + rename keeps readers from seeing a half-written revocation file.
  const temp = file + '.' + randomBytes(8).toString('hex') + '.tmp';
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  renameSync(temp, file);
}
export function issueAccess(input, expiresAt, now = Date.now()) {
  validateAccess(input);
  const expires = Date.parse(expiresAt);
  if (!validInstant(expiresAt) || expires <= now || expires - now > 90 * 86400000)
    throw Error('Access expiry must be in the next 90 days');
  // Prune expired/revoked credentials before adding, preserving the 100 active tester cap.
  const testers = input.testers.filter((item) => !item.revoked && Date.parse(item.expiresAt) > now);
  if (testers.length >= 100) throw Error('At most 100 active beta credentials');
  const id = 'bt-' + randomBytes(8).toString('hex'),
    token = randomBytes(32).toString('base64url');
  const access = {
    version: 1,
    testers: [...testers, { id, tokenHash: tokenHash(token), expiresAt, revoked: false }],
  };
  return { id, token, access };
}
export function validAuthorization(header, access, now = Date.now()) {
  validateAccess(access);
  if (typeof header !== 'string' || header.length > 256 || !/^Basic [A-Za-z0-9+/]+=*$/.test(header))
    return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const split = decoded.indexOf(':'),
    id = decoded.slice(0, split),
    token = decoded.slice(split + 1);
  if (split < 0 || !testerId.test(id) || !/^[\w-]{43}$/.test(token)) return false;
  const hash = Buffer.from(tokenHash(token), 'hex');
  return access.testers.some(
    (entry) =>
      entry.id === id &&
      !entry.revoked &&
      Date.parse(entry.expiresAt) > now &&
      timingSafeEqual(hash, Buffer.from(entry.tokenHash, 'hex')),
  );
}
export function accessMain(args) {
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
  if (!value('--file'))
    throw Error('--file is required (private directory outside the app export)');
  const file = resolve(value('--file'));
  if (args[0] === 'add') {
    let input;
    try {
      input = readPrivateJson(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      input = { version: 1, testers: [] };
    }
    const { id, token, access } = issueAccess(input, value('--expires'));
    // No secret is printed or sent. The operator shares this one-time private handout separately.
    const handout = join(realpathSync(dirname(file)), id + '.txt');
    writeFileSync(
      handout,
      `Harmonia closed beta\nUsername: ${id}\nPassword: ${token}\nExpires: ${value('--expires')}\nPrivate access; do not forward.\n`,
      { mode: 0o600, flag: 'wx' },
    );
    savePrivateJson(file, access);
    console.log('Private tester handout created: ' + handout + '; no invitation sent.');
  } else if (args[0] === 'revoke' && testerId.test(value('--id'))) {
    const input = readPrivateJson(file);
    validateAccess(input);
    const entry = input.testers.find((item) => item.id === value('--id'));
    if (!entry) throw Error('Unknown tester access');
    entry.revoked = true;
    savePrivateJson(file, input);
    console.log('Tester access revoked for subsequent requests.');
  } else throw Error('Choose add --expires ISO-UTC or revoke --id bt-…');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    accessMain(process.argv.slice(2));
  } catch {
    console.error(
      'Beta access update failed; check arguments, expiry and private file permissions.',
    );
    process.exitCode = 1;
  }
}
