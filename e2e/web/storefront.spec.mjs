import { test, expect } from '@playwright/test';
import { catalog, locales, pagePath } from '../../tools/storefront/model.mjs';
import { audit, noOverflow } from './helpers.mjs';
for (const locale of locales)
  test(locale + ' static website, support and app entry', async ({ browser }, testInfo) => {
    const t = catalog[locale],
      context = await browser.newContext({
        locale,
        viewport: { width: locale === 'en-US' ? 1280 : 375, height: 900 },
        colorScheme: locale === 'en-GB' ? 'dark' : 'light',
        reducedMotion: 'reduce',
      });
    const page = await context.newPage(),
      errors = [],
      external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (new URL(r.url()).origin !== new URL(testInfo.project.use.baseURL).origin)
        external.push(r.url());
    });
    try {
      await page.goto(pagePath(locale));
      await expect(page.getByRole('heading', { name: t.headline, exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', t.lang);
      await expect(page.locator('meta[name=robots]')).toHaveAttribute(
        'content',
        'noindex,nofollow',
      );
      expect(await page.locator('script').count()).toBe(0);
      await audit(page);
      await noOverflow(page);
      const question = page.locator('summary').first();
      await question.focus();
      await page.keyboard.press('Enter');
      await expect(question.locator('..')).toHaveAttribute('open', '');
      await page.screenshot({ path: testInfo.outputPath('website.png'), fullPage: true });
      await page.getByRole('link', { name: t.navSupport, exact: true }).first().click();
      await expect(page.getByRole('heading', { name: t.supportTitle, exact: true })).toBeVisible();
      await expect(page.getByText(t.supportUnavailable, { exact: true })).toBeVisible();
      expect(await page.locator('a[href^="mailto:"]').count()).toBe(0);
      await audit(page);
      await noOverflow(page);
      await page.getByRole('link', { name: t.back, exact: false }).click();
      await page.getByRole('link', { name: t.openApp, exact: false }).first().click();
      await page.getByTestId('setup-next').waitFor();
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    } finally {
      await context.close();
    }
  });
test('static site works without JavaScript and keeps native keyboard disclosure', async ({
  browser,
}) => {
  const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 700 },
    }),
    page = await context.newPage();
  try {
    await page.goto(pagePath('de-DE'));
    await page.getByRole('link', { name: catalog['en-GB'].language, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: catalog['en-GB'].headline, exact: true }),
    ).toBeVisible();
    const question = page.locator('summary').first();
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(question.locator('..')).toHaveAttribute('open', '');
    await noOverflow(page);
  } finally {
    await context.close();
  }
});
test('320px layout and 200 percent text keep content and navigation available', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(pagePath('de-DE'));
  await page.evaluate(() => {
    for (const node of document.querySelectorAll('body *')) {
      if (
        !(node instanceof HTMLElement) ||
        !Array.from(node.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
        )
      )
        continue;
      const style = getComputedStyle(node);
      node.style.fontSize = parseFloat(style.fontSize) * 2 + 'px';
    }
  });
  await noOverflow(page);
  await audit(page);
  await page.screenshot({ path: testInfo.outputPath('website-large-text.png'), fullPage: true });
});
