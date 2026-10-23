import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeClass } from './report.ts';
import { SCHOOL_DRAFT_MESSAGES, schoolText } from '../../packages/i18n/src/school-draft.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('class aggregation weights answers and excludes missing or unshared data', () => {
  const row = (correct, total, sharing = true) => ({
    actor: 'fixture',
    alias: 'P',
    sharing,
    areas: [{ area: 'notation', correct, total, completed: 1, at: '2026-10-23T00:00:00.000Z' }],
  });
  const result = summarizeClass([
    row(1, 1),
    row(5, 10),
    row(100, 100, false),
    { actor: 'empty', alias: 'Empty', sharing: true, areas: [] },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].correct, 6);
  assert.equal(result[0].total, 11);
  assert.equal(result[0].completed, 2);
  assert.deepEqual(
    summarizeClass([{ actor: 'empty', alias: 'Empty', sharing: false, areas: [] }]),
    [],
  );
});
test('all school draft locales have complete matching placeholders', () => {
  for (const locale of ['de', 'en-US', 'en-GB']) {
    assert.deepEqual(
      Object.keys(SCHOOL_DRAFT_MESSAGES[locale]).sort(),
      Object.keys(SCHOOL_DRAFT_MESSAGES.de).sort(),
    );
    for (const [key, text] of Object.entries(SCHOOL_DRAFT_MESSAGES.de)) {
      assert.ok(SCHOOL_DRAFT_MESSAGES[locale][key].trim());
      assert.deepEqual(
        text.match(/{{\w+}}/g)?.sort(),
        SCHOOL_DRAFT_MESSAGES[locale][key].match(/{{\w+}}/g)?.sort(),
      );
    }
    assert.ok(!schoolText(locale, 'coverage', { shared: 1, members: 2 }).includes('{{'));
  }
});
test('production bundle gate rejects school draft copy and schema identifiers', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-school-bundle-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const value of [
    'school_draft',
    SCHOOL_DRAFT_MESSAGES.de.title,
    SCHOOL_DRAFT_MESSAGES['en-US'].privacy,
  ]) {
    writeFileSync(join(dir, 'app.js'), `globalThis.draft=${JSON.stringify(value)};`);
    const r = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /P4.13/);
  }
  writeFileSync(join(dir, 'app.js'), 'globalThis.app="Harmonia";');
  assert.equal(spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir]).status, 0);
});
