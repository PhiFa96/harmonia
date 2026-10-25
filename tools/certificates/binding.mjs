import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
export const SOURCE_HASH = /^[a-f0-9]{64}$/;
const sha = (value) => createHash('sha256').update(value).digest('hex');

/** Bind the complete exam implementation, including newly added source modules. */
export function certificateDigests() {
  const paths = new Set([
    'pnpm-lock.yaml',
    'package.json',
    'pnpm-workspace.yaml',
    '.nvmrc',
    'tools/voice-leading/playback.ts',
    'packages/ui/src/tokens.ts',
    'packages/notation/node_modules/@vexflow-fonts/bravura/bravura.woff2',
    'packages/notation/node_modules/@vexflow-fonts/bravura/LICENSE.txt',
    'apps/mobile/node_modules/@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf',
    'apps/mobile/node_modules/@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf',
  ]);
  function walk(dir) {
    for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
      const path = dir + '/' + entry.name;
      if (entry.isSymbolicLink()) throw Error('Certificate source symlink requires review');
      if (entry.isDirectory()) walk(path);
      else if (
        /\.(?:ts|tsx|mjs|json)$/.test(path) &&
        !/(?:\.test\.|\.tonal\.|\.spec\.|-fixture\.|playwright\.config\.)/.test(path)
      )
        paths.add(path);
    }
  }
  for (const dir of [
    'tools/certificates',
    'packages/content/src',
    'packages/exercises/src',
    'packages/theory/src',
    'packages/notation/src',
    'packages/audio/src',
    'packages/i18n/src',
  ]) {
    walk(dir);
    if (dir.startsWith('packages/')) paths.add(dir.replace(/\/src$/, '/package.json'));
  }
  return Object.fromEntries(
    [...paths].sort().map((path) => {
      const absolute = realpathSync(resolve(root, path));
      if (relative(root, absolute).startsWith('..')) throw Error('Certificate source outside repo');
      return [path, sha(readFileSync(absolute))];
    }),
  );
}

export function certificateSourceHash(digests = certificateDigests()) {
  if (!Object.keys(digests).length || Object.values(digests).some((h) => !SOURCE_HASH.test(h)))
    throw Error('Invalid certificate source digests');
  return sha(
    JSON.stringify(
      Object.keys(digests)
        .sort()
        .map((path) => [path, digests[path]]),
    ),
  );
}
