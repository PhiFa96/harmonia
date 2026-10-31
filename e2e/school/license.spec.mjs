import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createSchoolDatabase } from '../../tools/school/database.mjs';
import { createSchoolServer } from '../../tools/school/server.mjs';
import { quizFixture } from '../../tools/school/quiz-fixture.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
import { licenseText } from '../../packages/i18n/src/school-license.ts';
import { schoolText } from '../../packages/i18n/src/school-draft.ts';
let db, app, f;
test.beforeAll(async () => {
  db = await createSchoolDatabase();
  app = await createSchoolServer({ pool: db.pool });
});
test.afterAll(async () => {
  await app?.close();
  await db?.close();
});
test.beforeEach(async () => {
  f = await quizFixture(db.pool);
});
async function login(page, key, locale = 'de', url = app.origin) {
  await page.goto(url);
  await page.getByLabel('Sprache', { exact: true }).selectOption(locale);
  await page.getByLabel(schoolText(locale, 'account'), { exact: true }).selectOption(key);
  await expect(page.locator('[aria-busy=true]')).toHaveCount(0);
}
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: operator invoice, download, school seats and enforced Premium revocation`, async ({
    page,
    browser,
  }) => {
    const t = (key, v) => licenseText(locale, key, v),
      s = (key) => schoolText(locale, key),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await login(page, 'operator', locale);
    await page.getByRole('button', { name: t('entry'), exact: true }).click();
    await page.getByLabel(t('seats'), { exact: true }).fill('1');
    await page.getByRole('button', { name: t('create'), exact: true }).click();
    await expect(page.getByText(t('draft'), { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: t('assign'), exact: true })).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: t('invoice'), exact: true }).click();
    const download = await downloadPromise;
    expect(await readFile(await download.path(), 'utf8')).toContain(t('invoiceTitle'));
    await page.getByRole('button', { name: t('pay'), exact: true }).click();
    await expect(page.getByText(t('paid'), { exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByLabel(s('account'), { exact: true }).selectOption('adminA');
    await page
      .locator('[data-seat-actor=learnerA]')
      .getByRole('button', { name: t('assign'), exact: true })
      .click();
    await expect(
      page.getByText(t('capacity', { used: 1, seats: 1 }), { exact: true }),
    ).toBeVisible();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      learner = await context.newPage();
    learner.on('pageerror', (e) => errors.push(e.message));
    await login(learner, 'learnerA', locale);
    await learner.getByRole('button', { name: t('entry'), exact: true }).click();
    await expect(learner.getByText(t('premium'), { exact: true })).toBeVisible();
    await expect(learner.getByRole('button', { name: t('invoice'), exact: true })).toHaveCount(0);
    await learner.getByRole('button', { name: t('newQuestion'), exact: true }).click();
    await expect(learner.locator('.score')).toBeVisible();
    await learner.reload();
    await learner.getByLabel('Sprache', { exact: true }).selectOption(locale);
    await expect(learner.locator('.score')).toBeVisible();
    const id = new URL(learner.url()).hash.slice('#school-practice='.length),
      item = (
        await db.pool.query('select item from school_draft.license_practice where id=$1', [id])
      ).rows[0].item,
      answer = item.choices.find((a) => evaluateExercise(item, a).correct),
      radios = learner.locator('input[name=license-answer]');
    await expect(radios.first()).toBeVisible();
    const index = await radios.evaluateAll(
      (nodes, value) => nodes.findIndex((n) => n.value === value),
      answer,
    );
    await radios.nth(index).check();
    await learner.getByRole('button', { name: t('answer'), exact: true }).click();
    await expect(learner.getByText(t('correct'), { exact: true })).toBeVisible();
    await learner.getByLabel(t('practice'), { exact: true }).selectOption('hearing');
    await learner.getByRole('button', { name: t('newQuestion'), exact: true }).click();
    await expect(learner.locator('.score')).toHaveCount(0);
    await learner.getByRole('button', { name: t('play'), exact: true }).click();
    await learner.getByRole('button', { name: t('stop'), exact: true }).click();
    expect((await new AxeBuilder({ page: learner }).analyze()).violations).toEqual([]);
    expect(await learner.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator('[data-seat-actor=learnerA]')
      .getByRole('button', { name: t('release'), exact: true })
      .click();
    await expect(learner.getByText(t('licenseRequired'), { exact: true })).toBeVisible({
      timeout: 7500,
    });
    await expect(learner.locator('input[name=license-answer]')).toHaveCount(0);
    await learner
      .locator('[data-school-content]')
      .getByRole('button', { name: t('refresh'), exact: true })
      .click();
    await expect(learner.getByText(t('free'), { exact: true })).toBeVisible();
    await page.getByLabel(s('account'), { exact: true }).selectOption('operator');
    await page.getByRole('button', { name: t('cancel'), exact: true }).click();
    await expect(page.getByText(t('void'), { exact: true })).toBeVisible();
    await context.close();
    expect(errors).toEqual([]);
  });
test('an expired practice deep link can be replaced without losing a valid licence', async ({
  page,
}) => {
  const { createLicenseService } = await import('../../tools/school/license-service.mjs');
  const { randomUUID } = await import('node:crypto');
  const l = createLicenseService(db.pool),
    id = randomUUID(),
    practice = randomUUID();
  await l.call(f.ids.operator, 'create', {
    id,
    org: f.org,
    seats: 1,
    unitCents: 250,
    days: 30,
    startsAt: null,
  });
  await l.call(f.ids.operator, 'pay', { id });
  await l.call(f.ids.adminA, 'assign', { id, actor: f.ids.learnerA, enabled: true });
  await l.call(f.ids.learnerA, 'practice', { id: practice, source: 'notes', locale: 'de' });
  await db.pool.query(
    "update school_draft.license_practice set created_at=clock_timestamp()-interval '2 hours' where id=$1",
    [practice],
  );
  await login(page, 'learnerA', 'de', app.origin);
  await page.goto(app.origin + '/#school-practice=' + practice);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(licenseText('de', 'practiceExpired'));
  await page
    .locator('[data-school-content]')
    .getByRole('button', { name: licenseText('de', 'refresh'), exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: licenseText('de', 'newQuestion'), exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: licenseText('de', 'newQuestion'), exact: true }).click();
  await expect(page.locator('.score')).toBeVisible();
});
