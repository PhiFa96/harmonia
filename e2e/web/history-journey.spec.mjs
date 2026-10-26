import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
import { RESOURCES } from '../../packages/i18n/src/resources.ts';
import { historyJourneyMessages } from '../../packages/i18n/src/history-journey-draft.ts';
import { historyStops } from '../../packages/content/src/history-journey-draft.ts';
import { createHistoryJourneyText } from '../../packages/i18n/src/history-journey-text.ts';

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
    const text = createHistoryJourneyText(language, historyJourneyMessages);
    const copy = Object.fromEntries(historyStops.map((stop) => [stop.id, text(stop.id)]));
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
        if (locale === 'en-GB') {
          await page.getByRole('button', { name: copy.baroque.title, exact: true }).click();
          await expect(page.getByText(copy.baroque.scene, { exact: true })).toBeVisible();
          await page.getByRole('button', { name: ui.back, exact: true }).click();
        }
        await page.getByRole('button', { name: copy.medieval.title, exact: true }).click();
        await expect(page.getByText(copy.medieval.scene, { exact: true })).toBeVisible();
        await expect(page.getByText(/\$t\(|glossary:/)).toHaveCount(0);
        await expect(
          page.getByText(
            language === 'de'
              ? /Klangmodell veranschaulicht Einstimmigkeit/
              : /sound model illustrates monophony/,
          ),
        ).toBeVisible();
        await expect(page.getByText(copy.medieval.modelCaption, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await expect(page.getByText(ui.fictional, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await page
          .getByRole('button', { name: copy.medieval.knowledgeOptions[0], exact: true })
          .click();
        await page.getByRole('button', { name: ui.check, exact: true }).click();
        await expect(
          page.getByText(`${ui.incorrect} ${copy.medieval.knowledgeHint}`, { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(copy.medieval.knowledgeExplanation, { exact: false }),
        ).toHaveCount(0);
        await expect(page.getByRole('button', { name: ui.next, exact: true })).toBeDisabled();
        await expect(page.getByRole('button', { name: ui.check, exact: true })).toBeDisabled();
        await page
          .getByRole('button', { name: copy.medieval.knowledgeOptions[1], exact: true })
          .click();
        await page.getByRole('button', { name: ui.check, exact: true }).click();
        await expect(
          page.getByText(`${ui.correct} ${copy.medieval.knowledgeExplanation}`, { exact: true }),
        ).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
        await page
          .getByRole('button', { name: copy.medieval.listeningOptions[1], exact: true })
          .click();
        await expect(page.getByRole('button', { name: ui.check, exact: true })).toBeDisabled();
        await page.getByRole('button', { name: ui.play, exact: true }).click();
        await expect(page.getByRole('button', { name: ui.check, exact: true })).toBeEnabled();
        await page.getByRole('button', { name: ui.check, exact: true }).click();
        await expect(
          page.getByText(`${ui.incorrect} ${copy.medieval.listeningHint}`, { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(copy.medieval.listeningExplanation, { exact: false }),
        ).toHaveCount(0);
        await expect(page.getByRole('button', { name: ui.next, exact: true })).toBeDisabled();
        await page
          .getByRole('button', { name: copy.medieval.listeningOptions[0], exact: true })
          .click();
        await page.getByRole('button', { name: ui.check, exact: true }).click();
        await expect(
          page.getByText(`${ui.correct} ${copy.medieval.listeningExplanation}`, { exact: true }),
        ).toBeVisible();
        await page.getByRole('button', { name: ui.next, exact: true }).click();
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
