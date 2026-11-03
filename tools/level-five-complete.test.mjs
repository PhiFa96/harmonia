import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogue } from '../packages/content/src/authoring.ts';
import { parseScore } from '../packages/notation/src/index.ts';
import { validateContentExample } from './validate-content-example.mjs';

test('A10: the spectral model stays within two ledger lines without changing its pitches', () => {
  const example = catalogue.knowledgeCards.find(
    (c) => c.id === 'contemporary.l5.process.card-spectralmodel',
  )?.examples[0];
  assert.ok(example);
  const score = parseScore(example.score),
    letters = 'CDEFGAB',
    values = [];
  for (const staff of score.staves) {
    const bottom = staff.clef === 'bass' ? 18 : 30;
    for (const measure of staff.measures)
      for (const voice of measure.voices)
        for (const event of voice.events) {
          const notes =
            event.kind === 'note'
              ? [event.pitch]
              : event.kind === 'chord'
                ? event.notes.map((n) => n.pitch)
                : [];
          for (const pitch of notes) {
            values.push(pitch.letter + pitch.octave);
            const position = pitch.octave * 7 + letters.indexOf(pitch.letter);
            assert.ok(Math.floor(Math.max(0, bottom - position, position - bottom - 8) / 2) <= 2);
          }
        }
  }
  assert.deepEqual(values.sort(), ['C3', 'C4', 'C5', 'G4']);
});

test('separate teaching parts pass the actual content validator while keyboard target constraints remain', () => {
  const examples = catalogue.knowledgeCards
    .filter(
      (c) =>
        c.id.startsWith('counterpoint.l5.species.') ||
        c.id === 'contemporary.l5.process.card-spectralmodel',
    )
    .flatMap((c) => c.examples);
  assert.equal(examples.length, 5);
  for (const example of examples) {
    assert.equal(example.staffPresentation, 'parts');
    assert.doesNotThrow(() =>
      validateContentExample(
        example.score,
        example.keyboard,
        example.pulse,
        example.staffPresentation,
      ),
    );
    assert.throws(() =>
      validateContentExample(example.score, { first: 21, last: 108 }, undefined, 'parts'),
    );
  }
  assert.throws(() => validateContentExample('treble | 4/4 | C4/1', undefined, undefined, 'parts'));
});

test('the completion script is idempotent and preserves unrelated records and translations', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-level-five-authoring-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const paths = [
    'packages/content/src/catalogue.json',
    'packages/content/src/curriculum-plan.json',
    'packages/i18n/src/authored-content.json',
    'packages/i18n/src/messages/level-five-exercise.json',
  ];
  for (const path of [...paths, 'tools/complete-level-five.py']) {
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(new URL('../' + path, import.meta.url), destination);
  }
  const read = () => paths.map((p) => JSON.parse(readFileSync(join(root, p), 'utf8'))),
    before = read();
  for (let i = 0; i < 2; i++) {
    const result = spawnSync('python3', [join(root, 'tools/complete-level-five.py')], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(read(), before);
  }
});
