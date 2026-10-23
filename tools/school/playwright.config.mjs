import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '../../e2e/school',
  outputDir: '../../artifacts/quality/school',
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: {
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
});
