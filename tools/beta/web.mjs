import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  lstatSync,
  realpathSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSite } from '../storefront/build.mjs';
import { sha256, verifiedAsset } from '../storefront/media.mjs';
import { buildGuides } from './guide.mjs';
import { assertBetaReady, readiness } from './readiness.mjs';
import { newPrivateOutput } from './paths.mjs';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const manifestName = 'harmonia-beta-candidate.json';
const git = (...args) =>
  execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
function cleanSourceCommit() {
  if (git('status', '--porcelain')) throw Error('Beta requires a clean source checkout');
  return git('rev-parse', 'HEAD');
}
export function candidateFiles(root) {
  const files = [];
  function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name),
        info = lstatSync(path);
      if (info.isSymbolicLink()) throw Error('No symlinks in a beta candidate');
      if (info.isDirectory()) walk(path);
      else if (info.isFile()) {
        const pathName = relative(root, path).split(sep).join('/');
        if (pathName === manifestName) continue;
        if (name.startsWith('.env') || /(?:access|study|invite)\.json$/.test(name))
          throw Error('Private files in beta candidate');
        files.push({ path: pathName, sha256: sha256(path) });
      } else throw Error('Unexpected candidate file type');
    }
  }
  walk(root);
  return files;
}
export function verifyCandidate(root, expectedCommit = cleanSourceCommit()) {
  root = realpathSync(root);
  const input = JSON.parse(readFileSync(join(root, manifestName), 'utf8'));
  if (
    input.version !== 1 ||
    input.variant !== 'production' ||
    input.campaignId !== readiness.campaignId ||
    input.sourceDirty !== false ||
    !/^[a-f\d]{40}$/.test(input.sourceCommit) ||
    input.sourceCommit !== expectedCommit ||
    input.contentSha256 !==
      sha256(new URL('../../packages/content/src/published.json', import.meta.url)) ||
    !Array.isArray(input.files) ||
    !input.files.some((item) => item.path === 'index.html') ||
    !input.files.some((item) => /\/js\/web\/.*\.js$/.test(item.path)) ||
    existsSync(join(root, 'harmonia-qa-fixture.json'))
  )
    throw Error('Invalid or stale production beta candidate');
  const actual = candidateFiles(root);
  if (JSON.stringify(actual) !== JSON.stringify(input.files))
    throw Error('Candidate files changed');
  for (const file of input.files) verifiedAsset(root, file);
  return input;
}
export function buildBetaWeb(output) {
  assertBetaReady('web');
  const sourceCommit = cleanSourceCommit();
  output = newPrivateOutput(output, 'candidates');
  // Do not consume .env files or substitute the internal QA fixture builder.
  const env = { ...process.env, EXPO_NO_DOTENV: '1', APP_VARIANT: 'production' };
  execFileSync(
    'pnpm',
    [
      '--filter',
      '@harmonia/mobile',
      'exec',
      'expo',
      'export',
      '--platform',
      'web',
      '--output-dir',
      output,
    ],
    { cwd: repo, env, stdio: 'inherit' },
  );
  buildSite(output);
  buildGuides(output, readiness.feedbackEmail);
  execFileSync(process.execPath, ['tools/check-public-bundle.mjs', output], {
    cwd: repo,
    env,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, ['tools/qa/bundle.mjs', output], {
    cwd: repo,
    env,
    stdio: 'inherit',
  });
  if (cleanSourceCommit() !== sourceCommit) throw Error('Source commit changed during beta export');
  writeFileSync(
    join(output, manifestName),
    JSON.stringify(
      {
        version: 1,
        campaignId: readiness.campaignId,
        variant: 'production',
        sourceCommit,
        sourceDirty: false,
        contentSha256: sha256(
          new URL('../../packages/content/src/published.json', import.meta.url),
        ),
        files: candidateFiles(output),
      },
      null,
      2,
    ) + '\n',
  );
  verifyCandidate(output);
  console.log('Private beta candidate built; no deployment or invitation performed.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const at = process.argv.indexOf('--output');
    buildBetaWeb(at >= 0 ? process.argv[at + 1] : join(repo, 'artifacts/beta/candidates/web'));
  } catch {
    console.error(
      'Beta export blocked. Check beta prerequisites, runtime bindings and a new private output path.',
    );
    process.exitCode = 1;
  }
}
