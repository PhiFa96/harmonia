import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import harmonia from './packages/i18n/eslint/no-hardcoded-text.js';

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/.expo/',
    'artifacts/quality/**',
    'artifacts/beta/**',
    'playwright-report/**',
    'test-results/**',
  ]),
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Texte nur über packages/i18n (ADR 0003); Tests dürfen feste Texte prüfen.
    files: ['**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.test.tsx'],
    plugins: { harmonia },
    rules: {
      'harmonia/no-hardcoded-text': 'error',
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      'e2e/web/**/*.mjs',
      'e2e/beta/**/*.mjs',
      'e2e/voice-leading/**/*.mjs',
      'e2e/school/**/*.mjs',
      'e2e/certificates/**/*.mjs',
    ],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
