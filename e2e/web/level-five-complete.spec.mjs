import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { onboard, startLesson, audit, noOverflow, copy } from './helpers.mjs';
import { createI18n } from '../../packages/i18n/src/index.ts';

const authored = JSON.parse(
  readFileSync(new URL('../../packages/i18n/src/authored-content.json', import.meta.url), 'utf8'),
);
const messages = JSON.parse(
  readFileSync(
    new URL('../../packages/i18n/src/messages/level-five-exercise.json', import.meta.url),
    'utf8',
  ),
);
for (const locale of ['de-DE', 'en-US', 'en-GB'])
  test(`${locale} complete Stage 5: named parts, spectral example and saved evidence matching`, async ({
    browser,
  }, info) => {
    test.setTimeout(180000);
    const language = locale.startsWith('de') ? 'de' : locale,
      de = language === 'de',
      text = createI18n(language);
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } }),
      page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const saved = () =>
      expect(page.getByText(messages[language].levelFiveSaved, { exact: true })).toBeVisible();
    const discard = async () => {
      await page.goto('/level-five');
      await expect(page.getByTestId('level-five-resume')).toBeVisible();
      await page
        .getByRole('button', { name: messages[language].levelFiveDiscard, exact: true })
        .click();
      await expect(page.getByTestId('level-five-resume')).toHaveCount(0);
    };
    const answerFirst = async () => {
      await page
        .getByTestId(/^answer-/)
        .first()
        .click();
      await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
      await page.getByTestId('exercise-next').click();
      await saved();
    };
    try {
      await onboard(page, locale);
      await page.goto('/level-five');
      await expect(page.getByTestId(/^level-five-open-/)).toHaveCount(24);
      await page.getByTestId('level-five-open-counterpoint.l5.species.lesson1').click();
      await expect(
        page.getByText(
          de
            ? /^Oben: Gegenstimme; unten: Cantus firmus\./
            : /^Upper staff: counterpoint; lower staff: cantus firmus\./,
        ),
      ).toBeVisible();
      await audit(page);
      await noOverflow(page);
      await page.screenshot({
        path: info.outputPath('counterpoint-introduction.png'),
        fullPage: true,
      });
      await startLesson(page, locale);
      for (let n = 0; n < 4; n++) await answerFirst();
      const question = page.getByTestId('context-question');
      await expect(
        question.getByText(messages[language].counterpointParts, { exact: true }),
      ).toBeVisible();
      const description = await question.getByRole('img').getAttribute('aria-label');
      expect(description).toContain(de ? 'System 1:' : 'Staff 1:');
      expect(description).toContain(de ? 'System 2:' : 'Staff 2:');
      await audit(page);
      await noOverflow(page);
      await page.screenshot({ path: info.outputPath('counterpoint-parts.png'), fullPage: true });
      await discard();
      await page.getByTestId('level-five-open-contemporary.l5.process.lesson3').click();
      for (let n = 0; n < 3; n++)
        await page.getByRole('button', { name: copy(locale).intro, exact: true }).click();
      await expect(
        page.getByText(authored[language].levelFive.units.processStudy.spectralModelTitle, {
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole('button', { name: text.t('lesson.example'), exact: true }).click();
      await page.getByRole('button', { name: text.t('exercise.stop'), exact: true }).click();
      await audit(page);
      await noOverflow(page);
      await page.screenshot({ path: info.outputPath('spectral-model.png'), fullPage: true });
      await discard();
      await page.getByTestId('level-five-open-world.l5.context.lesson3').click();
      await expect(
        page.getByRole('button', { name: copy(locale).intro, exact: true }),
      ).toBeVisible();
      await startLesson(page, locale);
      for (let n = 0; n < 4; n++) await answerFirst();
      await expect(page.getByTestId(/^match-term-/)).toHaveCount(3);
      await page.getByTestId('match-term-0').click();
      await page
        .getByTestId(/^answer-/)
        .first()
        .click();
      await saved();
      const selected = await page.getByTestId('match-term-0').getAttribute('aria-label');
      expect(selected).toBeTruthy();
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await page.reload();
      await page
        .getByRole('button', { name: messages[language].levelFiveResume, exact: true })
        .click();
      await expect(page.getByTestId('match-term-0')).toHaveAttribute('aria-label', selected);
      await expect(page.getByTestId('match-term-0')).toHaveAttribute('aria-checked', 'true');
      await audit(page);
      await noOverflow(page);
      await page.goto('/privacy');
      const downloading = page.waitForEvent('download');
      await page
        .getByRole('button', { name: de ? 'Daten herunterladen' : 'Download data', exact: true })
        .click();
      const stream = await (await downloading).createReadStream(),
        chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const exported = JSON.parse(Buffer.concat(chunks).toString()),
        preview = exported.sections.local.levelFivePreview;
      expect(preview.lessonId).toBe('world.l5.context.lesson3');
      expect(preview.engineVersion).toBe(2);
      expect(preview.catalogueVersion).toBe(31);
      expect(preview.answer).toBeTruthy();
      expect(
        exported.sections.local.learning.filter((row) => row.event.kind === 'lesson'),
      ).toHaveLength(0);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
