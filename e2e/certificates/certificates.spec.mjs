import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCertificateServer } from '../../tools/certificates/server.mjs';
import { fixtureAnswers } from '../../tools/certificates/test-fixture.mjs';
import { certificateTranslator } from '../../packages/i18n/src/certificate-draft.ts';

for (const locale of ['de', 'en-US', 'en-GB']) {
  test(`${locale}: exam, reload, audio, server result, sample PDF, verification and revocation`, async ({
    page,
  }, info) => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-browser-')),
      database = join(dir, 'test.sqlite');
    const app = await createCertificateServer({ database });
    const t = certificateTranslator(locale);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(app.origin);
      await page.getByRole('combobox').selectOption(locale);
      await expect(page.getByRole('heading', { name: t('title') })).toBeVisible();
      await expect(page.getByText(t('policy'))).toBeVisible();
      await page
        .getByRole('button', { name: t('start'), exact: true })
        .nth(locale === 'en-GB' ? 1 : 0)
        .click();
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
      ).toBeVisible();
      const id = new URL(page.url()).hash.slice(1),
        answers = fixtureAnswers(database, id);
      for (let index = 0; index < 12; index++) {
        await expect(
          page.getByRole('heading', { name: t('progress', { current: index + 1, total: 12 }) }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: t('answer'), exact: true })).toBeDisabled();
        if (index === 2) {
          await page.reload();
          await expect(
            page.getByRole('heading', { name: t('progress', { current: 3, total: 12 }) }),
          ).toBeVisible();
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        }
        if (index === 8) {
          await expect(page.locator('.score')).toHaveCount(0);
          await page.getByRole('button', { name: t('play'), exact: true }).click();
          await page.getByRole('button', { name: t('stop'), exact: true }).click();
          await page.getByRole('button', { name: t('home'), exact: true }).click();
          await page.getByRole('button', { name: t('resume'), exact: true }).click();
          await expect(
            page.getByRole('heading', { name: t('progress', { current: 9, total: 12 }) }),
          ).toBeVisible();
        }
        const input = page.locator('input[type=radio]').filter({ visible: true });
        const position = await input.evaluateAll(
          (radios, right) => radios.findIndex((r) => r.value === right),
          answers[index].right,
        );
        await input.nth(position).check();
        await page.getByRole('button', { name: t('answer'), exact: true }).click();
      }
      await expect(page.getByRole('heading', { name: t('result') })).toBeVisible();
      await expect(
        page.getByText(t('points', { points: 60, maximum: 60 }), { exact: true }),
      ).toBeVisible();
      const code = await page.locator('code').innerText();
      expect(code).toMatch(/^DRAFT-[A-F0-9]{32}$/);
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: t('download'), exact: true }).click();
      const download = await downloadEvent;
      await download.saveAs(info.outputPath(`sample-${locale}.pdf`));
      expect(download.suggestedFilename()).toBe('harmonia-DRAFT-INVALID.pdf');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: t('home'), exact: true }).click();
      await page.getByLabel(t('code'), { exact: true }).fill(code);
      await page.getByRole('button', { name: t('verify'), exact: true }).click();
      await expect(
        page.getByText(t('verified', { stage: locale === 'en-GB' ? 2 : 1 }), { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: t('resume'), exact: true }).click();
      await page.getByRole('button', { name: t('revoke'), exact: true }).click();
      await expect(page.getByText(t('revoked'), { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: t('download'), exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: t('home'), exact: true }).click();
      await page.getByLabel(t('code'), { exact: true }).fill(code);
      await page.getByRole('button', { name: t('verify'), exact: true }).click();
      await expect(page.getByText(t('revoked'), { exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: t('erase'), exact: true }).click();
      await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('lost response retries one answer; a late answer cannot create a sample', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-timeout-')),
    database = join(dir, 'test.sqlite');
  let instant = Date.UTC(2026, 9, 23, 12);
  const app = await createCertificateServer({ database, now: () => instant });
  const t = certificateTranslator('de');
  try {
    await page.goto(app.origin);
    await page
      .getByRole('button', { name: t('start'), exact: true })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
    ).toBeVisible();
    const answers = fixtureAnswers(database, new URL(page.url()).hash.slice(1));
    const right = page.locator('input[type=radio]').filter({ visible: true });
    const index = await right.evaluateAll(
      (rows, value) => rows.findIndex((r) => r.value === value),
      answers[0].right,
    );
    await right.nth(index).check();
    await page.route(
      '**/api/answer',
      async (route) => {
        await route.fetch();
        await route.abort('failed');
      },
      { times: 1 },
    );
    await page.getByRole('button', { name: t('answer'), exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(t('error'));
    await page.getByRole('button', { name: t('answer'), exact: true }).click();
    await expect(
      page.getByRole('heading', { name: t('progress', { current: 2, total: 12 }) }),
    ).toBeVisible();
    instant += 20 * 60_000;
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: t('answer'), exact: true }).click();
    await expect(page.getByText(t('timeout'), { exact: true })).toBeVisible();
    await expect(
      page.getByText(t('points', { points: 5, maximum: 60 }), { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: t('download'), exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(t('notQualified'), { exact: true })).toBeVisible();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
