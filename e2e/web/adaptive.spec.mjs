import { test, expect } from '@playwright/test';
import { audit, noOverflow, onboard, startLesson, copy } from './helpers.mjs';

async function visibleStaffSignature(page) {
  return page
    .locator('svg:visible text')
    .evaluateAll((nodes) =>
      nodes.map((node) => [node.textContent, node.getAttribute('x'), node.getAttribute('y')]),
    );
}

// Read the visible staff, like a learner. No seed/answer state or test hook in the app.
async function answerVisibleNaturalNote(page, locale) {
  await page.getByTestId('exercise-question').waitFor();
  const name = await page.locator('svg:visible').evaluateAll((svgs) => {
    const svg = svgs.find((node) =>
      [...node.querySelectorAll('text')].some((text) =>
        ['\uE0A2', '\uE0A3', '\uE0A4'].includes(text.textContent),
      ),
    );
    if (!svg) throw new Error('Visible note missing');
    const head = [...svg.querySelectorAll('text')].find((text) =>
      ['\uE0A2', '\uE0A3', '\uE0A4'].includes(text.textContent),
    );
    const ys = [
      ...new Set(
        [...svg.querySelectorAll('line')]
          .filter(
            (line) =>
              line.getAttribute('y1') === line.getAttribute('y2') &&
              Number(line.getAttribute('x2')) - Number(line.getAttribute('x1')) > 100,
          )
          .map((line) => Number(line.getAttribute('y1'))),
      ),
    ].sort((a, b) => a - b);
    if (ys.length !== 5) throw new Error('Expected five visible staff lines');
    const steps = Math.round((ys[4] - Number(head.getAttribute('y'))) / ((ys[1] - ys[0]) / 2));
    if (steps < 0 || steps > 8) throw new Error('Expected an in-staff treble note');
    return ['E', 'F', 'G', 'A', 'B', 'C', 'D'][steps % 7];
  });
  await page.getByTestId('answer-' + name + ':0').click();
  await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
  await page.getByTestId('exercise-next').click();
}

for (const scenario of [
  { locale: 'de-DE', width: 375, colorScheme: 'light' },
  { locale: 'en-US', width: 1280, colorScheme: 'light' },
  { locale: 'en-GB', width: 375, colorScheme: 'dark', reducedMotion: 'reduce' },
])
  test(
    scenario.locale + ' focused practice from real guest evidence, reload and accessibility',
    async ({ browser }, testInfo) => {
      const { width, ...options } = scenario;
      const context = await browser.newContext({ ...options, viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const de = scenario.locale.startsWith('de');
      const title = de
        ? 'Schwächen trainieren'
        : scenario.locale === 'en-GB'
          ? 'Practise weak skills'
          : 'Practice weak skills';
      const start = de ? 'Gezielt üben' : 'Start focused practice';
      try {
        await onboard(page, scenario.locale);
        await page.goto('/practice');
        await expect(page.getByRole('button', { name: start, exact: true })).toBeDisabled();
        await page.goto('/lesson?id=notation.l1.staff.anchor');
        await page
          .getByRole('button', { name: copy(scenario.locale).intro, exact: true })
          .or(
            page.getByRole('button', {
              name: de ? /^Mit \d+ Aufgaben? starten$/ : /^Start \d+ (questions|question)$/,
            }),
          )
          .first()
          .waitFor();
        await startLesson(page, scenario.locale);
        for (let i = 0; i < 8; i++) await answerVisibleNaturalNote(page, scenario.locale);
        await expect(
          page.getByRole('heading', {
            name: de ? 'Lektion beendet' : 'Lesson finished',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByText(
            de ? 'Ergebnis auf diesem Gerät gespeichert.' : 'Result saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        await page.goto('/practice');
        await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: start, exact: true })).toBeEnabled();
        await audit(page);
        await noOverflow(page);
        await page.screenshot({ path: testInfo.outputPath('weakness-entry.png'), fullPage: true });
        await page.getByRole('button', { name: start, exact: true }).click();
        await page
          .getByRole('button', {
            name: de ? 'Mit 10 Aufgaben starten' : 'Start 10 questions',
            exact: true,
          })
          .click();
        await answerVisibleNaturalNote(page, scenario.locale);
        const question = await page.getByTestId('exercise-question').textContent();
        const staff = await visibleStaffSignature(page);
        await expect(
          page.getByText(
            de
              ? 'Dein aktueller Stand ist auf diesem Gerät gespeichert.'
              : 'Your current progress is saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        await page.reload();
        await page.getByRole('button', { name: copy(scenario.locale).resume, exact: true }).click();
        await expect(page.getByTestId('exercise-question')).toHaveText(question);
        expect(await visibleStaffSignature(page)).toEqual(staff);
        await audit(page);
        for (let i = 1; i < 10; i++) await answerVisibleNaturalNote(page, scenario.locale);
        await expect(
          page.getByRole('heading', {
            name: de ? 'Übungssatz beendet' : 'Practice set complete',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByText(/^\d+ XP$/)).toHaveCount(0);
        await audit(page);
        await noOverflow(page);
        await page.screenshot({ path: testInfo.outputPath('weakness-result.png'), fullPage: true });
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );
