import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
const docker = execFileSync('which', ['docker'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const dir = mkdtempSync(join(tmpdir(), 'harmonia-local-docker-'));
try {
  const wrapper = join(dir, 'docker');
  copyFileSync(new URL('./docker-local-wrapper.cjs', import.meta.url), wrapper);
  chmodSync(wrapper, 0o755);
  const result = spawnSync('pnpm', ['exec', 'supabase', 'start'], {
    env: {
      ...process.env,
      HARMONIA_DOCKER_BINARY: docker,
      PATH: dir + delimiter + process.env.PATH,
    },
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0)
    throw new Error('Lokales Supabase konnte nicht gestartet werden.');
  await import('./prepare-local-email.mjs');
} finally {
  rmSync(dir, { recursive: true });
}
