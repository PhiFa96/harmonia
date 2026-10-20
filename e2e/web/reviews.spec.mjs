import { test, expect } from '@playwright/test';
import { onboard, startLesson, copy, audit, noOverflow } from './helpers.mjs';
import { answerVisibleNaturalNote, visibleStaffSignature } from './natural-notes.mjs';
for (const scenario of [
  { locale: 'de-DE', width: 375, colorScheme: 'light' },
  { locale: 'en-US', width: 1280, colorScheme: 'light' },
  { locale: 'en-GB', width: 375, colorScheme: 'dark', reducedMotion: 'reduce' },
])
  test(
    scenario.locale + ' FSRS cards, due skills, reload and accessibility',
    async ({ browser }, testInfo) => {
      const { width, ...options } = scenario;
      const context = await browser.newContext({
        ...options,
        timezoneId: 'Europe/Berlin',
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const de = scenario.locale.startsWith('de');
      try {
        await page.clock.install();
        await onboard(page, scenario.locale);
        await page.goto('/lesson?id=notation.l1.staff.anchor');
        await page
          .getByRole('button', {
            name: new RegExp(
              de
                ? 'Nächste Einführungskarte|Mit 8 Aufgaben starten'
                : 'Next introduction card|Start 8 questions',
            ),
          })
          .first()
          .waitFor();
        await startLesson(page, scenario.locale);
        for (let n = 0; n < 8; n++) await answerVisibleNaturalNote(page, scenario.locale);
        await expect(
          page.getByText(
            de ? 'Ergebnis auf diesem Gerät gespeichert.' : 'Result saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        await page.goto('/review');
        const cards = page.getByRole('button', { name: de ? /^Karte öffnen:/ : /^Open card:/ });
        await cards.first().waitFor();
        const before = await cards.count();
        expect(before).toBeGreaterThan(0);
        await cards.first().click();
        const reveal = page.getByRole('button', {
          name: de ? 'Erklärung aufdecken' : 'Reveal explanation',
          exact: true,
        });
        await expect(reveal).toBeVisible();
        await expect(
          page.getByRole('button', { name: de ? 'Gewusst' : 'Remembered', exact: true }),
        ).toHaveCount(0);
        await reveal.click();
        await audit(page);
        await noOverflow(page);
        await page.screenshot({ path: testInfo.outputPath('review-card.png'), fullPage: true });
        // Looking at an explanation alone is not a review receipt.
        await page.reload();
        await reveal.click();
        await page
          .getByRole('button', { name: de ? 'Gewusst' : 'Remembered', exact: true })
          .click();
        await expect(
          page.getByText(de ? 'Wiederholung gespeichert.' : 'Review saved.', { exact: true }),
        ).toBeVisible();
        await page
          .getByRole('button', {
            name: de ? 'Zu den Wiederholungen' : 'Back to reviews',
            exact: true,
          })
          .click();
        await expect(cards).toHaveCount(before - 1);
        await page.clock.fastForward('11:00');
        await page
          .getByRole('button', {
            name: de ? 'Fähigkeiten wiederholen' : 'Review skills',
            exact: true,
          })
          .click();
        const start = page.getByRole('button', {
          name: de ? /^Mit \d+ Aufgaben starten$/ : /^Start \d+ questions$/,
        });
        const count = Number((await start.textContent()).match(/\d+/)[0]);
        await start.click();
        await answerVisibleNaturalNote(page, scenario.locale);
        if (count > 1) {
          await page.getByTestId('exercise-question').waitFor();
          const staff = await visibleStaffSignature(page);
          await page.reload();
          await page
            .getByRole('button', { name: copy(scenario.locale).resume, exact: true })
            .click();
          await page.getByTestId('exercise-question').waitFor();
          expect(await visibleStaffSignature(page)).toEqual(staff);
          for (let n = 1; n < count; n++) await answerVisibleNaturalNote(page, scenario.locale);
        }
        await expect(
          page.getByRole('heading', {
            name: de ? 'Übungssatz beendet' : 'Practice set complete',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByText(
            de ? 'Ergebnis auf diesem Gerät gespeichert.' : 'Result saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        await expect(page.getByText(/^\d+ XP$/)).toHaveCount(0);
        await audit(page);
        await noOverflow(page);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );
