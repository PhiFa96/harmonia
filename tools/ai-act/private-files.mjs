import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export function writePrivate(directory, name, value, { root = ROOT, overwrite = true } = {}) {
  if (
    !/^artifacts\/ai-act(?:\/[a-zA-Z0-9_-]+)*$/.test(directory) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)
  )
    throw Error('Unsafe AI handoff path');
  let dir = resolve(root);
  for (const segment of directory.split('/')) {
    dir = resolve(dir, segment);
    if (!existsSync(dir)) mkdirSync(dir, { mode: 0o700 });
    const stat = lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Unsafe AI handoff directory');
    chmodSync(dir, 0o700);
  }
  const path = resolve(dir, name);
  if (existsSync(path)) {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Unsafe AI handoff file');
    chmodSync(path, 0o600);
    if (!overwrite) return path;
  }
  const temporary = resolve(dir, '.' + randomUUID() + '.tmp');
  try {
    writeFileSync(temporary, value, { mode: 0o600, flag: 'wx' });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
  return path;
}
