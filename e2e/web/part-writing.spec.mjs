import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow, copy } from './helpers.mjs';
import { generateVoiceLeading, createRng } from '../../packages/exercises/src/index.ts';

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale} internal SATB editor: keyboard, locked voice, undo, findings and accessibility`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      locale,
      viewport: { width: locale === 'en-US' ? 1280 : 390, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await onboard(page, locale);
      await page.goto('/part-writing');
      await page.getByTestId('satb-start-satz.l4.writing.bass.lesson').click();
      const editor = page.getByTestId('satb-editor');
      await expect(editor).toContainText(
        locale.startsWith('de') ? 'Interner Entwurf' : 'Internal draft',
      );
      await page.getByTestId('satb-voice-bass').click();
      await expect(page.getByTestId('satb-input-staff').getByRole('slider')).toHaveCount(0);
      const bass = await page.getByTestId('satb-bar-1').innerText();
      await page.getByTestId('satb-voice-soprano').click();
      const first = page.getByTestId('satb-input-staff').getByRole('slider').first();
      await expect(page.getByTestId('satb-input-staff').getByRole('slider')).toHaveCount(4);
      await first.focus();
      await page.keyboard.press('ArrowUp');
      await expect(editor).toContainText(locale.startsWith('de') ? '5 von 16' : '5 of 16');
      await editor
        .getByRole('button', { name: locale.startsWith('de') ? 'Rückgängig' : 'Undo', exact: true })
        .click();
      await expect(editor).toContainText(locale.startsWith('de') ? '4 von 16' : '4 of 16');
      await editor
        .getByRole('button', {
          name: locale.startsWith('de') ? 'Wiederholen' : 'Redo',
          exact: true,
        })
        .click();
      await expect(editor).toContainText(locale.startsWith('de') ? '5 von 16' : '5 of 16');
      await editor
        .getByRole('button', {
          name: locale.startsWith('de') ? 'Satz vorprüfen' : 'Check draft score',
          exact: true,
        })
        .click();
      await expect(page.getByTestId('satb-findings')).toContainText(
        locale.startsWith('de') ? 'Hier fehlt noch ein Ton' : 'A note is still missing',
      );
      await page.getByTestId('satb-findings').getByRole('button').first().click();
      await page.getByTestId('satb-voice-bass').click();
      await expect(page.getByTestId('satb-bar-1')).toHaveText(bass);
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await audit(page);
      await noOverflow(page);
      await page.screenshot({ path: info.outputPath('satb-draft.png'), fullPage: true });
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('stage 5 function tasks: complete three distinct keys and open the final tutor context', async ({
  page,
}) => {
  await onboard(page, 'de-DE');
  await page.goto('/part-writing');
  await page.getByTestId('satb-start-satz.l5.writing.functions.lesson').click();
  const step = (p) => p.octave * 7 + 'CDEFGAB'.indexOf(p.letter);
  for (const fifths of [0, -1, 1]) {
    await expect(page.getByTestId('exercise-question')).toContainText(
      fifths === -1 ? 'F-Dur' : fifths === 1 ? 'G-Dur' : 'C-Dur',
    );
    const item = generateVoiceLeading({ level: 5, mode: 'functions', fifths }, createRng('e2e'));
    const check = page.getByRole('button', { name: 'Prüfen', exact: true });
    await expect(check).toBeDisabled();
    await expect(page.getByTestId('satb-editor')).toContainText('0 von 16');
    for (const voice of ['soprano', 'alto', 'tenor', 'bass']) {
      await page.getByTestId(`satb-voice-${voice}`).click();
      for (let at = 0; at < 4; at++) {
        const target = item.example[at][voice];
        const delta = step(target) - (voice === 'bass' || voice === 'tenor' ? 3 : 4) * 7;
        const note = page.getByTestId('satb-input-staff').getByRole('slider').nth(at);
        await note.focus();
        if (delta === 0) {
          await page.keyboard.press('ArrowUp');
          await page.keyboard.press('ArrowDown');
        } else
          for (let n = 0; n < Math.abs(delta); n++)
            await page.keyboard.press(delta > 0 ? 'ArrowUp' : 'ArrowDown');
      }
    }
    await expect(check).toBeEnabled();
    await check.click();
    await expect(page.getByTestId('satb-findings')).toContainText(
      'Bedingungen dieses Entwurfsprofils sind erfüllt',
    );
    await expect(page.getByTestId('satb-editor')).toContainText('Eine mögliche Lösung');
    await expect(page.getByTestId('satb-input-staff').getByRole('slider')).toHaveCount(0);
    if (fifths !== 1) await page.getByRole('button', { name: 'Neue Aufgabe', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Warum? Mit KI erklären', exact: true }).click();
  await expect(page).toHaveURL(/tutor-task/);
});
