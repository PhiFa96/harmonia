import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../../e2e/voice-leading',
  outputDir: '../../artifacts/quality/voice-leading',
  timeout: 30000,
  workers: 1,
  reporter: 'list',
  use: {
    viewport: { width: 1200, height: 900 },
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
});
