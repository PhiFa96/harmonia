import { mkdirSync, readFileSync, writeFileSync, copyFileSync, realpathSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  catalog,
  readiness,
  locales,
  pagePath,
  validateCatalog,
  validateConfig,
} from './model.mjs';
import { verifiedAsset, sha256 } from './media.mjs';
import { legalConfig } from '../../apps/mobile/src/legal/config.ts';
import { reviewHtml, reviewCss } from './review.mjs';
import { actualReleaseProblems } from './check.mjs';
const at = process.argv.indexOf('--output'),
  mediaAt = process.argv.indexOf('--media');
const output = resolve(at >= 0 ? process.argv[at + 1] : 'artifacts/quality/store-package');
const evidenceRoot = resolve('artifacts/quality');
if (!output.startsWith(evidenceRoot + sep))
  throw Error('Store preparation belongs in a separate artifacts/quality child');
validateCatalog(catalog);
validateConfig(readiness);
const mediaFile = mediaAt >= 0 ? resolve(process.argv[mediaAt + 1]) : null;
const media = mediaFile ? JSON.parse(readFileSync(mediaFile, 'utf8')) : null;
const missing = actualReleaseProblems('store', media);
if (process.argv.includes('--release') && missing.length)
  throw Error('Store release still open: ' + missing.join(', '));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = Boolean(
  execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' }).trim(),
);
mkdirSync(output, { recursive: true });
// Only overwrite our generated text files; do not clear directories supplied by the caller.
const report = {
  version: 1,
  status: 'review-package',
  approvedForUpload: false,
  sourceCommit,
  sourceDirty,
  locales: [],
  mediaCaptureKind: media?.captureKind ?? null,
  mediaProvenance: media
    ? {
        sourceCommit: media.sourceCommit,
        sourceDirty: media.sourceDirty,
        capturedAt: media.capturedAt,
        captureTransport: media.captureTransport,
        physicalDeviceEvidence: media.physicalDeviceEvidence,
        audioIncluded: media.audioIncluded,
        reviewed: media.reviewed,
        reviewReference: media.reviewReference,
      }
    : null,
  missingReleaseEvidence: missing,
  files: [],
};
const write = (path, text) => {
  const file = join(output, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  report.files.push({ path, sha256: sha256(file) });
};
for (const locale of locales) {
  const { store } = catalog[locale];
  const urls = readiness.publicOrigin
    ? {
        marketing: new URL(pagePath(locale), readiness.publicOrigin).href,
        support: new URL(pagePath(locale, true), readiness.publicOrigin).href,
        privacy: locale === 'de-DE' ? legalConfig().privacyDe : legalConfig().privacyEn,
      }
    : { marketing: null, support: null, privacy: null };
  report.locales.push({
    locale,
    urls,
    counts: Object.fromEntries(
      Object.entries(store)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => [
          k,
          { characters: Array.from(v).length, utf8Bytes: Buffer.byteLength(v) },
        ]),
    ),
  });
  for (const key of ['name', 'subtitle', 'promotionalText', 'keywords', 'description'])
    write(`text/${locale}/app-store/${key}.txt`, store[key]);
  for (const key of ['name', 'shortDescription', 'description'])
    write(`text/${locale}/google-play/${key}.txt`, store[key]);
  write(`text/${locale}/screenshot-captions.json`, JSON.stringify(store.screenshots, null, 2));
}
for (const asset of media?.assets ?? []) {
  if (!locales.includes(asset.locale) || !['screenshot', 'video'].includes(asset.kind))
    throw Error('Unexpected store media');
  const file = verifiedAsset(dirname(mediaFile), asset);
  const relative = `media/${asset.path}`;
  const destination = join(output, relative);
  mkdirSync(dirname(destination), { recursive: true });
  if (realpathSync(file) !== resolve(destination)) copyFileSync(file, destination);
  report.files.push({ ...asset, path: relative });
}
write('review.html', reviewHtml(report));
write('review.css', reviewCss);
writeFileSync(join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  `Store review package: ${output}; ${report.files.length} files; upload approval remains ${report.approvedForUpload}.`,
);
