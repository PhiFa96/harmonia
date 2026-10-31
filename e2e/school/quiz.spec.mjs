import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createSchoolDatabase } from '../../tools/school/database.mjs';
import { createSchoolServer } from '../../tools/school/server.mjs';
import { createQuizService } from '../../tools/school/quiz-service.mjs';
import { quizFixture } from '../../tools/school/quiz-fixture.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
import { quizText } from '../../packages/i18n/src/school-quiz.ts';
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
async function right(id, index) {
  const { items } = (
    await db.pool.query('select items from school_draft.quiz_material where quiz_id=$1', [id])
  ).rows[0];
  return items[index].item.choices.find((c) => evaluateExercise(items[index].item, c).correct);
}
async function select(page, answer) {
  const radios = page.locator('input[name=quiz-answer]');
  await expect(radios.first()).toBeVisible();
  const i = await radios.evaluateAll(
    (nodes, value) => nodes.findIndex((n) => n.value === value),
    answer,
  );
  expect(i).toBeGreaterThanOrEqual(0);
  await radios.nth(i).check();
}
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: teacher lobby, code, live projector, audio, reload, ranking and private results`, async ({
    page,
    browser,
  }) => {
    const t = (key, values) => quizText(locale, key, values),
      s = (key) => schoolText(locale, key),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await login(page, 'teacherA', locale);
    await page.getByRole('button', { name: t('entry'), exact: true }).click();
    await page.getByLabel(t('title'), { exact: true }).fill('Quiz original draft');
    await page.getByLabel(t('source'), { exact: true }).selectOption('hearing');
    await page.getByLabel(t('count'), { exact: true }).fill('2');
    await page.getByRole('button', { name: t('create'), exact: true }).click();
    const code = await page.locator('.quiz-panel code').textContent(),
      id = new URL(page.url()).hash.slice(6);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      learner = await context.newPage();
    learner.on('pageerror', (e) => errors.push(e.message));
    learner.on('dialog', (d) => d.accept());
    await login(learner, 'learnerA', locale);
    await learner.getByRole('button', { name: t('entry'), exact: true }).click();
    await learner.getByLabel(t('code'), { exact: true }).fill(code);
    const consent = learner.getByLabel(t('rankingConsent'), { exact: true });
    await expect(consent).not.toBeChecked();
    await consent.check();
    await learner.getByRole('button', { name: t('join'), exact: true }).click();
    await expect(learner.getByText(t('waiting'), { exact: true })).toBeVisible();
    await expect(
      page.getByText(t('participation', { players: 1, answered: 0 }), { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: t('projector'), exact: true }).click();
    await expect(page.getByLabel(s('account'), { exact: true })).not.toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: t('start'), exact: true }).click();
    for (let index = 0; index < 2; index++) {
      await expect(
        learner.getByText(t('round', { index: index + 1, total: 2 }), { exact: true }),
      ).toBeVisible();
      await expect(learner.locator('.score')).toHaveCount(0);
      await learner.getByRole('button', { name: t('play'), exact: true }).click();
      await learner.getByRole('button', { name: t('stop'), exact: true }).click();
      if (index === 0) {
        expect((await new AxeBuilder({ page: learner }).analyze()).violations).toEqual([]);
        expect(
          await learner.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        ).toBe(true);
      }
      await select(learner, await right(id, index));
      await learner.getByRole('button', { name: t('send'), exact: true }).click();
      await expect(learner.getByText(t('saved'), { exact: true })).toBeVisible();
      if (index === 0) {
        await learner.reload();
        await learner.getByLabel('Sprache', { exact: true }).selectOption(locale);
        await expect(learner.getByText(t('saved'), { exact: true })).toBeVisible();
      }
      await expect(
        page.getByText(t('participation', { players: 1, answered: 1 }), { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: t('reveal'), exact: true }).click();
      await expect(learner.getByRole('heading', { name: t('board'), exact: true })).toBeVisible();
      await page.getByRole('button', { name: t('next'), exact: true }).click();
    }
    await expect(
      learner.getByText(t('score', { correct: 2, total: 2 }), { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t('results'), exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: t('exitProjector'), exact: true }).click();
    await expect(
      page.getByText(t('coverage', { included: 0, participants: 1 }), { exact: true }),
    ).toBeVisible();
    await f.act('learnerA', 'sharing', { class: f.classId, enabled: true });
    await expect(
      page.getByText(t('coverage', { included: 1, participants: 1 }), { exact: true }),
    ).toBeVisible();
    await learner.getByRole('button', { name: t('rankingOff'), exact: true }).click();
    await expect(page.getByText(t('noBoard'), { exact: true })).toBeVisible();
    await f.act('learnerA', 'sharing', { class: f.classId, enabled: false });
    await expect(
      page.getByText(t('coverage', { included: 0, participants: 1 }), { exact: true }),
    ).toBeVisible();
    await context.close();
    expect(errors).toEqual([]);
  });
test('deadline, connection recovery, changed teacher rights and notation remain authoritative', async ({
  page,
}) => {
  const q = createQuizService(db.pool),
    created = await q.call(f.ids.teacherA, 'create', {
      class: f.classId,
      title: 'Deadline fixture',
      seconds: 15,
      blocks: [{ key: 'notes', count: 2 }],
    }),
    id = created.id,
    t = (key) => quizText('de', key);
  await q.call(f.ids.learnerA, 'join', { code: created.code, ranking: false });
  await q.call(f.ids.teacherA, 'start', { id, index: -1 });
  await login(page, 'learnerA', 'de', `${app.origin}/#quiz=${id}`);
  await expect(page.locator('.score')).toBeVisible();
  await page.context().setOffline(true);
  await expect(page.getByText(t('reconnecting'), { exact: true })).toBeVisible();
  await expect(page.locator('input[name=quiz-answer]')).toHaveCount(0);
  await page.context().setOffline(false);
  await expect(page.locator('.score')).toBeVisible();
  await db.pool.query(
    "update school_draft.quizzes set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [id],
  );
  await expect(page.getByRole('heading', { name: t('review'), exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: t('send'), exact: true })).toHaveCount(0);
  await page.getByLabel(schoolText('de', 'account'), { exact: true }).selectOption('teacherA');
  await f.act('adminA', 'removeTeacher', { org: f.org, actor: f.ids.teacherA });
  await expect(page.getByText(t('unavailable'), { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: t('next'), exact: true })).toHaveCount(0);
});
