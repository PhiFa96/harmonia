import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import expoConfig from '../apps/mobile/app.config.ts';

test('Expo config includes German and English iOS microphone permission strings', () => {
  const config = expoConfig({ config: {} });
  assert.equal(config.ios.infoPlist.CFBundleAllowMixedLocalizations, true);
  assert.deepEqual(config.locales, { de: './locales/de.json', en: './locales/en.json' });
  for (const [locale, expected] of [
    ['de', /Mikrofon.*weder gespeichert noch hochgeladen/],
    ['en', /microphone.*not saved or uploaded/],
  ]) {
    const file = new URL(config.locales[locale], new URL('../apps/mobile/', import.meta.url));
    const message = JSON.parse(readFileSync(file, 'utf8')).NSMicrophoneUsageDescription;
    assert.match(message, expected);
  }
});
