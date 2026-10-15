import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { buildSite } from '../../tools/storefront/build.mjs';
import { buildGuides, messages } from '../../tools/beta/guide.mjs';
import { createBetaServer } from '../../tools/beta/server.mjs';
import { issueAccess, savePrivateJson } from '../../tools/beta/access.mjs';
import { candidateFiles } from '../../tools/beta/web.mjs';
import { summarizeWeek } from '../../tools/beta/study.mjs';
import { renderWeeklyReport } from '../../tools/beta/report.mjs';
import { audit, noOverflow } from '../web/helpers.mjs';
let dir, root, server, base, credentials;
test.beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'harmonia-beta-browser-'));
  root = join(dir, 'web');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(root);
  writeFileSync(
    join(root, 'index.html'),
    '<html lang="de"><title>Own synthetic app entry</title><main>Own app fixture</main></html>',
  );
  buildSite(root);
  buildGuides(root, null);
  const study = JSON.parse(
    readFileSync(new URL('../../tools/beta/study.example.json', import.meta.url), 'utf8'),
  );
  study.dataKind = 'synthetic';
  writeFileSync(
    join(root, 'weekly.html'),
    renderWeeklyReport(
      summarizeWeek(study, '2026-09-01', '2026-09-08', Date.parse('2026-09-10T12:00:00.000Z')),
    ),
  );
  const issued = issueAccess(
    { version: 1, testers: [] },
    new Date(Date.now() + 86400000).toISOString(),
  );
  const accessFile = join(dir, 'access.json');
  savePrivateJson(accessFile, issued.access);
  credentials = { username: issued.id, password: issued.token };
  server = createBetaServer({ root, accessFile, files: candidateFiles(root) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + server.address().port;
});
test.afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (dir) rmSync(dir, { recursive: true, force: true });
});
for (const locale of ['de-DE', 'en-US', 'en-GB'])
  test(
    locale + ' private guide, template, keyboard, axe and shared design',
    async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        locale,
        httpCredentials: credentials,
        viewport: { width: 375, height: 850 },
        colorScheme: locale === 'en-GB' ? 'dark' : 'light',
        reducedMotion: 'reduce',
      });
      const page = await context.newPage(),
        errors = [],
        external = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (new URL(request.url()).origin !== base) external.push(request.url());
      });
      try {
        const response = await page.goto(base + '/beta/' + locale + '.html');
        expect(response.status()).toBe(200);
        expect(response.headers()['cache-control']).toBe('no-store');
        await expect(
          page.getByRole('heading', { name: messages[locale].title, exact: true }),
        ).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('ol li')).toHaveCount(4);
        await expect(page.getByText(messages[locale].pending, { exact: true })).toBeVisible();
        expect(await page.locator('a[href^="mailto:"]').count()).toBe(0);
        await audit(page);
        await noOverflow(page);
        await page.locator('nav a').last().focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
        await page.goto(base + '/beta/' + locale + '.html');
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('link', { name: messages[locale].template, exact: true }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('feedback-' + locale + '.txt');
        const file = await download.path();
        expect(readFileSync(file, 'utf8')).toBe(messages[locale].templateBody);
        await page.screenshot({ path: testInfo.outputPath('beta-guide.png'), fullPage: true });
        expect(errors).toEqual([]);
        expect(external).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );
test('private guide works without JavaScript and keeps entry behind Basic access', async ({
  browser,
}) => {
  const denied = await browser.newContext(),
    authorized = await browser.newContext({
      httpCredentials: credentials,
      javaScriptEnabled: false,
      viewport: { width: 320, height: 700 },
    });
  try {
    const response = await denied.request.get(base + '/beta/de-DE.html');
    expect(response.status()).toBe(401);
    expect(await response.text()).toBe('');
    const page = await authorized.newPage();
    await page.goto(base + '/beta/de-DE.html');
    await page.getByRole('link', { name: 'en-US', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: messages['en-US'].title, exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await page.getByRole('link', { name: messages['en-US'].start, exact: true }).click();
    await expect(page.getByRole('main')).toHaveText('Own app fixture');
  } finally {
    await denied.close();
    await authorized.close();
  }
});
test('guide at 320px with doubled text and private empty weekly report remain accessible', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
      httpCredentials: credentials,
      viewport: { width: 320, height: 750 },
    }),
    page = await context.newPage();
  try {
    await page.goto(base + '/beta/de-DE.html');
    await page.evaluate(() => {
      for (const node of document.querySelectorAll('body *')) {
        if (
          node instanceof HTMLElement &&
          Array.from(node.childNodes).some(
            (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
          )
        )
          node.style.fontSize = parseFloat(getComputedStyle(node).fontSize) * 2 + 'px';
      }
    });
    await noOverflow(page);
    await audit(page);
    await page.screenshot({
      path: testInfo.outputPath('beta-guide-large-text.png'),
      fullPage: true,
    });
    await page.goto(base + '/weekly.html');
    await expect(
      page.getByText('SYNTHETISCHE TESTDATEN · KEINE ECHTE BETA', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/0 Personen mit bestätigter erster Nutzung/)).toBeVisible();
    await noOverflow(page);
    await audit(page);
    await page.screenshot({ path: testInfo.outputPath('beta-report-empty.png'), fullPage: true });
  } finally {
    await context.close();
  }
});
