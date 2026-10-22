import { test, expect } from '@playwright/test';
import { onboard, startLesson, audit, noOverflow, copy } from './helpers.mjs';
import {
  HISTORY_FACTS,
  knowledgeDefinition,
  knowledgeFactId,
} from '../../packages/exercises/src/index.ts';

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale} Stage 5 draft: cards, assessment, changed review, no saved progress`, async ({
    browser,
  }, info) => {
    test.setTimeout(180000);
    const context = await browser.newContext({
      locale,
      viewport: { width: locale === 'en-US' ? 1280 : 390, height: 900 },
    });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await onboard(page, locale);
      await page.goto('/practice');
      await page
        .getByRole('button', {
          name: locale.startsWith('de') ? 'Stufe-5-Entwurf öffnen' : 'Open the Stage 5 draft',
          exact: true,
        })
        .click();
      await expect(page.getByTestId(/^level-five-open-/)).toHaveCount(24);
      await expect(page.getByRole('note')).toBeVisible();
      await page.getByTestId('level-five-open-counterpoint.l5.species.lesson3').click();
      await audit(page);
      await noOverflow(page);
      await startLesson(page, locale);
      // Force a genuine error on the first recall task by reading its visible definition.
      const prompt = await page.getByTestId('exercise-question').innerText();
      const language = locale === 'de-DE' ? 'de' : locale;
      const kind = HISTORY_FACTS.speciesBasics.find((kind) =>
        prompt.includes(knowledgeDefinition({ topic: 'speciesBasics', kind }, language)),
      );
      expect(kind).toBeTruthy();
      const correctId = `answer-${knowledgeFactId({ topic: 'speciesBasics', kind })}`;
      const ids = await page
        .getByTestId(/^answer-/)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')));
      await page.getByTestId(ids.find((id) => id !== correctId)).click();
      await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
      await page.getByTestId('exercise-next').click();
      let reviewed = false,
        inspected = false;
      for (let n = 0; n < 30; n++) {
        if (await page.getByTestId('level-five-complete').count()) break;
        const review = page.getByRole('button', {
          name: locale.startsWith('de') ? 'Wiederholung starten' : 'Start review',
          exact: true,
        });
        if (await review.count()) {
          await review.click();
          reviewed = true;
          continue;
        }
        await page.getByTestId('exercise-question').waitFor();
        if (!inspected && (await page.getByTestId('context-question').count())) {
          await audit(page);
          await noOverflow(page);
          await page.screenshot({
            path: info.outputPath('counterpoint-draft.png'),
            fullPage: true,
          });
          inspected = true;
        }
        await page
          .getByTestId(/^answer-/)
          .first()
          .click();
        await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
        await page.getByTestId('exercise-next').click();
      }
      expect(reviewed).toBe(true);
      expect(inspected).toBe(true);
      await expect(page.getByTestId('level-five-complete')).toBeVisible();
      await audit(page);
      await page.reload();
      await expect(page.getByTestId(/^level-five-open-/)).toHaveCount(24);
      // Exercise a six-bar row comparison on the narrow layout, including scroll accessibility.
      await page.getByTestId('level-five-open-contemporary.l5.serial.lesson3').click();
      await startLesson(page, locale);
      for (let n = 0; n < 4; n++) {
        await page
          .getByTestId(/^answer-/)
          .first()
          .click();
        await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
        await page.getByTestId('exercise-next').click();
      }
      await expect(page.getByTestId('context-question')).toBeVisible();
      await expect(page.getByTestId('context-score-scroll')).toHaveAttribute('tabindex', '0');
      await audit(page);
      await noOverflow(page);
      await page.screenshot({ path: info.outputPath('row-analysis-draft.png'), fullPage: true });
      await page.goto('/privacy');
      const downloading = page.waitForEvent('download');
      await page
        .getByRole('button', {
          name: locale.startsWith('de') ? 'Daten herunterladen' : 'Download data',
          exact: true,
        })
        .click();
      const stream = await (await downloading).createReadStream(),
        chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const exported = JSON.parse(Buffer.concat(chunks).toString());
      expect(
        exported.sections.local.learning.filter((row) => row.event.kind === 'lesson'),
      ).toHaveLength(0);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
