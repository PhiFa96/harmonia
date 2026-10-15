import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
test('a stray OAuth callback removes its query and offers a safe return', async ({ page }) => {
  await page.goto(
    '/auth/callback?attempt=70000000-0000-4000-8000-000000000001&code=synthetic-unmatched-code',
  );
  await expect(
    page.getByText('Die Anmeldung wurde nicht abgeschlossen. Bitte starte sie erneut.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await audit(page);
  await page.getByRole('button', { name: 'Zurück zum Profil', exact: true }).click();
  await page.getByTestId('setup-next').waitFor();
});
for (const locale of ['de-DE', 'en-US', 'en-GB'])
  test(
    'independent music preferences survive a real SQLite reload in ' + locale,
    async ({ browser }) => {
      const context = await browser.newContext({ locale, viewport: { width: 375, height: 900 } });
      try {
        const page = await context.newPage();
        await onboard(page, locale);
        await page.goto('/profile');
        const de = locale.startsWith('de'),
          names = de ? 'Tonnamen' : 'Note names',
          international = 'International (B und B♭)',
          chosenNames = de ? international : 'German (H and B)',
          harmony = de ? 'Harmonik-System' : 'Harmony labels',
          pitch = de ? 'Kammerton a¹' : 'Reference pitch A4',
          sound = de ? 'Klang' : 'Sound';
        await page.getByRole('button', { name: new RegExp('^' + names + ',') }).click();
        await page.getByRole('radio', { name: chosenNames, exact: true }).click();
        await page.getByRole('button', { name: new RegExp('^' + harmony + ',') }).click();
        await page
          .getByRole('radio', { name: de ? 'Stufen' : 'Scale degrees', exact: true })
          .click();
        await page.getByRole('button', { name: new RegExp('^' + pitch + ',') }).click();
        await audit(page);
        await page.getByRole('radio', { name: '442 Hz', exact: true }).click();
        await page.getByRole('switch', { name: sound, exact: true }).click();
        await expect(page.getByRole('switch', { name: sound, exact: true })).not.toBeChecked();
        await expect(
          page.getByText(
            de
              ? 'Diese Einstellungen sind auf diesem Gerät gespeichert.'
              : 'These settings are saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        // Wait for an unrelated route render and a second profile load before the cold reload.
        await page.goto('/practice');
        await page.getByRole('heading').last().waitFor();
        await page.goto('/profile');
        await expect(
          page.getByRole('button', { name: names + ', ' + chosenNames, exact: true }),
        ).toBeVisible();
        await page.reload();
        await expect(
          page.getByRole('button', { name: names + ', ' + chosenNames, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: pitch + ', 442 Hz', exact: true }),
        ).toBeVisible();
        await expect(page.getByRole('switch', { name: sound, exact: true })).not.toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('lang', de ? 'de' : locale);
        await audit(page);
        await noOverflow(page);
      } finally {
        await context.close();
      }
    },
  );
