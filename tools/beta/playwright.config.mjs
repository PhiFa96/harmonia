import { defineConfig } from '@playwright/test';
import qa from '../qa/playwright.config.mjs';
// These tests create their own temporary loopback fixture with synthetic credentials/data.
export default defineConfig({
  ...qa,
  testDir: '../../e2e/beta',
  webServer: undefined,
});
