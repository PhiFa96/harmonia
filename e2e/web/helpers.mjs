import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
export const copy = (locale) =>
  locale.startsWith('de')
    ? {
        check: 'Prüfen',
        skip: 'Gratis weiterlernen',
        age: 'Ich bin mindestens 16 Jahre alt',
        intro: 'Nächste Einführungskarte',
        open: 'Lektion ansehen',
        resume: 'Lektion fortsetzen',
        profile: 'Profil',
        appearance: 'Erscheinungsbild',
        close: 'Schließen',
      }
    : {
        check: 'Check',
        skip: 'Continue for free',
        age: 'I am at least 16 years old',
        intro: 'Next introduction card',
        open: 'View lesson',
        resume: 'Resume lesson',
        profile: 'Profile',
        appearance: 'Appearance',
        close: 'Close',
      };
export async function audit(page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) })),
  ).toEqual([]);
}
export async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}
export async function onboard(page, locale = 'de-DE', { navigate = true } = {}) {
  const text = copy(locale);
  if (navigate) await page.goto('/');
  await page.getByTestId('setup-next').waitFor();
  const next = () => page.getByTestId('setup-next').click();
  const choice = (id) => page.getByTestId('setup-choice-' + id).click();
  await next();
  await choice('hobby');
  await next();
  await choice('new');
  await next();
  await choice('later');
  await next();
  await next();
  await next();
  await page.getByTestId('exercise-question').waitFor();
  // Use the visible note positions, not a hidden answer or application state hook.
  const direction = await page.locator('svg text').evaluateAll((nodes) => {
    const notes = nodes.filter((n) => n.textContent === '\uE0A3');
    if (notes.length !== 2) throw new Error('Expected two visible half notes');
    const y = notes.map((n) => Number(n.getAttribute('y')));
    return y[1] < y[0] ? 'up' : y[1] > y[0] ? 'down' : 'same';
  });
  await page.getByTestId('answer-interval-direction:' + direction).click();
  await page.getByRole('button', { name: text.check, exact: true }).click();
  await page.getByTestId('exercise-next').click();
  await page.getByRole('switch', { name: text.age, exact: true }).click();
  await next();
  await page.getByRole('button', { name: text.skip, exact: true }).click();
  await page
    .getByRole('heading', {
      name: locale.startsWith('de') ? 'Dein Lernpfad' : 'Your learning path',
      exact: true,
    })
    .waitFor();
}
export async function expandFirstLesson(page, locale) {
  const text = copy(locale);
  if ((await page.getByRole('button', { name: text.open, exact: true }).count()) === 0)
    await page
      .getByRole('button', { name: locale.startsWith('de') ? /Lektionen in/ : /Show lessons in/ })
      .first()
      .click();
  await page.getByRole('button', { name: text.open, exact: true }).click();
}
export async function startLesson(page, locale) {
  const text = copy(locale);
  for (let i = 0; i < 10; i++) {
    if (await page.getByRole('button', { name: text.intro, exact: true }).count())
      await page.getByRole('button', { name: text.intro, exact: true }).click();
    else break;
  }
  await page
    .getByRole('button', {
      name: locale.startsWith('de')
        ? /^Mit \d+ Aufgaben? starten$/
        : /^Start \d+ (questions|question)$/,
    })
    .click();
  await page.getByTestId('exercise-question').waitFor();
}
