import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
import { RESOURCES } from '../../packages/i18n/src/resources.ts';
import { historyJourneyMessages } from '../../packages/i18n/src/history-journey-draft.ts';
import { historyStops } from '../../packages/content/src/history-journey-draft.ts';

const production = process.env.HARMONIA_QA_VARIANT === 'production';

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: history journey ${production ? 'has no published stops' : 'keeps the internal draft playable'}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const language = locale === 'de-DE' ? 'de' : locale;
    const ui =
      RESOURCES[language].translation.historyJourney ??
      RESOURCES['en-US'].translation.historyJourney;
    const copy = historyJourneyMessages[language];
    try {
      await onboard(page, locale);
      await page.goto('/history-journey');
      if (production) {
        await expect(page.getByText(ui.unavailable, { exact: true })).toBeVisible();
        for (const stop of historyStops)
          await expect(
            page.getByRole('button', { name: copy[stop.id].title, exact: true }),
          ).toHaveCount(0);
        await expect(page.getByRole('button', { name: ui.play, exact: true })).toHaveCount(0);
      } else {
        for (const stop of historyStops)
          await expect(
            page.getByRole('button', { name: copy[stop.id].title, exact: true }),
          ).toBeVisible();
        await expect(page.getByText(ui.draft, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: copy.medieval.title, exact: true }).click();
        await expect(page.getByText(copy.medieval.scene, { exact: true })).toBeVisible();
        await expect(page.getByText(copy.medieval.modelCaption, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await expect(page.getByText(ui.fictional, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await page
          .getByRole('button', { name: copy.medieval.knowledgeOptions[1], exact: true })
          .click();
        await page.getByRole('button', { name: ui.check, exact: true }).click();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await page
          .getByRole('button', { name: copy.medieval.listeningOptions[0], exact: true })
          .click();
        await expect(page.getByRole('button', { name: ui.check, exact: true })).toBeDisabled();
        await page.getByRole('button', { name: ui.skipListening, exact: true }).click();
        await expect(page.getByText(ui.complete, { exact: true })).toBeVisible();
      }
      await audit(page);
      await noOverflow(page);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
