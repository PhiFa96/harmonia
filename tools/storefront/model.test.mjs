import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  catalog,
  readiness,
  validateCatalog,
  validateConfig,
  releaseProblems,
  publicOrigin,
} from './model.mjs';
import { renderPage } from './render.mjs';
import { verifiedAsset, sha256 } from './media.mjs';
test('all three complete localizations fit both store text budgets', () => {
  validateCatalog(catalog);
  validateConfig(readiness);
});
test('missing translations and overlong multibyte keywords are rejected', () => {
  const missing = structuredClone(catalog);
  delete missing['en-GB'].supportPrivacy;
  assert.throws(() => validateCatalog(missing), /shape/);
  const long = structuredClone(catalog);
  long['de-DE'].store.keywords = 'ä'.repeat(51);
  assert.throws(() => validateCatalog(long), /Keyword byte/);
  const title = structuredClone(catalog);
  title['en-US'].store.name = 'x'.repeat(31);
  assert.throws(() => validateCatalog(title), /Store length/);
});
test('release configuration rejects private origins and spoofed store links', () => {
  for (const value of [
    'http://harmonia.app',
    'https://user:password@harmonia.app',
    'https://harmonia.app/app',
    'https://127.0.0.1',
    'https://localhost',
    'https://preview.test',
  ])
    assert.throws(() => publicOrigin(value));
  assert.equal(publicOrigin('https://harmonia.app/'), 'https://harmonia.app');
  const config = structuredClone(readiness);
  config.links.appStore = 'https://apps.apple.com.evil.test/app/id123';
  assert.throws(() => validateConfig(config), /Store URL/);
  config.links.appStore = null;
  config.availability.ios = true;
  assert.throws(() => validateConfig(config), /real store URL/);
});
test('HTML escapes text and contact values; review pages stay unindexed without fake store badges', () => {
  const original = catalog['de-DE'].headline;
  try {
    catalog['de-DE'].headline = '<script>alert("private")</script>';
    const html = renderPage('de-DE', readiness);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('noindex,nofollow'));
    assert.ok(!html.includes('rel="canonical"'));
    assert.ok(!html.includes('href="null"'));
    assert.ok(html.includes('href="/"'));
    assert.ok(html.includes('href="/privacy"'));
    assert.ok(!html.includes('https://apps.apple.com'));
  } finally {
    catalog['de-DE'].headline = original;
  }
  const config = structuredClone(readiness);
  config.supportEmail = 'help+music@harmonia.app';
  validateConfig(config);
  assert.ok(
    renderPage('en-US', config, { support: true }).includes('mailto:help+music@harmonia.app'),
  );
});
test('canonical and locale links use only the configured origin', () => {
  const config = { ...readiness, publicOrigin: 'https://harmonia.app' };
  const html = renderPage('en-GB', config);
  assert.ok(html.includes('rel="canonical" href="https://harmonia.app/about/en-gb.html"'));
  assert.equal((html.match(/rel="alternate"/g) ?? []).length, 3);
  assert.ok(html.includes('lang="en-GB"'));
});
test('missing manual approvals, legal and device evidence cannot pass release', () => {
  const missing = releaseProblems(readiness);
  for (const key of [
    'publicOrigin',
    'supportEmail',
    'approvals.brand',
    'legal.not evaluated',
    'device.not evaluated',
    'reviewedNativeMedia',
  ])
    assert.ok(missing.includes(key));
  const config = structuredClone(readiness);
  config.publicOrigin = 'https://harmonia.app';
  config.supportEmail = 'support@harmonia.app';
  for (const approval of Object.values(config.approvals)) {
    approval.approved = true;
    approval.evidenceReference = 'own-private-review';
  }
  const media = {
    captureKind: 'web-preview-reference',
    reviewed: true,
    reviewReference: 'own-private-review',
    assets: [],
  };
  assert.ok(
    releaseProblems(config, { legalMissing: [], deviceMissing: [], media }).includes(
      'reviewedNativeMedia',
    ),
  );
  config.approvals.website.evidenceReference = ' ';
  assert.ok(
    releaseProblems(config, { target: 'website', legalMissing: [] }).includes('approvals.website'),
  );
});
test('verified media rejects edits, traversal and a symlink outside the package', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-store-media-'));
  const outside = mkdtempSync(join(tmpdir(), 'harmonia-store-outside-'));
  try {
    const file = join(dir, 'own.txt');
    writeFileSync(file, 'own fixture');
    const asset = { path: 'own.txt', sha256: sha256(file) };
    assert.equal(verifiedAsset(dir, asset), file);
    writeFileSync(file, 'changed');
    assert.throws(() => verifiedAsset(dir, asset), /checksum/);
    assert.throws(() => verifiedAsset(dir, { ...asset, path: '../other' }), /inside/);
    const target = join(outside, 'private.txt');
    writeFileSync(target, 'own outside fixture');
    symlinkSync(target, join(dir, 'link.txt'));
    assert.throws(() => verifiedAsset(dir, { path: 'link.txt', sha256: sha256(target) }), /leaves/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
test('adding the website preserves the Expo entry and blocks a premature public release', async () => {
  const { buildSite } = await import('./build.mjs');
  const { readFileSync, existsSync } = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-store-site-'));
  try {
    const entry = '<html><title>Own Expo fixture</title></html>';
    writeFileSync(join(dir, 'index.html'), entry);
    buildSite(dir);
    assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), entry);
    assert.ok(existsSync(join(dir, 'about', 'de.html')));
    assert.ok(existsSync(join(dir, 'about', 'support-en-gb.html')));
    assert.ok(!existsSync(join(dir, 'about', 'sitemap.xml')));
    assert.throws(() => buildSite(dir, { release: true }), /Website release still open/);
    assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), entry);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('native media from only one platform cannot stand in for both stores', () => {
  const config = structuredClone(readiness);
  config.publicOrigin = 'https://harmonia.app';
  config.supportEmail = 'support@harmonia.app';
  for (const approval of Object.values(config.approvals)) {
    approval.approved = true;
    approval.evidenceReference = 'own-private-review';
  }
  const media = {
    captureKind: 'native-device',
    reviewed: true,
    reviewReference: 'own-private-review',
    assets: ['de-DE', 'en-US', 'en-GB'].flatMap((locale) => [
      ...Array.from({ length: 4 }, () => ({ locale, platform: 'ios', kind: 'screenshot' })),
      { locale, platform: 'ios', kind: 'video' },
    ]),
  };
  const missing = releaseProblems(config, { legalMissing: [], deviceMissing: [], media });
  assert.ok(!missing.includes('reviewedNativeMedia'));
  for (const locale of ['de-DE', 'en-US', 'en-GB'])
    assert.ok(missing.includes('media.' + locale + '.android'));
});
