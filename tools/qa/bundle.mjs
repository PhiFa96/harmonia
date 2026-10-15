import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const budgets = JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8'));
const root = resolve(process.argv[2] ?? 'apps/mobile/dist');
const files = [];
function visit(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) visit(path);
    else files.push(path);
  }
}
visit(root);
const report = {
  webRaw: 0,
  webGzip: 0,
  audioBytes: 0,
  nativeEntries: [],
  format: 'harmonia-bundle-v1',
};
for (const file of files) {
  const size = statSync(file).size;
  if (file.endsWith('.mp3')) report.audioBytes += size;
  if (file.includes('/js/web/') && file.endsWith('.js')) {
    report.webRaw += size;
    report.webGzip += gzipSync(readFileSync(file)).length;
  }
  if (/\/js\/(ios|android)\/entry-[^/]+\.(hbc|js)$/.test(file)) {
    assert.ok(size <= budgets.nativeEntryBytes, 'Native entry budget exceeded');
    report.nativeEntries.push({
      platform: file.includes('/ios/') ? 'ios' : 'android',
      bytes: size,
    });
  }
}
assert.ok(report.webRaw > 0, 'No actual web JS files found');
assert.ok(report.webRaw <= budgets.webJavaScriptRawBytes, 'Web raw JavaScript budget exceeded');
assert.ok(report.webGzip <= budgets.webJavaScriptGzipBytes, 'Web gzip budget exceeded');
assert.ok(report.audioBytes <= budgets.audioAssetsBytes, 'Audio assets budget exceeded');
console.log(JSON.stringify(report));
