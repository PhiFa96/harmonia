import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCertificateTestServer } from '../../tools/certificates/test-fixture.mjs';
import { SESSION_IDLE_MS } from '../../tools/certificates/sessions.mjs';
import { certificateTranslator } from '../../packages/i18n/src/certificate-draft.ts';
import { readInventory, inspectInventory } from '../../tools/ai-act/model.mjs';
import { reviewHtml } from '../../tools/ai-act/report.mjs';
import { AI_REVIEW_MESSAGES } from '../../packages/i18n/src/ai-act-review.ts';

async function startExam(page, t, index = 0) {
  await page
    .getByRole('button', { name: t('start'), exact: true })
    .nth(index)
    .click();
  await page.getByRole('button', { name: t('payAndStart'), exact: true }).click();
  await expect(
    page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
  ).toBeVisible();
}

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: test checkout, lost payment response, export, refund, deletion and logout`, async ({
    page,
  }, info) => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-complete-web-'));
    const app = await createCertificateTestServer({ database: join(dir, 'test.sqlite') });
    const t = certificateTranslator(locale),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(app.origin);
      await page.getByRole('combobox').selectOption(locale);
      await page
        .getByRole('button', { name: t('start'), exact: true })
        .first()
        .click();
      await expect(page.getByRole('heading', { name: t('purchaseTitle') })).toBeVisible();
      await expect(page.getByText(t('purchaseNotice'), { exact: true })).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: t('cancelPurchase'), exact: true }).click();
      await expect(page.getByText(t('paymentCancelled'), { exact: true })).toBeVisible();
      await page.getByRole('button', { name: t('home'), exact: true }).click();
      await page
        .getByRole('button', { name: t('start'), exact: true })
        .first()
        .click();
      await page.route(
        '**/api/simulation/settle',
        async (route) => {
          await route.fetch();
          await route.abort('failed');
        },
        { times: 1 },
      );
      await page.getByRole('button', { name: t('payAndStart'), exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(t('error'));
      await page.getByRole('button', { name: t('payAndStart'), exact: true }).click();
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
      ).toBeVisible();
      const id = new URL(page.url()).hash.slice(1);
      await page.getByRole('radio').first().check();
      await page.getByRole('button', { name: t('answer'), exact: true }).click();
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 2, total: 12 }) }),
      ).toBeVisible();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: t('exportData'), exact: true }).click();
      const download = await downloadEvent,
        path = info.outputPath('own-test-data.json');
      await download.saveAs(path);
      const data = JSON.parse(readFileSync(path, 'utf8'));
      expect(data.attempts.map((a) => a.id)).toEqual([id]);
      expect(data.attempts[0].answers).toHaveLength(1);
      expect(data.attempts[0].result).toBeNull();
      expect(data.purchases).toHaveLength(2);
      expect(JSON.stringify(data)).not.toMatch(/"seed"|correctAnswer|"owner"/);
      await page.getByRole('combobox').selectOption(locale === 'de' ? 'en-US' : 'de');
      await page.getByRole('combobox').selectOption(locale);
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 2, total: 12 }) }),
      ).toBeVisible();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: t('refund'), exact: true }).click();
      await expect(page.getByRole('heading', { name: t('paymentRefunded') })).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: t('remove'), exact: true }).click();
      await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(0);
      await startExam(page, t);
      await expect(page.getByRole('radio').first()).toBeVisible();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: t('logout'), exact: true }).click();
      await expect(page.getByRole('heading', { name: t('sessionEnded') })).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(page.getByRole('button', { name: t('exportData'), exact: true })).toHaveCount(0);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath(`complete-${locale}.png`) });
      await page.getByRole('button', { name: t('newSession'), exact: true }).click();
      await expect(page.getByRole('heading', { name: t('history') })).toBeVisible();
      await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

test('a stale receipt is isolated, can be deleted on its own, and does not hide a current exam', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-isolated-web-')),
    database = join(dir, 'test.sqlite');
  const app = await createCertificateTestServer({ database }),
    t = certificateTranslator('de');
  try {
    await page.goto(app.origin);
    await startExam(page, t);
    const old = new URL(page.url()).hash.slice(1);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: t('submit'), exact: true }).click();
    await page.getByRole('button', { name: t('home'), exact: true }).click();
    await startExam(page, t, 1);
    const current = new URL(page.url()).hash.slice(1),
      db = new DatabaseSync(database);
    db.prepare('update certificate_drafts set fingerprint=? where id=?').run('old', old);
    db.close();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
    ).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#' + current);
    await page.goto(app.origin + '/#' + old);
    await expect(page.getByRole('heading', { name: t('outdatedTitle') })).toBeVisible();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: t('remove'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: t('resume'), exact: true }).click();
    expect(new URL(page.url()).hash).toBe('#' + current);
    await expect(page.getByRole('radio').first()).toBeVisible();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an expired session clears private questions and permits a fresh isolated test session', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-expiry-web-'));
  let instant = Date.UTC(2026, 10, 2, 12);
  const app = await createCertificateTestServer({
      database: join(dir, 'test.sqlite'),
      now: () => instant,
    }),
    t = certificateTranslator('de');
  try {
    await page.goto(app.origin);
    await startExam(page, t);
    await expect(page.getByRole('radio').first()).toBeVisible();
    instant += SESSION_IDLE_MS;
    await page.getByRole('button', { name: t('home'), exact: true }).click();
    await expect(page.getByRole('heading', { name: t('sessionEnded') })).toBeVisible();
    await expect(page.getByText(t('sessionExpired'), { exact: true })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await page.getByRole('button', { name: t('newSession'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(0);
    await startExam(page, t);
    await expect(page.getByRole('radio').first()).toBeVisible();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: AI review handoff shows separate blocked scopes, private evidence and accessible offline reports`, async ({
    page,
  }, info) => {
    const data = readInventory(),
      html = reviewHtml(data, inspectInventory(data), locale),
      t = AI_REVIEW_MESSAGES[locale],
      external = [];
    page.on('request', (r) => {
      if (/^https?:/.test(r.url())) external.push(r.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(html);
    await expect(page.getByRole('heading', { name: t.title })).toBeVisible();
    for (const scope of ['general', 'school', 'certificates'])
      await expect(page.getByRole('heading', { name: t[scope], exact: true })).toBeVisible();
    await expect(page.getByText(t.documentMissing, { exact: true })).toHaveCount(3);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`ai-review-${locale}.png`) });
    expect(external).toEqual([]);
  });
