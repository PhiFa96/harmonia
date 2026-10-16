import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
for (const scenario of [
  { locale: 'de-DE', width: 375, colorScheme: 'light' },
  { locale: 'en-US', width: 1280, colorScheme: 'light' },
  { locale: 'en-GB', width: 375, colorScheme: 'dark', reducedMotion: 'reduce' },
])
  test(
    scenario.locale + ' guest league entry, glossary and accessibility',
    async ({ browser }, testInfo) => {
      const { width, ...options } = scenario;
      const context = await browser.newContext({ ...options, viewport: { width, height: 900 } }),
        page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        await onboard(page, scenario.locale);
        const de = scenario.locale.startsWith('de');
        await page.getByRole('tab', { name: de ? 'Ligen' : 'Leagues', exact: true }).click();
        await expect(
          page.getByRole('heading', {
            name: de ? 'Gemeinsam lernen' : 'Learn together',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByText('fff · fortississimo', { exact: true })).toBeVisible();
        await expect(
          page.getByText(de ? 'äußerst laut' : 'extremely loud', { exact: true }),
        ).toBeVisible();
        await expect(page.getByText(/Platz 1 ·|Rank 1 ·/)).toHaveCount(0);
        await noOverflow(page);
        await audit(page);
        await page.screenshot({ path: testInfo.outputPath('leagues-guest.png'), fullPage: true });
        await page
          .getByRole('button', {
            name: de ? 'Anmelden oder Konto erstellen' : 'Sign in or create an account',
            exact: true,
          })
          .click();
        await expect(
          page.getByText(
            de
              ? /Die E-Mail-Anmeldung ist hier noch nicht verfügbar/
              : /Email sign-in is not available here yet/,
          ),
        ).toBeVisible();
        await page
          .getByRole('button', {
            name: de ? 'Zurück zum Profil' : 'Back to profile',
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: de ? 'Datenschutz und Daten' : 'Privacy and data',
            exact: true,
          })
          .click();
        const master = page.getByRole('switch', {
          name: de ? 'Systemmitteilungen erlauben' : 'Allow system notifications',
          exact: true,
        });
        await expect(master).not.toBeChecked();
        await master.click();
        await expect(master).toBeChecked();
        await master.click();
        await expect(master).not.toBeChecked();
        await audit(page);
        await noOverflow(page);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );
