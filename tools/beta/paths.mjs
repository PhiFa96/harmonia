import { existsSync, realpathSync, mkdirSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// Candidates and private reports must never share an output directory.
export function newPrivateOutput(path, kind) {
  if (!['candidates', 'reports'].includes(kind)) throw Error('Unknown beta output kind');
  const base = fileURLToPath(new URL('../../artifacts/beta/' + kind, import.meta.url));
  const output = resolve(path);
  if (!output.startsWith(base + sep) || existsSync(output))
    throw Error('Use a new child of artifacts/beta/' + kind);
  let parent = dirname(output);
  while (!existsSync(parent)) parent = dirname(parent);
  if (realpathSync(parent) !== parent) throw Error('No symlinked beta output parents');
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  return output;
}
