import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
import { RESOURCES } from '../../packages/i18n/src/resources.ts';
import { historyJourneyMessages } from '../../packages/i18n/src/history-journey-draft.ts';
import { historyStops } from '../../packages/content/src/history-journey-draft.ts';
import { createHistoryJourneyText } from '../../packages/i18n/src/history-journey-text.ts';

const production = process.env.HARMONIA_QA_VARIANT === 'production';

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  const language = locale === 'de-DE' ? 'de' : locale;
  const resources = RESOURCES[language].translation;
  const ui = resources.historyJourney ?? RESOURCES['en-US'].translation.historyJourney;
  const articleUi = resources.article ?? RESOURCES['en-US'].translation.article;
  const text = createHistoryJourneyText(language, historyJourneyMessages);
  const storyCopy = Object.fromEntries(historyStops.map((stop) => [stop.id, text(stop.id)]));

  if (production) {
    test(`${locale}: history journey has no published stops`, async ({ browser }) => {
      const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
      const page = await context.newPage();
      try {
        await onboard(page, locale);
        await page.goto('/history-journey');
        await expect(page.getByText(ui.unavailable, { exact: true })).toBeVisible();
        for (const stop of historyStops)
          await expect(
            page.getByRole('button', { name: storyCopy[stop.id].title, exact: true }),
          ).toHaveCount(0);
        await expect(page.getByRole('button', { name: ui.play, exact: true })).toHaveCount(0);
        await audit(page);
        await noOverflow(page);
      } finally {
        await context.close();
      }
    });
  } else
    for (const stop of historyStops) {
      test(`${locale}: ${stop.id} completes the sourced internal journey with staged hints`, async ({
        browser,
      }, testInfo) => {
        const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const story = storyCopy[stop.id];
        const button = (name) => page.getByRole('button', { name, exact: true });
        try {
          await onboard(page, locale);
          await page.goto('/history-journey');
          await expect(page.getByText(ui.draft, { exact: true })).toBeVisible();
          await button(story.title).click();
          await expect(page.getByText(story.scene, { exact: true })).toBeVisible();
          await expect(page.getByText(story.modelCaption, { exact: true })).toBeVisible();
          await button(ui.source).click();
          await expect(page.getByText(articleUi.draft, { exact: true })).toBeVisible();
          const source = new URL(page.url()).searchParams;
          expect(source.get('articleId')).toBe(stop.source.articleId);
          expect(source.get('version')).toBe('30');
          expect(source.get('locale')).toBe(language);
          expect(source.get('section')).toBe(String(stop.source.section));
          expect(source.get('digest')).toMatch(/^[a-f0-9]{64}$/);
          await expect(page.getByText(articleUi.citedSection, { exact: true })).toBeVisible();
          await button(articleUi.back).click();
          await expect(page.getByText(story.scene, { exact: true })).toBeVisible();
          await button(ui.next).click();
          await expect(page.getByText(ui.fictional, { exact: true })).toBeVisible();
          await expect(page.getByTestId('history-interview-reply')).toHaveCount(0);
          await expect(button(ui.next)).toBeDisabled();
          for (let index = 0; index < 3; index++) {
            await button(story.personaPrompts[index]).click();
            await expect(button(story.personaPrompts[index])).toHaveAttribute(
              'aria-pressed',
              'true',
            );
            await expect(page.getByTestId('history-interview-reply')).toHaveText(
              story.personaReplies[index],
            );
            await expect(button(ui.next)).toBeEnabled();
          }
          await audit(page);
          await noOverflow(page);
          await button(ui.back).click();
          await button(ui.next).click();
          await expect(page.getByTestId('history-interview-reply')).toHaveCount(0);
          await expect(button(ui.next)).toBeDisabled();
          await button(story.personaPrompts[0]).click();
          await button(ui.next).click();

          for (const kind of ['knowledge', 'listening']) {
            const answer = kind === 'knowledge' ? stop.knowledgeAnswer : stop.listeningAnswer;
            const options = story[`${kind}Options`];
            const hints = story[`${kind}Hints`];
            const explanation = story[`${kind}Explanation`];
            const wrong = options.filter((_, index) => index !== answer);
            await expect(page.getByTestId('history-hints')).toHaveCount(0);
            await expect(page.getByText(explanation, { exact: false })).toHaveCount(0);
            await button(wrong[0]).click();
            if (kind === 'listening') {
              await expect(button(ui.check)).toBeDisabled();
              await button(ui.play).click();
            }
            await expect(button(ui.check)).toBeEnabled();
            await button(ui.check).click();
            await expect(page.getByText(hints[0], { exact: true })).toBeVisible();
            await expect(page.getByText(hints[1], { exact: true })).toHaveCount(0);
            await expect(button(ui.check)).toBeDisabled();
            await expect(button(ui.next)).toBeDisabled();
            if (kind === 'knowledge') {
              // More support must not require deliberately submitting another wrong answer.
              await button(ui.moreHint).click();
              await expect(page.getByText(hints[1], { exact: true })).toBeVisible();
            }
            await button(wrong[1]).click();
            await button(ui.check).click();
            await expect(page.getByText(hints[0], { exact: true })).toBeVisible();
            await expect(page.getByText(hints[1], { exact: true })).toBeVisible();
            await expect(button(ui.moreHint)).toHaveCount(0);
            await expect(page.getByText(explanation, { exact: false })).toHaveCount(0);
            await expect(page.getByText(/\$t\(|glossary:/)).toHaveCount(0);
            if (kind === 'knowledge') {
              await audit(page);
              await noOverflow(page);
              if (stop.id === 'classical')
                await page.screenshot({
                  path: testInfo.outputPath('specific-hints.png'),
                  fullPage: true,
                });
            }
            await button(options[answer]).click();
            await button(ui.check).click();
            await expect(
              page.getByText(`${ui.correct} ${explanation}`, { exact: true }),
            ).toBeVisible();
            await expect(page.getByTestId('history-hints')).toHaveCount(0);
            for (const option of options) await expect(button(option)).toBeDisabled();
            await button(ui.next).click();
          }
          await expect(page.getByText(ui.complete, { exact: true })).toBeVisible();
          await button(ui.back).click();
          await expect(page.getByTestId('history-hints')).toHaveCount(0);
          await expect(page.getByText(story.listeningExplanation, { exact: false })).toHaveCount(0);
          await button(story.listeningOptions[stop.listeningAnswer]).click();
          await expect(button(ui.check)).toBeDisabled();
          await button(ui.skipListening).click();
          await expect(page.getByText(ui.complete, { exact: true })).toBeVisible();
          await button(ui.finish).click();
          await button(story.title).click();
          await expect(page.getByText(story.scene, { exact: true })).toBeVisible();
          await noOverflow(page);
          expect(errors).toEqual([]);
        } finally {
          await context.close();
        }
      });
    }
}
