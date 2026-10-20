import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow } from './helpers.mjs';
for (const locale of ['de-DE', 'en-US', 'en-GB'])
  test(locale + ' Rush guest entry and keyboard navigation', async ({ browser }) => {
    const context = await browser.newContext({
      locale,
      viewport: { width: 375, height: 900 },
      colorScheme: locale === 'en-GB' ? 'dark' : 'light',
    });
    const page = await context.newPage();
    try {
      await onboard(page, locale);
      await page.goto('/practice');
      await page
        .getByRole('button', {
          name: locale === 'de-DE' ? 'Theorie-Rush öffnen' : 'Open Theory Rush',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('heading', {
          name: locale === 'de-DE' ? 'Theorie-Rush' : 'Theory Rush',
          exact: true,
        }),
      ).toBeVisible();
      const account = page.getByRole('button', {
        name: locale === 'de-DE' ? 'Zum Konto' : 'Go to account',
        exact: true,
      });
      await account.focus();
      await expect(account).toBeFocused();
      await audit(page);
      await noOverflow(page);
      await expect(page.getByRole('button', { name: /Lauf starten|Start run/ })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
