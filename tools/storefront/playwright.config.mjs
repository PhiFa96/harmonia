import { defineConfig } from '@playwright/test';
import base from '../qa/playwright.config.mjs';
export default defineConfig({ ...base, testDir: '../../e2e/store', timeout: 90000 });
