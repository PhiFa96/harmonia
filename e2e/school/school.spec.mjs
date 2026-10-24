import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  createSchoolDatabase,
  seedSchoolFixtures,
  FIXTURE_ACTORS,
} from '../../tools/school/database.mjs';
import { createSchoolService } from '../../tools/school/service.mjs';
import { createSchoolServer } from '../../tools/school/server.mjs';
import { schoolText } from '../../packages/i18n/src/school-draft.ts';

let database, app;
test.beforeAll(async () => {
  database = await createSchoolDatabase();
  app = await createSchoolServer({ pool: database.pool });
});
test.afterAll(async () => {
  await app?.close();
  await database?.close();
});
test.beforeEach(async () => {
  await database.pool.query(
    'truncate school_draft.organizations,school_draft.actors restart identity cascade',
  );
  await seedSchoolFixtures(database.pool);
});

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: organization, invitation, class, sharing, teacher report, revocation and deletion`, async ({
    page,
  }) => {
    const t = (key, values) => schoolText(locale, key, values);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await page.goto(app.origin);
    await page.getByLabel('Sprache', { exact: true }).selectOption(locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('title'));
    const switchActor = async (key) => {
      await page.getByLabel(t('account'), { exact: true }).selectOption(key);
      await expect(page.getByLabel(t('account'), { exact: true })).toHaveValue(key);
      await expect(page.locator('[aria-busy=true]')).toHaveCount(0);
    };
    await page.getByLabel(t('orgLabel'), { exact: true }).fill('Synthetic School A');
    await page.getByRole('button', { name: t('createOrg'), exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Synthetic School A', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: t('inviteTeacher'), exact: true }).click();
    const teacherCode = await page.locator('code').innerText();
    expect(teacherCode).toMatch(/^SCHOOL-/);
    await switchActor('teacherA');
    await page.getByLabel(t('code'), { exact: true }).fill(teacherCode);
    await page.getByRole('button', { name: t('join'), exact: true }).click();
    await page.getByLabel(t('classLabel'), { exact: true }).fill('Synthetic Class A');
    await page.getByRole('button', { name: t('createClass'), exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Synthetic Class A', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: t('inviteLearner'), exact: true }).click();
    const learnerCode = await page.locator('code').innerText();
    await switchActor('learnerA');
    await page.getByLabel(t('code'), { exact: true }).fill(learnerCode);
    await page.getByRole('button', { name: t('join'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('share'), exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: t('view'), exact: true })).toHaveCount(0);
    await switchActor('teacherA');
    await page.getByRole('button', { name: t('view'), exact: true }).click();
    await expect(page.getByText(t('noData'), { exact: true })).toBeVisible();
    await expect(
      page.getByText(t('coverage', { shared: 0, members: 1 }), { exact: true }),
    ).toBeVisible();
    await switchActor('learnerA');
    await page.getByRole('button', { name: t('share'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('withdraw'), exact: true })).toBeVisible();
    await page.reload();
    await page.getByLabel('Sprache', { exact: true }).selectOption(locale);
    await expect(page.getByRole('button', { name: t('withdraw'), exact: true })).toBeVisible();
    await switchActor('teacherA');
    await page.getByRole('button', { name: t('view'), exact: true }).click();
    await expect(
      page.getByText(t('coverage', { shared: 1, members: 1 }), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(t('evidence', { correct: 9, total: 10, percent: 90 }), { exact: true }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: t('detail'), exact: true }).click();
    await expect(page.getByText(t('completed', { count: 1 }), { exact: true })).toBeVisible();
    // A different browser session withdraws the learner's grant while a teacher view is open.
    const other = await page.context().browser().newContext();
    const pupil = await other.newPage();
    pupil.on('dialog', (d) => d.accept());
    await pupil.goto(app.origin);
    await pupil.getByLabel('Synthetisches Testkonto', { exact: true }).selectOption('learnerA');
    await pupil.getByRole('button', { name: schoolText('de', 'withdraw'), exact: true }).click();
    await expect(
      pupil.getByRole('button', { name: schoolText('de', 'share'), exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: t('refresh'), exact: true }).click();
    await expect(page.getByText(t('noData'), { exact: true })).toBeVisible();
    await expect(
      page.getByText(t('evidence', { correct: 9, total: 10, percent: 90 }), { exact: true }),
    ).toHaveCount(0);
    await other.close();
    await page.getByRole('button', { name: t('overview'), exact: true }).click();
    await page.getByRole('button', { name: t('archive'), exact: true }).click();
    await expect(page.getByRole('button', { name: t('view'), exact: true })).toHaveCount(0);
    await switchActor('adminA');
    await page.getByRole('button', { name: t('deleteClass'), exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Synthetic Class A', exact: true })).toHaveCount(
      0,
    );
    expect(errors).toEqual([]);
  });

test('same-school teacher isolation, stale access removal, safe text and narrow keyboard workflow', async ({
  page,
}) => {
  const service = createSchoolService(database.pool),
    ids = Object.fromEntries(FIXTURE_ACTORS.map((a) => [a.key, a.id]));
  const org = (
    await service.act(ids.adminA, 'createOrg', { label: '<img src=x onerror=alert(1)>' })
  ).id;
  const code = await service.act(ids.adminA, 'invite', {
    org,
    class: null,
    kind: 'teacher',
    uses: 2,
  });
  for (const key of ['teacherA', 'teacherB'])
    await service.act(ids[key], 'join', { code: code.code });
  const first = (await service.act(ids.teacherA, 'createClass', { org, label: 'Only A' })).id;
  await service.act(ids.teacherB, 'createClass', { org, label: 'Only B' });
  await page.goto(app.origin);
  await expect(
    page.getByRole('heading', { name: '<img src=x onerror=alert(1)>', exact: true }),
  ).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
  await page.getByLabel('Synthetisches Testkonto', { exact: true }).selectOption('teacherA');
  await expect(page.getByRole('heading', { name: 'Only A', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Only B', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: schoolText('de', 'view'), exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: schoolText('de', 'report'), exact: true }),
  ).toBeVisible();
  await service.act(ids.adminA, 'removeTeacher', { org, actor: ids.teacherA });
  await page.getByRole('button', { name: schoolText('de', 'refresh'), exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Only A', exact: true })).toHaveCount(0);
  const forbidden = await page.request.get(app.origin + '/api/report?class=' + first);
  expect(forbidden.status()).toBe(403);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
