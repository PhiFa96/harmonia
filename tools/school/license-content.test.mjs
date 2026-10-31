import test from 'node:test';
import assert from 'node:assert/strict';
import { LICENSE_MESSAGES, licenseText } from '../../packages/i18n/src/school-license.ts';
import { licenseInvoiceHtml } from './license-document.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
test('school licence translations contain matching fields in all locales', () => {
  for (const locale of ['de', 'en-US', 'en-GB']) {
    assert.deepEqual(
      Object.keys(LICENSE_MESSAGES[locale]).sort(),
      Object.keys(LICENSE_MESSAGES.de).sort(),
    );
    for (const [key, value] of Object.entries(LICENSE_MESSAGES.de))
      assert.deepEqual(
        LICENSE_MESSAGES[locale][key].match(/{{\w+}}/g)?.sort(),
        value.match(/{{\w+}}/g)?.sort(),
      );
    assert.ok(!licenseText(locale, 'capacity', { used: 1, seats: 2 }).includes('{{'));
  }
});
test('invoice sample escapes all supplied text and preserves cent amounts and draft disclaimer', () => {
  const i = {
    organization: '<script>alert(1)</script>',
    reference: 'A&"B',
    seats: 3,
    unitCents: 125,
    totalCents: 375,
    startsAt: '2026-10-24T00:00:00.000Z',
    endsAt: '2026-11-23T00:00:00.000Z',
    state: 'draft',
  };
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const html = licenseInvoiceHtml(i, locale);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('A&amp;&quot;B'));
    assert.ok(html.includes(LICENSE_MESSAGES[locale].invoiceTitle));
    assert.ok(
      html.includes(
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(3.75),
      ),
    );
    assert.ok(html.includes('default-src'));
  }
});
test('public bundle rejects school licence workbench and private invoice identifiers', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-license-bundle-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const value of [
    'license_invoices',
    LICENSE_MESSAGES.de.intro,
    LICENSE_MESSAGES['en-US'].invoiceNote,
  ]) {
    writeFileSync(join(dir, 'app.js'), `globalThis.value=${JSON.stringify(value)};`);
    const r = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /P4.16/);
  }
});
