import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { certificateReview, certificateReviewHtml } from './review.mjs';

export function checkCertificates(args) {
  if (
    new Set(args).size !== args.length ||
    args.some((a) => !['--report', '--release', '--json'].includes(a))
  )
    throw Error('Invalid certificate review argument');
  const packet = certificateReview();
  if (args.includes('--report')) {
    const dir = new URL('../../artifacts/certificates/review/', import.meta.url);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    chmodSync(dir, 0o700);
    const write = (name, value) => {
      const path = new URL(name, dir);
      writeFileSync(path, value, { mode: 0o600 });
      chmodSync(path, 0o600);
    };
    write('snapshot.json', JSON.stringify(packet, null, 2) + '\n');
    for (const locale of ['de', 'en-US', 'en-GB'])
      write(locale + '.html', certificateReviewHtml(packet, locale));
    if (!args.includes('--json'))
      console.log('Private certificate review pack: ' + fileURLToPath(dir));
  }
  if (args.includes('--json')) console.log(JSON.stringify(packet, null, 2));
  else
    console.log(
      `Certificate preparation: ${packet.profiles.length} draft profiles, ${packet.missing.length} open requirements. Invalid samples only.`,
    );
  if (args.includes('--release')) {
    console.error('Certificate release blocked: ' + packet.missing.join(', '));
    return 1;
  }
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = checkCertificates(process.argv.slice(2));
  } catch {
    console.error('Certificate preparation invalid; inspect source coverage and AI inventory.');
    process.exitCode = 1;
  }
}
