import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignmentBank,
  freezeAssignment,
  materialDigest,
  questionView,
} from './assignment-content.mjs';
import { ASSIGNMENT_MESSAGES, assignmentText } from '../../packages/i18n/src/school-assignments.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: every offered lesson and block renders all tasks without unsupported inputs`, () => {
    const bank = assignmentBank(locale);
    assert.equal(bank.length, 7);
    for (const source of bank) {
      assert.ok(source.label?.trim());
      const material = freezeAssignment([{ key: source.key, count: 1 }]);
      assert.equal(material.items.length, source.tasks);
      for (const [index, { item }] of material.items.entries()) {
        const q = questionView(item, index, material.items.length, locale);
        assert.ok(q.prompt);
        assert.equal(q.choices.length, item.choices.length);
        assert.ok(q.choices.every((c) => c.label));
        if (source.key === 'hearing') {
          assert.equal(q.svg, null);
          assert.equal(q.description, null);
          assert.ok(q.audio.tones.length);
        } else {
          assert.match(q.svg, /<svg/);
          assert.ok(q.description);
          assert.equal(q.audio, null);
        }
      }
      assert.equal(materialDigest(JSON.parse(JSON.stringify(material.items))), material.digest);
    }
  });
test('bounds, canonical material digest and complete assignment translations', () => {
  assert.throws(
    () => freezeAssignment(Array.from({ length: 5 }, () => ({ key: 'notes', count: 10 }))),
    /invalid/,
  );
  assert.throws(() => freezeAssignment([{ key: 'notation.l1.staff.anchor', count: 2 }]), /invalid/);
  assert.equal(
    materialDigest({ b: 1, a: [{ y: 2, x: 3 }] }),
    materialDigest({ a: [{ x: 3, y: 2 }], b: 1 }),
  );
  assert.notEqual(materialDigest([1, 2]), materialDigest([2, 1]));
  for (const locale of ['de', 'en-US', 'en-GB']) {
    assert.deepEqual(
      Object.keys(ASSIGNMENT_MESSAGES[locale]).sort(),
      Object.keys(ASSIGNMENT_MESSAGES.de).sort(),
    );
    for (const [key, value] of Object.entries(ASSIGNMENT_MESSAGES.de))
      assert.deepEqual(
        ASSIGNMENT_MESSAGES[locale][key].match(/{{\w+}}/g)?.sort(),
        value.match(/{{\w+}}/g)?.sort(),
      );
    assert.ok(!assignmentText(locale, 'progress', { index: 1, total: 3 }).includes('{{'));
  }
});
test('production bundle rejects assignment draft text and private material identifiers', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-assignment-bundle-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const value of [
    'assignment_material',
    ASSIGNMENT_MESSAGES.de.intro,
    ASSIGNMENT_MESSAGES['en-US'].draftPolicy,
  ]) {
    writeFileSync(join(dir, 'app.js'), `globalThis.value=${JSON.stringify(value)};`);
    const r = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /P4.14/);
  }
});
