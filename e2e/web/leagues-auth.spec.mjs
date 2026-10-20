import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { lessonPlan, lessonEvent } from '../../packages/content/src/index.ts';
import {
  createLessonSession,
  answerLesson,
  expectedAnswer,
  nextLessonExercise,
} from '../../packages/exercises/src/index.ts';
import { onboard, audit, noOverflow } from './helpers.mjs';
const enabled = process.env.HARMONIA_QA_LOCAL_AUTH === '1';
const users = [],
  cohorts = new Set();
let status, session;
async function api(path, { method = 'GET', body, token, admin = false } = {}) {
  const response = await fetch(new URL(path, status.API_URL), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw Error('Local league fixture request failed: ' + String(response.status));
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
test.describe('local authenticated league integration', () => {
  test.skip(!enabled, 'Explicit local Auth fixture required; use tools/qa/export-local-auth.mjs.');
  test.beforeAll(async () => {
    status = JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    const url = new URL(status.API_URL);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw Error('Local backend only');
    for (let i = 0; i < 2; i++) {
      const email = 'league-browser-' + randomUUID() + '@example.invalid',
        password = randomUUID() + 'Aa!42';
      const user = await api('/auth/v1/admin/users', {
        admin: true,
        method: 'POST',
        body: { email, password, email_confirm: true },
      });
      users.push(user.id);
      const login = await api('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
      });
      if (i === 0) session = login;
      await api('/rest/v1/rpc/save_profile_settings', {
        method: 'POST',
        token: login.access_token,
        body: { patch: { displayName: 'PRIVATE PROFILE NAME' } },
      });
      const plan = lessonPlan(catalogue, 'notation.l1.staff.anchor'),
        id = randomUUID();
      let lesson = createLessonSession(plan, id);
      for (const item of lesson.initial.items)
        lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
      const event = lessonEvent(id, lesson, Date.now() - 1000, Date.now(), 'UTC');
      await api('/functions/v1/access', {
        token: login.access_token,
        method: 'POST',
        body: {
          id,
          source: {
            kind: 'lesson',
            lessonId: event.lessonId,
            contentVersion: event.contentVersion,
            seed: event.seed,
            planKey: event.planKey,
          },
        },
      });
      await api('/functions/v1/learning-sync', {
        token: login.access_token,
        method: 'POST',
        body: { events: [event], since: 0, rowFormat: 4, rewardFormat: 2 },
      });
      const memberships = await api('/rest/v1/league_members', { token: login.access_token });
      memberships.forEach((m) => cohorts.add(m.cohort_id));
    }
  });
  test.afterAll(async () => {
    if (!status) return;
    for (const id of users)
      await api('/auth/v1/admin/users/' + id, { admin: true, method: 'DELETE' });
    for (const id of cohorts) {
      const members = await api('/rest/v1/league_members?cohort_id=eq.' + id, { admin: true });
      if (!members.length)
        await api('/rest/v1/league_cohorts?id=eq.' + id, { admin: true, method: 'DELETE' });
    }
  });
  for (const scenario of [
    { locale: 'de-DE', width: 375, colorScheme: 'light' },
    { locale: 'en-US', width: 1280, colorScheme: 'light' },
    { locale: 'en-GB', width: 375, colorScheme: 'dark', reducedMotion: 'reduce' },
  ])
    test(
      scenario.locale + ' real league, offline recovery and privacy',
      async ({ browser }, testInfo) => {
        const { width, ...options } = scenario;
        const context = await browser.newContext({
            ...options,
            timezoneId: 'Europe/Berlin',
            viewport: { width, height: 900 },
          }),
          page = await context.newPage();
        const de = scenario.locale.startsWith('de'),
          errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        try {
          const marker = await page.request.get('/harmonia-qa-fixture.json');
          expect((await marker.json()).localAuth).toBe(true);
          await onboard(page, scenario.locale);
          // Standard Supabase persisted-session fixture; no application state/test hook.
          await page.evaluate(
            ({ value, key }) => localStorage.setItem(key, JSON.stringify(value)),
            {
              value: session,
              key: 'sb-' + new URL(status.API_URL).hostname.split('.')[0] + '-auth-token',
            },
          );
          await page.goto('/leagues');
          const ownRow = page.getByText(de ? /Platz \d+ · Du · \d+ XP/ : /Rank \d+ · You · \d+ XP/);
          await expect(ownRow).toBeVisible();
          await expect(
            page
              .getByText(de ? /Platz \d+ · Lernperson \d+ ·/ : /Rank \d+ · Learner \d+ ·/)
              .first(),
          ).toBeVisible();
          await expect(page.getByText('PRIVATE PROFILE NAME', { exact: false })).toHaveCount(0);
          await expect(page.getByText(/Montag, 00:00 UTC|Monday at 00:00 UTC/)).toBeVisible();
          await expect(
            page.getByText(de ? /Im Web erscheinen Ergebnisse/ : /On the web, results appear/),
          ).toBeVisible();
          await audit(page);
          await noOverflow(page);
          await page.screenshot({
            path: testInfo.outputPath('leagues-authenticated.png'),
            fullPage: true,
          });
          await context.route('**/rest/v1/rpc/learner_league', (route) =>
            route.abort('internetdisconnected'),
          );
          await page
            .getByRole('button', {
              name: de ? 'Liga aktualisieren' : 'Refresh league',
              exact: true,
            })
            .click();
          await expect(
            page.getByText(
              de
                ? /Diese Rangliste stammt vom letzten Abruf/
                : /This leaderboard shows the last update/,
            ),
          ).toBeVisible();
          await expect(ownRow).toBeVisible();
          await context.unroute('**/rest/v1/rpc/learner_league');
          await page
            .getByRole('button', {
              name: de ? 'Liga aktualisieren' : 'Refresh league',
              exact: true,
            })
            .click();
          await expect(
            page.getByText(
              de
                ? /Diese Rangliste stammt vom letzten Abruf/
                : /This leaderboard shows the last update/,
            ),
          ).toHaveCount(0);
          await page.reload();
          await expect(ownRow).toBeVisible();
          expect(errors).toEqual([]);
        } finally {
          await context.close();
        }
      },
    );
});
