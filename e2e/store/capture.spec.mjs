import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { locales } from '../../tools/storefront/model.mjs';
import { onboard, expandFirstLesson, startLesson } from '../web/helpers.mjs';
for (const locale of locales)
  test(locale + ' genuine guest app reference media', async ({ browser }, testInfo) => {
    const output = process.env.HARMONIA_STORE_CAPTURE_DIR;
    if (!output) throw Error('Use store:capture with a verified isolated preview fixture');
    const dir = join(output, locale);
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({
      locale,
      colorScheme: 'light',
      viewport: { width: 440, height: 956 },
      deviceScaleFactor: 3,
      reducedMotion: 'reduce',
      recordVideo: { dir: join(testInfo.outputDir, 'raw'), size: { width: 440, height: 956 } },
    });
    let page = await context.newPage();
    try {
      await onboard(page, locale);
      await page.close();
      page = await context.newPage();
      const started = Date.now(),
        errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      await page
        .getByRole('heading', {
          name: locale === 'de-DE' ? 'Dein Lernpfad' : 'Your learning path',
          exact: true,
        })
        .waitFor();
      const shot = async (id) => {
        await page.screenshot({ path: join(dir, id + '.png'), animations: 'disabled' });
        await page.waitForTimeout(2500);
      };
      await shot('learning-path');
      await expandFirstLesson(page, locale);
      await shot('introduction');
      await startLesson(page, locale);
      await shot('exercise');
      await page
        .getByRole('button', { name: locale === 'de-DE' ? 'Hinweis 1' : 'Hint 1', exact: true })
        .click();
      await page
        .getByRole('heading', {
          name: locale === 'de-DE' ? 'Dein Hinweis' : 'Your hint',
          exact: true,
        })
        .waitFor();
      await shot('hint');
      const remaining = 22000 - (Date.now() - started);
      if (remaining > 0) await page.waitForTimeout(remaining);
      expect(errors).toEqual([]);
      const video = page.video();
      await page.close();
      await video.saveAs(join(dir, 'preview.webm'));
    } finally {
      await context.close();
    }
  });
