import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  createSchoolDatabase,
  seedSchoolFixtures,
  FIXTURE_ACTORS,
} from '../../tools/school/database.mjs';
import { createSchoolService } from '../../tools/school/service.mjs';
import { createAssignmentService } from '../../tools/school/assignment-service.mjs';
import { createSchoolServer } from '../../tools/school/server.mjs';
import { fixtureAssignmentAnswers } from '../../tools/school/assignment-fixture.mjs';
import { assignmentText } from '../../packages/i18n/src/school-assignments.ts';
import { schoolText } from '../../packages/i18n/src/school-draft.ts';
let db, app, service, first;
const ids = Object.fromEntries(FIXTURE_ACTORS.map((a) => [a.key, a.id]));
test.beforeAll(async () => {
  db = await createSchoolDatabase();
  app = await createSchoolServer({ pool: db.pool });
  service = createSchoolService(db.pool);
});
test.afterAll(async () => {
  await app?.close();
  await db?.close();
});
test.beforeEach(async () => {
  await db.pool.query(
    'truncate school_draft.organizations,school_draft.actors restart identity cascade',
  );
  await seedSchoolFixtures(db.pool);
  const org = (await service.act(ids.adminA, 'createOrg', { label: 'Assignment test school' })).id;
  const teacher = await service.act(ids.adminA, 'invite', {
    org,
    class: null,
    kind: 'teacher',
    uses: 1,
  });
  await service.act(ids.teacherA, 'join', { code: teacher.code });
  first = (await service.act(ids.teacherA, 'createClass', { org, label: 'Assignments class' })).id;
  const learners = await service.act(ids.teacherA, 'invite', {
    org,
    class: first,
    kind: 'learner',
    uses: 2,
  });
  for (const who of ['learnerA', 'learnerB'])
    await service.act(ids[who], 'join', { code: learners.code });
});
async function selectAnswer(page, answer) {
  const radios = page.locator('input[name=assignment-answer]');
  const index = await radios.evaluateAll(
    (nodes, answer) => nodes.findIndex((n) => n.value === answer),
    answer,
  );
  expect(index).toBeGreaterThanOrEqual(0);
  await radios.nth(index).check();
}
async function login(page, key, locale = 'de', url = app.origin) {
  await page.goto(url);
  await page.getByLabel('Sprache', { exact: true }).selectOption(locale);
  await page.getByLabel(schoolText(locale, 'account'), { exact: true }).selectOption(key);
  await expect(page.locator('[aria-busy=true]')).toHaveCount(0);
}
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: compose, assign, protected link, work, resume, grade and withdraw`, async ({
    page,
    browser,
  }) => {
    const t = (key, values) => assignmentText(locale, key, values),
      base = (key) => schoolText(locale, key),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await login(page, 'teacherA', locale);
    await page.getByRole('button', { name: t('assignments'), exact: true }).click();
    await page.getByLabel(t('title'), { exact: true }).fill('Music homework draft');
    await page.getByRole('button', { name: t('add'), exact: true }).click();
    await page.getByLabel(t('source'), { exact: true }).selectOption('hearing');
    await page.getByLabel(t('count'), { exact: true }).fill('2');
    await page.getByRole('button', { name: t('add'), exact: true }).click();
    await expect(page.getByText(t('selection', { count: 10 }), { exact: true })).toBeVisible();
    await page.getByRole('button', { name: t('create'), exact: true }).click();
    const link = await page.getByLabel(t('share'), { exact: true }).inputValue(),
      id = new URL(link).hash.slice('#assignment='.length);
    expect(link).toContain('/#assignment=');
    await expect(page.getByText(t('noScore'), { exact: true })).toBeVisible();
    const answers = await fixtureAssignmentAnswers(db.pool, id),
      context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      learner = await context.newPage();
    learner.on('pageerror', (e) => errors.push(e.message));
    learner.on('dialog', (d) => d.accept());
    await login(learner, 'learnerA', locale, link);
    await learner.getByRole('button', { name: t('start'), exact: true }).click();
    for (const [index, answer] of answers.entries()) {
      await expect(
        learner.getByText(t('progress', { index: index + 1, total: 10 }), { exact: true }),
      ).toBeVisible();
      if (index === 2) {
        await learner.reload();
        await learner.getByLabel('Sprache', { exact: true }).selectOption(locale);
        await expect(
          learner.getByText(t('progress', { index: 3, total: 10 }), { exact: true }),
        ).toBeVisible();
      }
      if (index === 8) {
        await expect(learner.locator('.score')).toHaveCount(0);
        await learner.getByRole('button', { name: t('play'), exact: true }).click();
        await learner.getByRole('button', { name: t('stop'), exact: true }).click();
      }
      if (index === 0) {
        expect((await new AxeBuilder({ page: learner }).analyze()).violations).toEqual([]);
        expect(
          await learner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
      }
      await selectAnswer(learner, index === 0 ? answer.wrong : answer.right);
      await learner.getByRole('button', { name: t('answer'), exact: true }).click();
    }
    await expect(learner.getByRole('heading', { name: t('result'), exact: true })).toBeVisible();
    await expect(
      learner.getByText(t('score', { correct: 9, total: 10 }), { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: base('refresh'), exact: true }).click();
    await expect(page.getByText(t('noScore'), { exact: true })).toBeVisible();
    await learner.getByRole('button', { name: base('overview'), exact: true }).click();
    await learner.getByRole('button', { name: base('share'), exact: true }).click();
    await expect(
      learner.getByRole('button', { name: base('withdraw'), exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: base('refresh'), exact: true }).click();
    await expect(
      page.getByText(t('coverage', { submitted: 1, shared: 1, recipients: 2 }), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(t('score', { correct: 9, total: 10 }), { exact: true }),
    ).toHaveCount(2);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await learner.getByRole('button', { name: base('withdraw'), exact: true }).click();
    await expect(learner.getByRole('button', { name: base('share'), exact: true })).toBeVisible();
    await page.getByRole('button', { name: base('refresh'), exact: true }).click();
    await expect(
      page.getByText(t('score', { correct: 9, total: 10 }), { exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: t('close'), exact: true }).click();
    await expect(page.getByText(t('closed'), { exact: true })).toBeVisible();
    await context.close();
    expect(errors).toEqual([]);
  });
test('lost answer response retries once; late answer is refused; link cannot admit an outsider', async ({
  page,
}) => {
  const a = createAssignmentService(db.pool),
    id = (
      await a.call(ids.teacherA, 'create', {
        class: first,
        title: 'Retry fixture',
        dueAt: new Date(Date.now() + 3600000).toISOString(),
        blocks: [{ key: 'notes', count: 2 }],
      })
    ).id;
  const link = app.origin + '/#assignment=' + id,
    t = (key) => assignmentText('de', key);
  await login(page, 'learnerC', 'de', link);
  await expect(page.getByRole('alert')).toContainText(schoolText('de', 'forbidden'));
  await expect(page.getByRole('heading', { name: 'Retry fixture' })).toHaveCount(0);
  await page.getByLabel(schoolText('de', 'account'), { exact: true }).selectOption('learnerA');
  await page.getByRole('button', { name: t('start'), exact: true }).click();
  const answers = await fixtureAssignmentAnswers(db.pool, id);
  await selectAnswer(page, answers[0].right);
  await page.route(
    '**/api/assignment-answer',
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await page.getByRole('button', { name: t('answer'), exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(schoolText('de', 'error'));
  await page.getByRole('button', { name: t('answer'), exact: true }).click();
  await expect(
    page.getByText(assignmentText('de', 'progress', { index: 2, total: 2 }), { exact: true }),
  ).toBeVisible();
  await db.pool.query(
    "update school_draft.assignments set created_at=now()-interval '2 hours',due_at=now()-interval '1 hour' where id=$1",
    [id],
  );
  await selectAnswer(page, answers[1].right);
  await page.getByRole('button', { name: t('answer'), exact: true }).click();
  await expect(page.getByText(t('deadline'), { exact: true })).toBeVisible();
  await expect(
    page.getByText(assignmentText('de', 'score', { correct: 1, total: 2 }), { exact: true }),
  ).toHaveCount(2); // Overall score and the theory-area score both contain two tasks.
  const r = (
    await db.pool.query(
      'select answered,correct from school_draft.assignment_attempts where assignment_id=$1',
      [id],
    )
  ).rows[0];
  expect(r).toEqual({ answered: 1, correct: 1 });
});
