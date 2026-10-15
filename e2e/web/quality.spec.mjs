import { test, expect } from '@playwright/test';
import { audit, noOverflow, onboard, expandFirstLesson, startLesson, copy } from './helpers.mjs';
for (const scenario of [
  { name: 'DE phone', locale: 'de-DE', width: 375, colorScheme: 'light' },
  { name: 'US keyboard', locale: 'en-US', width: 1280, colorScheme: 'light' },
  {
    name: 'UK dark reduced motion',
    locale: 'en-GB',
    width: 375,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  },
])
  test(
    scenario.name + ' guest learning, reload, keyboard and accessibility',
    async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        locale: scenario.locale,
        colorScheme: scenario.colorScheme,
        reducedMotion: scenario.reducedMotion ?? 'no-preference',
        viewport: { width: scenario.width, height: 900 },
      });
      await context.addInitScript(() => {
        if (window.Notification)
          window.Notification.requestPermission = () => {
            throw new Error('Unrequested notification permission');
          };
      });
      const page = await context.newPage(),
        errors = [],
        unexpected = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('request', (r) => {
        if (/\/functions\/v1\/analytics|api\.anthropic|revenuecat/.test(r.url()))
          unexpected.push(r.url());
      });
      try {
        await page.goto('/');
        await page.getByTestId('setup-next').waitFor();
        await audit(page);
        await noOverflow(page);
        const first = page.getByTestId('setup-choice-device');
        await first.focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByTestId('setup-choice-de')).toHaveAttribute('aria-checked', 'true');
        // Restore device locale before going through the real persisted guest flow.
        await first.focus();
        await page.keyboard.press('Space');
        await expect(first).toHaveAttribute('aria-checked', 'true');
        await expect(page.locator('html')).toHaveAttribute(
          'lang',
          scenario.locale.startsWith('de') ? 'de' : scenario.locale,
        );
        // Keep this page: reloading here can precede the asynchronous SQLite preference save.
        await onboard(page, scenario.locale, { navigate: false });
        await audit(page);
        await page.screenshot({ path: testInfo.outputPath('learning-path.png'), fullPage: true });
        await noOverflow(page);
        await page.reload();
        await page
          .getByRole('button', { name: copy(scenario.locale).open, exact: true })
          .or(
            page.getByRole('heading', {
              name: scenario.locale.startsWith('de') ? 'Dein Lernpfad' : 'Your learning path',
              exact: true,
            }),
          )
          .first()
          .waitFor();
        await expandFirstLesson(page, scenario.locale);
        await startLesson(page, scenario.locale);
        await audit(page);
        await context.setOffline(true);
        await page
          .getByRole('button', {
            name: scenario.locale.startsWith('de') ? 'Hinweis 1' : 'Hint 1',
            exact: true,
          })
          .click();
        await expect(
          page.getByText(
            scenario.locale.startsWith('de')
              ? 'Dein aktueller Stand ist auf diesem Gerät gespeichert.'
              : 'Your current progress is saved on this device.',
            { exact: true },
          ),
        ).toBeVisible();
        await context.setOffline(false);
        await page.reload();
        await page.getByRole('button', { name: copy(scenario.locale).resume, exact: true }).click();
        await expect(
          page.getByRole('heading', {
            name: scenario.locale.startsWith('de') ? 'Dein Hinweis' : 'Your hint',
            exact: true,
          }),
        ).toBeVisible();
        await page.getByTestId('exercise-question').waitFor();
        await page.goto('/profile');
        const appearance = page.getByRole('button', {
          name: new RegExp('^' + copy(scenario.locale).appearance + ','),
        });
        await appearance.focus();
        if (scenario.reducedMotion === 'reduce') {
          await page.evaluate(() => {
            window.__sheetOpacityProbe = new Promise((resolve) => {
              const samples = [];
              const observer = new MutationObserver(() => {
                const panel = document.querySelector('[data-testid="bottom-sheet-panel"]');
                if (!panel) return;
                observer.disconnect();
                const end = performance.now() + 250;
                const sample = () => {
                  samples.push(Number(getComputedStyle(panel).opacity));
                  if (performance.now() < end) requestAnimationFrame(sample);
                  else resolve(samples);
                };
                sample();
              });
              observer.observe(document.body, { childList: true, subtree: true });
            });
          });
        }
        await appearance.click();
        const dialog = page.getByRole('dialog', {
          name: copy(scenario.locale).appearance,
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await audit(page);
        if (scenario.reducedMotion === 'reduce') {
          const samples = await page.evaluate(() => window.__sheetOpacityProbe);
          expect(samples.length).toBeGreaterThan(0);
          expect(samples.every((opacity) => opacity >= 0.999)).toBe(true);
        }
        await page.setViewportSize({ width: scenario.width, height: 420 });
        await dialog.evaluate((element) => {
          for (const node of element.querySelectorAll('*')) {
            if (
              !(node instanceof HTMLElement) ||
              !Array.from(node.childNodes).some(
                (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
              )
            )
              continue;
            const style = getComputedStyle(node);
            node.style.fontSize = parseFloat(style.fontSize) * 2 + 'px';
            node.style.lineHeight = parseFloat(style.lineHeight) * 2 + 'px';
          }
        });
        await page.screenshot({ path: testInfo.outputPath('dialog-large-text.png') });
        const box = await page.getByTestId('bottom-sheet-panel').boundingBox();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(421);
        await page.getByRole('radio').first().focus();
        await page.keyboard.press('ArrowDown');
        await expect(dialog).toBeHidden();
        await expect(appearance).toBeFocused();
        await page.setViewportSize({ width: scenario.width, height: 900 });
        await page.goto('/privacy');
        await page
          .getByRole('heading', {
            name: scenario.locale.startsWith('de')
              ? 'Freiwillige Nutzungsstatistik'
              : 'Optional usage statistics',
            exact: true,
          })
          .waitFor();
        await audit(page);
        await noOverflow(page);
        await page.goto('/does-not-exist-qa');
        await page
          .getByRole('heading', {
            name: scenario.locale.startsWith('de')
              ? 'Diese Seite gibt es nicht.'
              : 'This page could not be found.',
            exact: true,
          })
          .last()
          .waitFor();
        await audit(page);
        expect(errors).toEqual([]);
        expect(unexpected).toEqual([]);
      } finally {
        await context.close();
      }
    },
  );
for (const path of ['/legal', '/privacy', '/cancel-subscription'])
  test('Public accessible ' + path, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('heading').last().waitFor();
    await audit(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await noOverflow(page);
  });
