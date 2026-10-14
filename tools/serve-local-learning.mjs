// Eigene lokale Edge Function; Produktionskonfiguration und Schlüssel bleiben unverändert.
import { execFileSync, spawn } from 'node:child_process';
import { chmodSync, copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
const docker = execFileSync('which', ['docker'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const dir = mkdtempSync(join(tmpdir(), 'harmonia-learning-'));
const tutorTest = process.argv.includes('--tutor-test'),
  tutorLive = process.argv.includes('--tutor-live');
if ((tutorLive && tutorTest) || (tutorLive && !process.env.ANTHROPIC_API_KEY)) {
  rmSync(dir, { recursive: true, force: true });
  throw new Error('Tutor-Live benötigt ANTHROPIC_API_KEY und ist vom lokalen Test getrennt.');
}
const wrapper = join(dir, 'docker'),
  envFile = join(dir, 'preview.env');
copyFileSync(new URL('./docker-local-wrapper.cjs', import.meta.url), wrapper);
chmodSync(wrapper, 0o755);
// Ausschließlich lokale Entwürfe für die Integration, kein Remote-Release.
writeFileSync(
  envFile,
  (process.argv.includes('--published') ? '' : 'HARMONIA_LOCAL_PREVIEW=true\n') +
    (tutorTest ? 'HARMONIA_TUTOR_LOCAL_TEST=true\n' : ''),
  { mode: 0o600 },
);
const child = spawn('pnpm', ['exec', 'supabase', 'functions', 'serve', '--env-file', envFile], {
  detached: process.platform !== 'win32',
  env: {
    ...process.env,
    HARMONIA_DOCKER_BINARY: docker,
    HARMONIA_TUTOR_FORWARD_KEY: tutorLive ? 'true' : 'false',
    PATH: dir + delimiter + process.env.PATH,
  },
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  });
child.on('error', () => {
  rmSync(dir, { recursive: true, force: true });
  process.exitCode = 1;
});
child.on('exit', (code) => {
  rmSync(dir, { recursive: true, force: true });
  process.exitCode = code ?? 0;
});
