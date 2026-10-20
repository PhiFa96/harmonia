// Real local JWT/Edge/Postgres; only own disposable fixture accounts.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRng, generateExercise, expectedAnswer } from '../../packages/exercises/src/index.ts';
import { onboard, audit, noOverflow } from './helpers.mjs';
const enabled = process.env.HARMONIA_QA_LOCAL_AUTH === '1';
let config;
async function api(path, { method = 'GET', body, token, admin = false } = {}) {
  const r = await fetch(new URL(path, config.API_URL), {
    method,
    headers: {
      apikey: admin ? config.SERVICE_ROLE_KEY : config.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? config.SERVICE_ROLE_KEY : config.ANON_KEY)),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw Error('Local Rush fixture request failed: ' + String(r.status));
  const raw = await r.text();
  return raw ? JSON.parse(raw) : null;
}
const sql = (text) =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_harmonia',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-Atq',
    ],
    { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim();
const postRun = (page, action) =>
  page.waitForResponse(
    (r) =>
      r.url().endsWith('/functions/v1/rush') &&
      r.request().method() === 'POST' &&
      r.request().postDataJSON()?.action === action,
  );
test.describe('authenticated Theory Rush', () => {
  test.skip(!enabled, 'Explicit local Auth fixture build required.');
  test.beforeAll(() => {
    config = JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    const url = new URL(config.API_URL);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw Error('Local backend only');
  });
  for (const scenario of [
    { locale: 'de-DE', mode: 'three', label: '3 Minuten', width: 375 },
    { locale: 'en-US', mode: 'five', label: '5 minutes', width: 1280 },
    { locale: 'en-GB', mode: 'survival', label: 'Survival', width: 375 },
  ])
    test(
      scenario.locale + ' ' + scenario.mode + ' verified run, reconnect and leaderboard',
      async ({ browser }, testInfo) => {
        const email = 'rush-browser-' + randomUUID() + '@example.invalid',
          password = randomUUID() + 'Aa!42';
        const user = await api('/auth/v1/admin/users', {
          admin: true,
          method: 'POST',
          body: { email, password, email_confirm: true },
        });
        const session = await api('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: { email, password },
        });
        const context = await browser.newContext({
            locale: scenario.locale,
            viewport: { width: scenario.width, height: 900 },
            colorScheme: scenario.locale === 'en-GB' ? 'dark' : 'light',
            reducedMotion: 'reduce',
          }),
          page = await context.newPage();
        const de = scenario.locale === 'de-DE',
          errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        try {
          expect(
            (await (await page.request.get('/harmonia-qa-fixture.json')).json()).localAuth,
          ).toBe(true);
          await onboard(page, scenario.locale);
          await page.evaluate(
            (value) => localStorage.setItem('sb-127-auth-token', JSON.stringify(value)),
            session,
          );
          await page.goto('/rush');
          await page.getByRole('button', { name: scenario.label, exact: true }).click();
          const started = postRun(page, 'start');
          await page
            .getByRole('button', { name: de ? 'Lauf starten' : 'Start run', exact: true })
            .click();
          const startResponse = await started;
          expect(startResponse.status()).toBe(200);
          let run = await startResponse.json();
          expect(run.mode).toBe(scenario.mode);
          await page.getByTestId('exercise-question').waitFor();
          await expect(
            page.getByRole('button', { name: /^Hinweis [123]$|^Hint [123]$/ }),
          ).toHaveCount(0);
          await audit(page);
          await noOverflow(page);
          for (let i = 0; i < 5; i++) {
            const item = generateExercise(run.question.spec, createRng(run.question.seed)),
              right = expectedAnswer(item);
            const value = i < 2 ? right : item.choices.find((c) => c !== right);
            await page.getByTestId('answer-' + value).click();
            await page.waitForTimeout(400); // Exercise the actual server response-time bound.
            const answered = postRun(page, 'answer');
            await page.getByRole('button', { name: de ? 'Prüfen' : 'Check', exact: true }).click();
            const response = await answered;
            expect(response.status()).toBe(200);
            run = await response.json();
            await page.getByTestId('exercise-next').click();
            if (i === 1) {
              await page.reload();
              await page.getByTestId('exercise-question').waitFor();
              await expect(
                page.getByText(
                  de ? 'Aufgabe 3 · Schwierigkeitsstufe 1' : 'Question 3 · Difficulty level 1',
                  { exact: true },
                ),
              ).toBeVisible();
              await context.route('**/functions/v1/rush', (route) =>
                route.abort('internetdisconnected'),
              );
              await page
                .getByTestId(
                  'answer-' +
                    expectedAnswer(
                      generateExercise(run.question.spec, createRng(run.question.seed)),
                    ),
                )
                .click();
              await page
                .getByRole('button', { name: de ? 'Prüfen' : 'Check', exact: true })
                .click();
              await expect(page.getByRole('alert')).toContainText(de ? 'Verbindung' : 'connection');
              await context.unroute('**/functions/v1/rush');
              await page
                .getByRole('button', {
                  name: de ? 'Bestätigten Stand laden' : 'Load confirmed progress',
                  exact: true,
                })
                .click();
              await expect(page.getByRole('alert')).toHaveCount(0);
            }
          }
          expect(run.state).toBe('finished');
          expect(run.xp).toBe(2);
          await expect(
            page.getByText(de ? '2 XP wurden gutgeschrieben.' : '2 XP has been credited.', {
              exact: true,
            }),
          ).toBeVisible();
          await expect(page.getByTestId('rush-own-rank')).toContainText('20');
          await expect(
            page.getByRole('button', { name: de ? 'Lauf starten' : 'Start run', exact: true }),
          ).toBeDisabled();
          await page.getByRole('button', { name: de ? 'Freunde' : 'Friends', exact: true }).click();
          await expect(page.getByTestId('rush-own-rank')).toContainText('20');
          await audit(page);
          await noOverflow(page);
          await page.screenshot({
            path: testInfo.outputPath('rush-confirmed.png'),
            fullPage: true,
          });
          expect(errors).toEqual([]);
        } finally {
          await context.close();
          const groups = sql(
            "select cohort_id from public.league_members where user_id='" + user.id + "';",
          )
            .split('\n')
            .filter(Boolean);
          await api('/auth/v1/admin/users/' + user.id, { admin: true, method: 'DELETE' });
          for (const id of groups)
            sql(
              "delete from public.league_cohorts where id='" +
                id +
                "' and not exists(select 1 from public.league_members where cohort_id='" +
                id +
                "');",
            );
        }
      },
    );
});
