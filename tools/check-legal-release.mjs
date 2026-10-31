import { aiActReleaseProblems } from './ai-act/model.mjs';
import { readFileSync } from 'node:fs';
import { legalReleaseMissing } from '../apps/mobile/src/legal/readiness.ts';
const input = JSON.parse(
  readFileSync(new URL('../apps/mobile/legal-readiness.json', import.meta.url), 'utf8'),
);
const missing = [...legalReleaseMissing(input), ...aiActReleaseProblems().map((p) => 'aiAct.' + p)];
if (process.argv.includes('--release') && missing.length) {
  console.error('Release blocked; missing legal evidence: ' + missing.join(', '));
  process.exitCode = 1;
} else
  console.log(
    'Legal readiness checked: ' +
      missing.length +
      ' open evidence fields; no legal approval inferred.',
  );
