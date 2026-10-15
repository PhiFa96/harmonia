import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { locales, catalog } from './model.mjs';
import { sha256, pngDimensions } from './media.mjs';
import { COLORS } from '../../packages/ui/src/tokens.ts';
const at = process.argv.indexOf('--output'),
  appAt = process.argv.indexOf('--app-dir');
const output = resolve(at >= 0 ? process.argv[at + 1] : 'artifacts/quality/store-captures');
const appDir = resolve(
  appAt >= 0 ? process.argv[appAt + 1] : (process.env.HARMONIA_QA_DIR ?? 'apps/mobile/dist'),
);
const root = resolve('artifacts/quality');
if (!output.startsWith(root + sep) || output === appDir || appDir.startsWith(output + sep))
  throw Error('Store captures must be separate from source and app fixtures in artifacts/quality');
if (process.env.HARMONIA_QA_URL)
  throw Error('Store recording starts its own verified isolated fixture server');
const fixture = JSON.parse(readFileSync(join(appDir, 'harmonia-qa-fixture.json'), 'utf8'));
if (fixture.version !== 1 || fixture.variant !== 'preview' || fixture.isolatedGuest !== true)
  throw Error('Build an isolated preview fixture with qa:build before recording');
execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = Boolean(
  execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' }).trim(),
);
mkdirSync(output, { recursive: true });
execFileSync(
  'pnpm',
  ['exec', 'playwright', 'test', '--config', 'tools/storefront/playwright.config.mjs'],
  {
    env: {
      ...process.env,
      HARMONIA_QA_DIR: appDir,
      HARMONIA_QA_OUTPUT: join(output, 'runner'),
      HARMONIA_STORE_CAPTURE_DIR: output,
    },
    stdio: 'inherit',
  },
);
const report = {
  version: 1,
  captureKind: 'web-preview-reference',
  reviewed: false,
  reviewReference: null,
  capturedAt: new Date().toISOString(),
  sourceCommit,
  sourceDirty,
  fixture,
  physicalDeviceEvidence: false,
  audioIncluded: false,
  viewport: { width: 440, height: 956, deviceScaleFactor: 3 },
  assets: [],
};
for (const locale of locales) {
  for (const shot of catalog[locale].store.screenshots) {
    const path = locale + '/' + shot.id + '.png',
      file = join(output, path),
      dimensions = pngDimensions(file);
    if (dimensions.width !== 1320 || dimensions.height !== 2868)
      throw Error('Unexpected actual screenshot dimensions');
    report.assets.push({
      locale,
      kind: 'screenshot',
      platform: 'web',
      id: shot.id,
      path,
      sha256: sha256(file),
      ...dimensions,
      title: shot.title,
      alt: shot.alt,
    });
  }
  const path = locale + '/preview.mp4',
    file = join(output, path);
  const filter = `scale=1080:1920:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x${COLORS.light.background.slice(1)},fps=30`;
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-v',
      'error',
      '-i',
      join(output, locale, 'preview.webm'),
      '-vf',
      filter,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-an',
      '-movflags',
      '+faststart',
      '-t',
      '30',
      file,
    ],
    { stdio: 'inherit' },
  );
  const probe = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {
      encoding: 'utf8',
    }),
  );
  const video = probe.streams.find((s) => s.codec_type === 'video'),
    durationSeconds = Number(probe.format.duration);
  if (
    video?.codec_name !== 'h264' ||
    video.width !== 1080 ||
    video.height !== 1920 ||
    durationSeconds < 15 ||
    durationSeconds > 30.1 ||
    probe.streams.some((s) => s.codec_type === 'audio')
  )
    throw Error('Unexpected preview video format');
  report.assets.push({
    locale,
    kind: 'video',
    platform: 'web',
    path,
    sha256: sha256(file),
    width: video.width,
    height: video.height,
    durationSeconds,
    codec: video.codec_name,
    frameRate: video.avg_frame_rate,
    audio: false,
  });
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  'Recorded 12 real web screenshots and 3 silent reference videos. Native Store capture and approval remain open: ' +
    output,
);
