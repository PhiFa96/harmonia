import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const EVIDENCE_PREFIX = 'artifacts/ai-act/evidence/';

/** Inspect a private local document, never an URL or a file outside the evidence directory. */
export function inspectDocument(document, { root = ROOT } = {}) {
  if (
    !document ||
    typeof document.path !== 'string' ||
    typeof document.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(document.sha256) ||
    !document.path.startsWith(EVIDENCE_PREFIX) ||
    !/\.(?:pdf|md|txt)$/.test(document.path) ||
    document.path.split('/').some((p) => !p || p === '.' || p === '..')
  )
    return { valid: false, reason: 'missing-or-unsafe' };
  let fd;
  try {
    const directory = resolve(root, 'artifacts/ai-act/evidence');
    const absolute = resolve(root, document.path);
    if (!relative(directory, absolute) || relative(directory, absolute).startsWith('..' + sep))
      return { valid: false, reason: 'missing-or-unsafe' };
    for (let current = dirname(absolute); current !== resolve(root); current = dirname(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        return { valid: false, reason: 'missing-or-unsafe' };
    }
    fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (
      !stat.isFile() ||
      stat.size === 0 ||
      stat.size > 10 * 1024 * 1024 ||
      (stat.mode & 0o077) !== 0
    )
      return { valid: false, reason: 'empty-large-or-not-private' };
    const sha256 = createHash('sha256').update(readFileSync(fd)).digest('hex');
    return {
      valid: sha256 === document.sha256,
      reason: sha256 === document.sha256 ? null : 'changed',
      sha256,
    };
  } catch {
    return { valid: false, reason: 'missing-or-unsafe' };
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function reviewDocuments(data, options) {
  return Object.fromEntries(
    Object.entries(data.reviews).map(([scope, review]) => [
      scope,
      inspectDocument(review.document, options),
    ]),
  );
}
