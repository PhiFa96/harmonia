import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { catalog, readiness, validateCatalog, validateConfig, releaseProblems } from './model.mjs';
import { legalConfig } from '../../apps/mobile/src/legal/config.ts';
import { legalReleaseMissing } from '../../apps/mobile/src/legal/readiness.ts';
import { missingDeviceEvidence } from '../qa/release.mjs';
export function actualReleaseProblems(target, media = null, config = readiness) {
  const missing = releaseProblems(config, {
    target,
    media,
    legalMissing: [
      ...legalReleaseMissing(
        JSON.parse(
          readFileSync(new URL('../../apps/mobile/legal-readiness.json', import.meta.url), 'utf8'),
        ),
      ),
      ...(Object.values(legalConfig()).every(Boolean) ? [] : ['publicDocumentUrls']),
    ],
    deviceMissing: missingDeviceEvidence(
      JSON.parse(readFileSync(new URL('../qa/device-readiness.json', import.meta.url), 'utf8')),
    ),
  });
  const published = JSON.parse(
    readFileSync(new URL('../../packages/content/src/published.json', import.meta.url), 'utf8'),
  );
  if (target === 'store' && !published.lessons?.length) missing.push('content.publishedLessons');
  return missing;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateCatalog(catalog);
  validateConfig(readiness);
  if (process.argv.includes('--release')) {
    const at = process.argv.indexOf('--media');
    const media = at >= 0 ? JSON.parse(readFileSync(process.argv[at + 1], 'utf8')) : null;
    const missing = actualReleaseProblems(
      process.argv.includes('--website') ? 'website' : 'store',
      media,
    );
    if (missing.length) {
      console.error('Storefront release still open: ' + missing.join(', '));
      process.exitCode = 1;
    } else
      console.log('Release evidence fields complete; actual approvals remain human decisions.');
  } else
    console.log(
      'DE/US/UK storefront texts, field budgets and links checked; release evidence is separate.',
    );
}
