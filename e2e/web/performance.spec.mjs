import { test, expect } from '@playwright/test';
import { onboard, expandFirstLesson } from './helpers.mjs';
import { readFileSync } from 'node:fs';
const budgets = JSON.parse(
  readFileSync(new URL('../../tools/qa/budgets.json', import.meta.url), 'utf8'),
);
test('local browser startup and lesson-open budgets', async ({ page, context }, testInfo) => {
  test.setTimeout(90000);
  await onboard(page);
  const cdp = await context.newCDPSession(page),
    startup = [],
    lesson = [];
  for (let i = 0; i < 5; i++) {
    await cdp.send('Network.clearBrowserCache');
    await page.goto('/');
    await page.getByTestId('path-area-all').waitFor();
    startup.push(await page.evaluate(() => performance.now()));
    const start = performance.now();
    await expandFirstLesson(page, 'de-DE');
    await page
      .getByRole('button', {
        name: /^Mit \d+ Aufgaben? starten$|^Nächste Einführungskarte$|^Lektion fortsetzen$/,
      })
      .first()
      .waitFor();
    lesson.push(performance.now() - start);
  }
  const percentile = (values) =>
    [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
  const report = {
    kind: 'local-chromium-proxy',
    samples: 5,
    startup,
    lesson,
    startupP95: percentile(startup),
    lessonP95: percentile(lesson),
    physicalDeviceEvidence: false,
    audibleLatencyMeasured: false,
  };
  await testInfo.attach('performance.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  console.log('Local browser timing: ' + JSON.stringify(report));
  expect(report.startupP95).toBeLessThan(budgets.startupMs);
  expect(report.lessonP95).toBeLessThan(budgets.lessonOpenMs);
});
