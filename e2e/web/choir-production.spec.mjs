import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
import { createI18n } from '../../packages/i18n/src/index.ts';

test.skip(
  process.env.HARMONIA_QA_VARIANT !== 'production',
  'Requires the public production export',
);

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: public choir deep link exposes no draft lessons or introduction`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    const labels = createI18n(locale.startsWith('de') ? 'de' : locale);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await onboard(page, locale);
      await page.goto('/choir');
      await expect(page.getByText(labels.t('learn.unavailable'), { exact: true })).toBeVisible();
      await expect(page.getByTestId(/^choir-start-/)).toHaveCount(0);
      await expect(page.getByTestId('lesson-example-scroll')).toHaveCount(0);
      await expect(page.getByTestId('choir-trainer')).toHaveCount(0);
      await audit(page);
      await noOverflow(page);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
