import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildWorkbench, STARTER_DRAFT } from '../../tools/voice-leading-workbench.mjs';
import { WORKBENCH_MESSAGES } from '../../tools/voice-leading/workbench-messages.ts';
import { REPORT_MESSAGES } from '../../tools/voice-leading/messages.ts';
import { MAX_DRAFT_BYTES } from '../../tools/voice-leading/workbench-model.ts';

let html;
const runtime = new WeakMap();
test.beforeAll(async () => {
  html = await buildWorkbench('de-DE');
});
test.beforeEach(async ({ page }) => {
  const events = { requests: [], errors: [] };
  runtime.set(page, events);
  page.on('request', (request) => {
    if (/^https?:/u.test(request.url())) events.requests.push(request.url());
  });
  page.on('pageerror', (error) => events.errors.push(error.message));
  // Eigener generierter Inhalt; file://-Navigation ist in der Cloud gesperrt.
  await page.setContent(html);
  await expect(page.getByRole('status')).toContainText('3.');
});
test.afterEach(async ({ page }) => {
  expect(runtime.get(page)).toEqual({ requests: [], errors: [] });
});

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: keyboard, embedded font, local computation and accessibility`, async ({
    page,
  }) => {
    await page.getByRole('combobox').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('16px ReviewBravura'))).toBe(true);
    const first = page.locator('#finding-1 > summary');
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#finding-1')).toHaveAttribute('open', '');
    await expect(page.locator('#finding-1 table')).toHaveCount(2);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('edits invalidate old findings; correction, invalid input and recovery use current notation', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const soprano = page.getByRole('textbox', { name: 'Sopran', exact: true });
  await soprano.fill('E4/2 F4/2 | B3/2 C4/2');
  await expect(page.locator('.finding')).toHaveCount(0);
  await expect(page.getByRole('button', { name: m.export })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText(m.pending);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: m.export }).click();
  const downloaded = await downloadPromise;
  const report = await readFile(await downloaded.path(), 'utf8');
  expect(report).toContain('id="finding-2"');
  expect(report).not.toContain('id="finding-3"');
  expect(report).not.toMatch(/<script/iu);
  expect(report).toContain(REPORT_MESSAGES['de-DE'].draft);
  await soprano.fill('E4/4 | B3/2 C4/2');
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.getByRole('alert')).toContainText(m.invalid);
  await expect(page.locator('.finding')).toHaveCount(0);
  await expect(page.getByRole('button', { name: m.export })).toBeDisabled();
  await soprano.fill(STARTER_DRAFT.parts.soprano);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('alert')).toBeEmpty();
});

test('unfinished input downloads and reloads; malformed or oversized imports preserve input', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const soprano = page.getByRole('textbox', { name: 'Sopran', exact: true });
  await soprano.fill('');
  await page.getByRole('textbox', { name: m.settings, exact: true }).fill('{ unfinished');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: m.save }).click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  const saved = JSON.parse(bytes.toString('utf8'));
  expect(saved.parts.soprano).toBe('');
  expect(saved.settings).toBe('{ unfinished');
  await soprano.fill('C4/1');
  await page
    .getByLabel(m.load)
    .setInputFiles({ name: 'draft.json', mimeType: 'application/json', buffer: bytes });
  await expect(soprano).toHaveValue('');
  await expect(page.getByRole('status')).toHaveText(m.loaded);
  await soprano.fill('D4/1');
  for (const text of ['{"format":"other"}', 'x'.repeat(MAX_DRAFT_BYTES + 1)]) {
    await page
      .getByLabel(m.load)
      .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(text) });
    await expect(page.getByRole('alert')).toContainText(m.loadError);
    await expect(soprano).toHaveValue('D4/1');
  }
  await page.getByLabel(m.load).setInputFiles({
    name: 'starter.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(STARTER_DRAFT)),
  });
  await expect(soprano).toHaveValue(STARTER_DRAFT.parts.soprano);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
});

test('empty rule selection is explicit, imported text stays text, and narrow layout fits', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const draft = structuredClone(STARTER_DRAFT);
  draft.title = '</h2><img src="https://example.invalid/attack" onerror="alert(1)">';
  draft.settings = '{"rules":{}}';
  await page.getByLabel(m.load).setInputFiles({
    name: 'own.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(draft)),
  });
  await expect(page.getByRole('status')).toHaveText(m.loaded);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.getByRole('heading', { name: draft.title, exact: true })).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
  await expect(page.locator('.empty')).toHaveText(REPORT_MESSAGES['de-DE'].noRules);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
