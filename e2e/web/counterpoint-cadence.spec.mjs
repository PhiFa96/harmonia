import { test, expect } from '@playwright/test';
import { onboard, startLesson, audit, noOverflow, copy } from './helpers.mjs';
import { createI18n } from '../../packages/i18n/src/index.ts';

for (const locale of ['de-DE', 'en-US', 'en-GB'])
  test(`${locale}: counterpoint closing conventions stay distinct through check, reload and resume`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } }),
      page = await context.newPage(),
      labels = createI18n(locale.startsWith('de') ? 'de' : locale),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await onboard(page, locale);
      await page.goto('/level-five');
      await page.getByTestId('level-five-open-counterpoint.l5.species.lesson3').click();
      await expect(
        page.getByRole('button', { name: copy(locale).intro, exact: true }),
      ).toBeVisible();
      await startLesson(page, locale);
      // The lesson's four knowledge questions precede its eight source-based checks.
      for (let i = 0; i < 4; i++) {
        await page
          .getByTestId(/^answer-/)
          .first()
          .click();
        await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
        await page.getByTestId('exercise-next').click();
      }
      const question = page.getByTestId('context-question');
      await expect(question).toContainText(labels.t('exercise.counterpointCantusScope'));
      await expect(page.getByText(/Cantus: /)).toHaveCount(0);
      await expect(question.getByRole('img')).toHaveAttribute(
        'aria-label',
        locale.startsWith('de') ? /System 2:/ : /Staff 2:/,
      );
      await audit(page);
      await noOverflow(page);
      await page
        .getByTestId(/^answer-/)
        .first()
        .click();
      await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
      const explanation = page.getByText(/Cantus: /);
      await expect(explanation).toBeVisible();
      const text = await explanation.textContent();
      expect(text).toMatch(/Cantus:.+→/);
      expect(text).toMatch(/7→1|2→1|weder|neither/);
      expect(text).not.toMatch(/\$t\(|\{\{|undefined/);
      expect(text).toMatch(
        locale.startsWith('de')
          ? /Halbton|Ganzton/
          : locale === 'en-GB'
            ? /semitone|tone/
            : /half step|whole step/,
      );
      if (locale === 'en-GB') expect(text).not.toMatch(/half step|whole step/);
      await audit(page);
      await noOverflow(page);
      await page.reload();
      await page
        .getByRole('button', { name: labels.t('exercise.levelFiveResume'), exact: true })
        .click();
      await expect(page.getByText(/Cantus: /)).toHaveText(text);
      await page.getByText(/Cantus: /).scrollIntoViewIfNeeded();
      await expect(page.getByText(/Cantus: /)).toBeVisible();
      await expect(page.getByTestId('exercise-next')).toBeVisible();
      await audit(page);
      expect(errors).toEqual([]);
      await page.screenshot({ path: info.outputPath(`cantus-${locale}.png`), fullPage: true });
    } finally {
      await context.close();
    }
  });
