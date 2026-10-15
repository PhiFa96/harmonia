import { defineConfig } from '@playwright/test';
import { resolve, sep } from 'node:path';
const evidenceRoot = new URL('../../artifacts/quality/', import.meta.url).pathname;
const outputDir = resolve(process.env.HARMONIA_QA_OUTPUT ?? resolve(evidenceRoot, 'playwright'));
const fixtureDir = resolve(process.env.HARMONIA_QA_DIR ?? 'apps/mobile/dist');
// Playwright clears its output directory. Never allow it to erase source or fixture builds.
if (
  !outputDir.startsWith(evidenceRoot) ||
  outputDir === fixtureDir ||
  fixtureDir.startsWith(outputDir + sep)
)
  throw new Error('Quality output must be a separate child of artifacts/quality.');
const port = Number(process.env.HARMONIA_QA_PORT ?? 8223);
const baseURL = process.env.HARMONIA_QA_URL ?? `http://127.0.0.1:${port}`;
const target = new URL(baseURL);
if (
  target.protocol !== 'http:' ||
  !['127.0.0.1', 'localhost'].includes(target.hostname) ||
  target.username ||
  target.password
)
  throw new Error('QA runs only against an explicit local fixture server.');
export default defineConfig({
  testDir: '../../e2e/web',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir,
  use: {
    baseURL,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: process.env.HARMONIA_QA_URL
    ? undefined
    : {
        command: 'node tools/serve-web.mjs',
        cwd: new URL('../..', import.meta.url).pathname,
        url: baseURL,
        reuseExistingServer: false,
        env: {
          HARMONIA_PREVIEW_PORT: String(port),
          ...(process.env.HARMONIA_QA_DIR
            ? { HARMONIA_PREVIEW_DIR: process.env.HARMONIA_QA_DIR }
            : {}),
        },
      },
});
