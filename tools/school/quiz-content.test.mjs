import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ_MESSAGES, quizText } from '../../packages/i18n/src/school-quiz.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
test('quiz locales preserve all texts and interpolation fields', () => {
  for (const locale of ['de', 'en-US', 'en-GB']) {
    assert.deepEqual(
      Object.keys(QUIZ_MESSAGES[locale]).sort(),
      Object.keys(QUIZ_MESSAGES.de).sort(),
    );
    for (const [key, value] of Object.entries(QUIZ_MESSAGES.de))
      assert.deepEqual(
        QUIZ_MESSAGES[locale][key].match(/{{\w+}}/g)?.sort(),
        value.match(/{{\w+}}/g)?.sort(),
      );
    assert.ok(!quizText(locale, 'participation', { players: 30, answered: 20 }).includes('{{'));
  }
});
test('public bundle gate rejects local live quiz text and private material', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-quiz-bundle-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const value of [
    'quiz_material',
    QUIZ_MESSAGES.de.intro,
    QUIZ_MESSAGES['en-US'].projectorNote,
  ]) {
    writeFileSync(join(dir, 'app.js'), `globalThis.value=${JSON.stringify(value)};`);
    const r = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /P4.15/);
  }
});
