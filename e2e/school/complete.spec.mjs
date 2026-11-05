import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createSchoolDatabase } from '../../tools/school/database.mjs';
import { createSchoolServer } from '../../tools/school/server.mjs';
import { quizFixture } from '../../tools/school/quiz-fixture.mjs';
import { schoolText } from '../../packages/i18n/src/school-draft.ts';
import { licenseText } from '../../packages/i18n/src/school-license.ts';
import { keys, epoch, issuer } from '../../tools/school/auth-fixture.mjs';
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
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: renewed sharing, assignment audit, export and account deletion`, async ({
    page,
  }, testInfo) => {
    const t = (key, values) => schoolText(locale, key, values),
      license = (key) => licenseText(locale, key);
    await db.pool.query(
      "update school_draft.class_members set sharing=true,sharing_policy='school-draft-sharing-v1' where actor_id=$1",
      [f.ids.learnerA],
    );
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(app.origin);
    await page.getByLabel('Sprache', { exact: true }).selectOption(locale);
    await page.getByLabel(t('account'), { exact: true }).selectOption('learnerA');
    const schoolClass = page.locator(`[data-class="${f.classId}"]`);
    await expect(schoolClass.getByRole('button', { name: t('share'), exact: true })).toBeVisible();
    await expect(schoolClass.getByText(t('shareInfo'), { exact: true })).toBeVisible();
    await schoolClass.getByRole('button', { name: t('share'), exact: true }).click();
    await expect(
      schoolClass.getByRole('button', { name: t('withdraw'), exact: true }),
    ).toBeVisible();
    await schoolClass.getByRole('button', { name: t('auditTitle'), exact: true }).click();
    await expect(schoolClass.locator('[data-teacher-audit]')).toContainText(t('teacherA'));
    await page.getByRole('button', { name: license('entry'), exact: true }).click();
    await expect(page.getByText(license('requestInfo'), { exact: true })).toBeVisible();
    await page.getByRole('button', { name: license('requestSeat'), exact: true }).click();
    await expect(
      page.getByRole('button', { name: license('withdrawRequest'), exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: license('withdrawRequest'), exact: true }).click();
    await expect(
      page.getByRole('button', { name: license('requestSeat'), exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: t('privacyTitle'), exact: true }).click();
    await expect(page.getByRole('heading', { name: t('privacyTitle'), exact: true })).toBeVisible();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: t('exportData'), exact: true }).click();
    const download = await downloading;
    const data = JSON.parse(await readFile(await download.path(), 'utf8'));
    expect(data.actor.id).toBe(f.ids.learnerA);
    expect(JSON.stringify(data)).not.toContain(f.ids.learnerB);
    expect(data.sharingEvents.at(-1).policy).toBe('school-draft-sharing-v2');
    const alternate = locale === 'de' ? 'en-US' : 'de';
    await page.getByLabel(t('language'), { exact: true }).selectOption(alternate);
    await expect(
      page.getByRole('heading', { name: schoolText(alternate, 'privacyTitle'), exact: true }),
    ).toBeVisible();
    await page.getByLabel(schoolText(alternate, 'language'), { exact: true }).selectOption(locale);
    await expect(page.getByRole('heading', { name: t('privacyTitle'), exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    if (locale === 'de')
      await page.screenshot({ path: testInfo.outputPath('school-privacy.png'), fullPage: true });
    await page.getByRole('button', { name: t('deleteAccount'), exact: true }).click();
    await expect(page.getByText(t('accountDeleted'), { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: t('exportData'), exact: true })).toHaveCount(0);
    expect((await page.request.get(app.origin + '/api/state')).status()).toBe(401);
  });
test('verified token mode hides fixture selection and removes the view at expiry', async ({
  browser,
}) => {
  const signing = keys();
  let now = epoch;
  const authenticated = await createSchoolServer({
    pool: db.pool,
    authentication: { issuer, jwks: { keys: [signing.jwk] } },
    now: () => now,
  });
  const context = await browser.newContext({
    extraHTTPHeaders: { authorization: 'Bearer ' + signing.token() },
  });
  try {
    const page = await context.newPage();
    await page.goto(authenticated.origin);
    await expect(
      page.getByText(schoolText('de', 'authenticatedIntro'), { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(schoolText('de', 'account'), { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: schoolText('de', 'privacyTitle'), exact: true }).click();
    now = epoch + 60000;
    await page.getByRole('button', { name: schoolText('de', 'exportData'), exact: true }).click();
    await expect(page.getByText(schoolText('de', 'sessionEnded'), { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: schoolText('de', 'deleteAccount'), exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
    await authenticated.close();
  }
});
