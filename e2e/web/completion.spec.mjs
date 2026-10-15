import { test, expect } from '@playwright/test';
import { onboard, expandFirstLesson, startLesson, audit } from './helpers.mjs';
test('completed assisted lesson persists without bypassing the pass threshold', async ({
  page,
}, testInfo) => {
  await onboard(page);
  await expandFirstLesson(page, 'de-DE');
  await startLesson(page, 'de-DE');
  let count = 0;
  while (count < 35) {
    if (await page.getByRole('heading', { name: 'Lektion beendet', exact: true }).count()) break;
    const review = page.getByRole('button', { name: 'Wiederholung starten', exact: true });
    if (await review.count()) {
      await review.click();
      continue;
    }
    await page.getByTestId('exercise-question').waitFor();
    // Explicit solution use guarantees this run cannot earn first-attempt unlocking credit.
    for (const label of ['Hinweis 1', 'Hinweis 2', 'Lösung erklären'])
      await page.getByRole('button', { name: label, exact: true }).click();
    await page
      .getByTestId(/^answer-/)
      .first()
      .click();
    await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
    await page.getByTestId('exercise-next').click();
    count++;
  }
  await expect(
    page.getByRole('heading', { name: 'Lektion beendet', exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText(/^\+?0 XP$/)).toBeVisible();
  await audit(page);
  await page.screenshot({
    path: testInfo.outputPath('completed-assisted-lesson.png'),
    fullPage: true,
  });
  await expect(page.getByRole('button', { name: 'Zurück zum Lernen', exact: true })).toBeEnabled();
  await page.goto('/privacy');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Daten herunterladen', exact: true }).click();
  const stream = await (await downloading).createReadStream();
  const chunks = [];
  for await (const part of stream) chunks.push(part);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  const lessons = exported.sections.local.learning.filter((row) => row.event.kind === 'lesson');
  expect(lessons).toHaveLength(1);
  expect(lessons[0].event.lessonId).toBe('fundament.reading-and-listening.1');
  expect(lessons[0].reward?.amount ?? 0).toBe(0);
  await page.reload();
  await page.getByRole('heading', { name: 'Freiwillige Nutzungsstatistik', exact: true }).waitFor();
  const again = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Daten herunterladen', exact: true }).click();
  const body = [];
  for await (const part of await (await again).createReadStream()) body.push(part);
  const restored = JSON.parse(Buffer.concat(body).toString()).sections.local.learning.filter(
    (row) => row.event.kind === 'lesson',
  );
  expect(restored.map((row) => row.event.id)).toEqual(lessons.map((row) => row.event.id));
});
